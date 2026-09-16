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
  const [editingExpenseId, setEditingExpenseId] = useState(null) // ID of expense being edited
  const [rowData, setRowData] = useState({
    date: '',
    description: '',
    category_id: '',
    amount: 0
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
        start_date: startDate,
        end_date: endDate,
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
            budgetMap[b.category_name] = b.amount
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

  const getExpenseByDateAndCategory = (date, category_id) => {
    return expenses.find(
      exp => exp.expense_date.split('T')[0] === date && exp.category_id === category_id
    )
  }

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id)
    setRowData({
      date: expense.expense_date.split('T')[0],
      description: expense.description,
      category_id: expense.category_id,
      amount: expense.amount
    })
  }

  const handleAddNewRow = () => {
    const todayDate = new Date().toISOString().split('T')[0]
    setEditingExpenseId('new') // Special ID for new expense
    setRowData({
      date: todayDate,
      description: '',
      category_id: '',
      amount: 0
    })
  }

  const handleRowFieldChange = (field, value) => {
    setRowData(prev => ({
      ...prev,
      [field]: value
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

    if (!rowData.category_id) {
      alert('Please select a category')
      return
    }

    if (!rowData.amount || rowData.amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      if (editingExpenseId === 'new') {
        // Create new expense
        await createExpense({
          amount: parseFloat(rowData.amount),
          description: rowData.description.trim(),
          expense_date: rowData.date,
          category_id: rowData.category_id
        })
      } else {
        // Update existing expense
        await updateExpense(editingExpenseId, {
          amount: parseFloat(rowData.amount),
          description: rowData.description.trim(),
          expense_date: rowData.date,
          category_id: rowData.category_id
        })
      }

      setEditingExpenseId(null)
      setRowData({ date: '', description: '', category_id: '', amount: 0 })
      await loadAllData()
    } catch (err) {
      console.error('Error saving expense:', err)
      alert('Error saving: ' + (err.response?.data?.message || err.message))
    }
  }

  const validateRow = () => {
    if (!rowData.date) return false
    if (!rowData.description.trim()) return false
    if (!rowData.category_id) return false
    if (!rowData.amount || rowData.amount <= 0) return false
    return true
  }

  const handleCancelEdit = () => {
    setEditingExpenseId(null)
    setRowData({ date: '', description: '', category_id: '', amount: 0 })
  }

  const handleRowBlur = async (e) => {
    // Only save if focus is moving outside the row
    const rowContainer = e.currentTarget
    setTimeout(async () => {
      if (!rowContainer.contains(document.activeElement)) {
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

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) {
      return
    }

    try {
      await deleteExpense(expenseId)
      await loadAllData()
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Error deleting: ' + err.message)
    }
  }

  const getCategoryTotal = (category_id) => {
    return expenses
      .filter(e => e.category_id === category_id)
      .reduce((sum, e) => sum + (e.amount || 0), 0)
  }

  // Format date string to display without timezone issues
  const formatDateString = (dateStr) => {
    if (!dateStr) return ''
    // Parse date string directly (YYYY-MM-DD) and format without timezone conversion
    const [year, month, day] = dateStr.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`
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
  const dateSet = new Set(expenses.map(e => e.expense_date.split('T')[0]))
  const uniqueDates = Array.from(dateSet).sort().reverse()

  // Add 10 empty rows for new entries
  const emptyExpenses = Array(10).fill(null).map((_, i) => ({
    id: `new-${i}`,
    date: '',
    description: '',
    category_id: '',
    amount: 0
  }))

  // Sort expenses by date (newest first), then combine with empty rows
  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = a.expense_date.split('T')[0]
    const dateB = b.expense_date.split('T')[0]
    return dateB.localeCompare(dateA)
  })

  const allExpenseRows = [...sortedExpenses, ...emptyExpenses]

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
            {/* Budget Total Row */}
            <tr className="budget-row">
              <td colSpan="2" className="budget-label">Budget</td>
              {categories.map(cat => (
                <td key={cat.id} className="budget-cell">
                  ${budgets[cat.name] || 0}
                </td>
              ))}
              <td></td>
            </tr>

            {/* Expense Total Row */}
            <tr className="total-row">
              <td colSpan="2" className="total-label">Total Expenses</td>
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
            <tr className="remaining-row">
              <td colSpan="2" className="remaining-label">Remaining</td>
              {categories.map(cat => {
                const total = getCategoryTotal(cat.id)
                const budget = budgets[cat.name] || 0
                const remaining = budget - total
                return (
                  <td
                    key={cat.id}
                    className={`remaining-cell ${remaining < 0 ? 'overspent' : 'under'}`}
                  >
                    {remaining < 0 ? '-' : ''}${Math.abs(remaining).toFixed(2)}
                  </td>
                )
              })}
            </tr>

            {/* Individual Expense Rows */}
            {allExpenseRows.map((exp, idx) => {
              const expIdStr = String(exp.id)
              const isRealExpense = !expIdStr.startsWith('new-')
              const isEditing = editingExpenseId === exp.id
              const displayDate = isRealExpense ? formatDateString(exp.expense_date.split('T')[0]) : ''

              return (
                <tr key={`${exp.id}-${idx}`} className={isEditing ? 'editing-row' : isRealExpense ? 'expense-row' : 'empty-row'}>
                  {isEditing ? (
                    // Edit mode
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
                        <td 
                          key={cat.id} 
                          className="category-amount-cell edit-mode" 
                          onBlur={handleRowBlur}
                        >
                          {rowData.category_id === cat.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={rowData.amount || ''}
                              onChange={(e) => handleRowFieldChange('amount', e.target.value ? parseFloat(e.target.value) : 0)}
                              onKeyDown={handleRowKeyDown}
                              placeholder="0.00"
                              className="cell-input"
                              autoFocus
                            />
                          ) : (
                            <select
                              value={rowData.category_id === cat.id ? cat.id : ''}
                              onChange={(e) => {
                                if (e.target.value === cat.id) {
                                  handleRowFieldChange('category_id', cat.id)
                                }
                              }}
                              className="cell-input"
                              style={{ width: '100%' }}
                            >
                              <option value="">{cat.name}</option>
                              {rowData.category_id === '' && (
                                <option value={cat.id}>→ {cat.name}</option>
                              )}
                            </select>
                          )}
                        </td>
                      ))}
                      <td className="action-cell edit-mode">
                        <button className="btn-cancel" onClick={handleCancelEdit} title="Cancel (ESC)">✕</button>
                      </td>
                    </>
                  ) : (
                    // View mode
                    <>
                      <td className="date-cell" onClick={() => handleEditExpense(exp)}>
                        {displayDate}
                      </td>
                      <td 
                        className="description-cell" 
                        onClick={() => handleEditExpense(exp)}
                        title="Click to edit"
                      >
                        {isRealExpense && exp.description}
                      </td>
                      {categories.map(cat => (
                        <td
                          key={cat.id}
                          className="category-amount-cell"
                          onClick={() => handleEditExpense(exp)}
                          title="Click to edit"
                        >
                          {isRealExpense && exp.category_id === cat.id && exp.amount > 0 && (
                            <span className="cell-value">${exp.amount.toFixed(2)}</span>
                          )}
                        </td>
                      ))}
                      <td className="action-cell">
                        {isRealExpense && (
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteExpense(exp.id)}
                            title="Delete this expense"
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
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="expense-summary">
        <div className="summary-row">
          <div className="summary-label">Budget by Category</div>
          <div className="summary-values">
            {categories.map(cat => (
              <div key={cat.id} className="summary-item">
                <span className="item-label">{cat.name}:</span>
                <span className="item-value">${budgets[cat.name] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="summary-row">
          <div className="summary-label">Total by Category</div>
          <div className="summary-values">
            {categories.map(cat => {
              const total = getCategoryTotal(cat.id)
              const budget = budgets[cat.name] || 0
              const isOver = budget > 0 && total > budget
              return (
                <div key={cat.id} className={`summary-item ${isOver ? 'overspent' : ''}`}>
                  <span className="item-label">{cat.name}:</span>
                  <span className="item-value">${total.toFixed(2)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="summary-row">
          <div className="summary-label">Remaining by Category</div>
          <div className="summary-values">
            {categories.map(cat => {
              const total = getCategoryTotal(cat.id)
              const budget = budgets[cat.name] || 0
              const remaining = budget - total
              return (
                <div 
                  key={cat.id} 
                  className={`summary-item ${remaining < 0 ? 'overspent' : 'under'}`}
                >
                  <span className="item-label">{cat.name}:</span>
                  <span className="item-value">
                    {remaining < 0 ? '-' : ''}${Math.abs(remaining).toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="help-text">
        💡 <strong>Click any cell</strong> to enter an amount. Press Enter to save, Escape to cancel.
      </div>
    </div>
  )
}

export default ExpenseSheet
