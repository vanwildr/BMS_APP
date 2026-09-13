import React, { useState, useEffect } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories, getBudgets } from '../services/api'
import { Plus, Trash2 } from 'lucide-react'
import '../styles/ExpenseSheet.css'

function ExpenseSheet() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7))
  const [editingRowDate, setEditingRowDate] = useState(null) // The date of the row being edited
  const [rowData, setRowData] = useState({
    date: '',
    description: '',
    amounts: {} // { categoryId: amount }
  })
  const [error, setError] = useState(null)

  // Load data on mount
  useEffect(() => {
    loadAllData()
  }, [])

  const getLastDayOfMonth = (year, month) => {
    // month is 1-based (1 = January, 12 = December)
    return new Date(year, month, 0).getDate()
  }

  const loadAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Calculate proper date range for current month
      const [year, month] = currentMonth.split('-').map(Number)
      const lastDay = getLastDayOfMonth(year, month)
      const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`
      const startDate = `${currentMonth}-01`

      console.log(`Loading expenses for ${startDate} to ${endDate}`)

      // Load categories
      const catsResponse = await getCategories()
      console.log('Categories loaded:', catsResponse.data)
      setCategories(catsResponse.data || [])

      // Load expenses for current month
      const expResponse = await getExpenses({
        startDate: startDate,
        endDate: endDate,
        pageSize: 100
      })
      console.log('Expenses loaded:', expResponse.data)
      setExpenses(expResponse.data?.data || [])

      // Load budgets
      try {
        const budgetResponse = await getBudgets({})
        const budgetMap = {}
        if (Array.isArray(budgetResponse.data)) {
          budgetResponse.data.forEach(b => {
            budgetMap[b.categoryName] = b.amount
          })
        }
        setBudgets(budgetMap)
      } catch (e) {
        console.warn('Could not load budgets:', e.message)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getExpenseByDateAndCategory = (date, categoryId) => {
    return expenses.find(
      exp => exp.expenseDate.split('T')[0] === date && exp.categoryId === categoryId
    )
  }

  const handleEditRow = (date) => {
    // Load existing data for this row
    const rowExpenses = expenses.filter(e => e.expenseDate.split('T')[0] === date)
    const amounts = {}
    let description = ''

    rowExpenses.forEach(exp => {
      amounts[exp.categoryId] = exp.amount
      if (!description) description = exp.description
    })

    setEditingRowDate(date)
    setRowData({
      date: date,
      description: description,
      amounts: amounts
    })
  }

  const handleAddNewRow = () => {
    const todayDate = new Date().toISOString().split('T')[0]
    setEditingRowDate(`new-${Date.now()}`) // Unique ID for new row
    setRowData({
      date: todayDate,
      description: '',
      amounts: {}
    })
  }

  const handleRowFieldChange = (field, value) => {
    setRowData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRowAmountChange = (categoryId, value) => {
    setRowData(prev => ({
      ...prev,
      amounts: {
        ...prev.amounts,
        [categoryId]: value ? parseFloat(value) : 0
      }
    }))
  }

  const handleSaveRow = async () => {
    if (!rowData.date) {
      alert('Please enter a date')
      return
    }

    if (!rowData.description.trim()) {
      alert('Please enter a description')
      return
    }

    if (Object.keys(rowData.amounts).length === 0 || Object.values(rowData.amounts).every(v => v === 0 || v === '')) {
      alert('Please enter at least one amount')
      return
    }

    try {
      // Get existing expenses for this date
      const existingForDate = expenses.filter(e => e.expenseDate.split('T')[0] === rowData.date)
      const toDelete = new Set(existingForDate.map(e => e.id))

      // Create/update expenses
      for (const [categoryId, amount] of Object.entries(rowData.amounts)) {
        if (amount && amount > 0) {
          const existing = existingForDate.find(e => e.categoryId === categoryId)

          if (existing) {
            // Update existing
            await updateExpense(existing.id, {
              ...existing,
              amount: parseFloat(amount),
              description: rowData.description.trim()
            })
            toDelete.delete(existing.id)
          } else {
            // Create new
            await createExpense({
              amount: parseFloat(amount),
              description: rowData.description.trim(),
              expenseDate: rowData.date,
              categoryId: categoryId
            })
          }
        }
      }

      // Delete expenses that were cleared
      for (const id of toDelete) {
        await deleteExpense(id)
      }

      setEditingRowDate(null)
      setRowData({ date: '', description: '', amounts: {} })
      await loadAllData()
    } catch (err) {
      console.error('Error saving row:', err)
      alert('Error saving: ' + (err.response?.data?.message || err.message))
    }
  }

  const validateRow = () => {
    // Returns true if valid, false otherwise (no alerts)
    if (!rowData.date) return false
    if (!rowData.description.trim()) return false
    if (Object.keys(rowData.amounts).length === 0 || Object.values(rowData.amounts).every(v => v === 0 || v === '')) return false
    return true
  }

  const handleCancelEdit = () => {
    setEditingRowDate(null)
    setRowData({ date: '', description: '', amounts: {} })
  }

  const handleRowBlur = async (e) => {
    // Only save if focus is moving outside the row (not to another input in the same row)
    const rowContainer = e.currentTarget
    setTimeout(async () => {
      if (!rowContainer.contains(document.activeElement)) {
        // Focus moved outside the row, try to auto-save only if valid
        if (validateRow()) {
          await handleSaveRow()
        }
      }
    }, 0)
  }

  const handleRowKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleDeleteRow = async (date) => {
    if (!window.confirm('Delete all expenses for ' + formatDateString(date) + '?')) {
      return
    }

    try {
      const rowExpenses = expenses.filter(e => e.expenseDate.split('T')[0] === date)
      await Promise.all(rowExpenses.map(e => deleteExpense(e.id)))
      await loadAllData()
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Error deleting: ' + err.message)
    }
  }

  const getCategoryTotal = (categoryId) => {
    return expenses
      .filter(e => e.categoryId === categoryId)
      .reduce((sum, e) => sum + (e.amount || 0), 0)
  }

  // Format date string to display without timezone issues
  const formatDateString = (dateStr) => {
    if (!dateStr) return ''
    // Parse date string directly (YYYY-MM-DD) without creating Date object to avoid timezone issues
    const [year, month, day] = dateStr.split('-')
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="expense-sheet-container">
        <div className="loading">Loading expense sheet...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="expense-sheet-container">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-primary" onClick={loadAllData}>Retry</button>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="expense-sheet-container">
        <div className="alert alert-warning">
          No categories found. Create some in the Settings first.
        </div>
      </div>
    )
  }

  // Get unique dates from expenses
  const dateSet = new Set(expenses.map(e => e.expenseDate.split('T')[0]))
  const uniqueDates = Array.from(dateSet).sort().reverse()

  // Add 10 empty rows for new entries
  const emptyDates = Array(10).fill(null).map((_, i) => `new-${i}`)
  const allDates = [...uniqueDates, ...emptyDates]

  return (
    <div className="expense-sheet-container">
      <div className="expense-sheet-header">
        <h1>📊 Expense Sheet - {currentMonth}</h1>
        <div className="header-buttons">
          <button className="btn btn-primary" onClick={handleAddNewRow}>
            <Plus size={18} /> New Entry
          </button>
          <button className="btn btn-secondary" onClick={loadAllData}>
            <Plus size={18} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="expense-sheet-wrapper">
        <table className="expense-sheet">
          <thead>
            <tr>
              <th className="col-date">Date</th>
              <th className="col-expense">Description</th>
              {categories.map(cat => (
                <th key={cat.id} className="col-category">
                  {cat.name}
                </th>
              ))}
              <th className="col-action">Action</th>
            </tr>
          </thead>

          <tbody>
            {/* Budget Row */}
            <tr className="budget-row">
              <td colSpan="2" className="budget-label">Budget</td>
              {categories.map(cat => (
                <td key={cat.id} className="budget-cell">
                  ${budgets[cat.name] || 0}
                </td>
              ))}
              <td></td>
            </tr>

            {/* Data Rows */}
            {allDates.map((date, idx) => {
              const isRealDate = !date.startsWith('new-')
              const displayDate = isRealDate ? formatDateString(date) : ''
              const isEditing = editingRowDate === date
              const isExpenseRow = isRealDate && expenses.some(e => e.expenseDate.split('T')[0] === date)

              return (
                <tr key={`${date}-${idx}`} className={isEditing ? 'editing-row' : isExpenseRow ? 'expense-row' : 'empty-row'}>
                  {isEditing ? (
                    // Edit mode - entire row is editable
                    <>
                      <td className="date-cell edit-mode" onBlur={handleRowBlur}>
                        <input
                          type="date"
                          value={rowData.date}
                          onChange={(e) => handleRowFieldChange('date', e.target.value)}
                          onKeyDown={handleRowKeyDown}
                          className="cell-input"
                        />
                      </td>
                      <td className="description-cell edit-mode" onBlur={handleRowBlur}>
                        <input
                          type="text"
                          value={rowData.description}
                          onChange={(e) => handleRowFieldChange('description', e.target.value)}
                          onKeyDown={handleRowKeyDown}
                          placeholder="Description"
                          className="cell-input"
                        />
                      </td>
                      {categories.map(cat => (
                        <td key={cat.id} className="data-cell edit-mode" onBlur={handleRowBlur}>
                          <input
                            type="number"
                            step="0.01"
                            value={rowData.amounts[cat.id] || ''}
                            onChange={(e) => handleRowAmountChange(cat.id, e.target.value)}
                            onKeyDown={handleRowKeyDown}
                            placeholder="0.00"
                            className="cell-input"
                          />
                        </td>
                      ))}
                      <td className="action-cell edit-mode">
                        <button className="btn-cancel" onClick={handleCancelEdit} title="Cancel (ESC)">✕</button>
                      </td>
                    </>
                  ) : (
                    // View mode - display values
                    <>
                      <td className="date-cell" onClick={() => handleEditRow(date)}>
                        {displayDate}
                      </td>
                      <td 
                        className="description-cell" 
                        onClick={() => handleEditRow(date)}
                        title="Click to edit"
                      >
                        {isExpenseRow && expenses.find(e => e.expenseDate.split('T')[0] === date)?.description}
                      </td>
                      {categories.map(cat => {
                        const expense = isRealDate ? getExpenseByDateAndCategory(date, cat.id) : null
                        return (
                          <td
                            key={cat.id}
                            className="data-cell"
                            onClick={() => handleEditRow(date)}
                            title="Click to edit"
                          >
                            {expense && expense.amount > 0 && (
                              <span className="cell-value">${expense.amount.toFixed(2)}</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="action-cell">
                        {isExpenseRow && (
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteRow(date)}
                            title="Delete this date row"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}

            {/* Totals Row */}
            <tr className="total-row">
              <td colSpan="2" className="total-label">Total</td>
              {categories.map(cat => {
                const total = getCategoryTotal(cat.id)
                const budget = budgets[cat.name] || 0
                const isOver = budget > 0 && total > budget

                return (
                  <td
                    key={cat.id}
                    className={`total-cell ${isOver ? 'overspent' : ''}`}
                  >
                    ${total.toFixed(2)}
                  </td>
                )
              })}
              <td></td>
            </tr>

            {/* Remaining Row */}
            <tr className="budget-actual-row">
              <td colSpan="2" className="label">Remaining</td>
              {categories.map(cat => {
                const total = getCategoryTotal(cat.id)
                const budget = budgets[cat.name] || 0
                const remaining = budget - total

                return (
                  <td
                    key={cat.id}
                    className={`status-cell ${remaining < 0 ? 'overspent' : 'under'}`}
                  >
                    {remaining < 0 ? '-' : ''}${Math.abs(remaining).toFixed(2)}
                  </td>
                )
              })}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="help-text">
        💡 <strong>Click any cell</strong> to enter an amount. Press Enter to save, Escape to cancel.
      </div>
    </div>
  )
}

export default ExpenseSheet
