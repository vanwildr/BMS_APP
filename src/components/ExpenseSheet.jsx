import React, { useState, useEffect } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories, getBudgets } from '../services/api'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import '../styles/ExpenseSheet.css'

function ExpenseSheet() {
  const PAYDAY_START = new Date('2026-09-11')
  const PAYDAY_CYCLE = 14 // days
  
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedPaydayIndex, setSelectedPaydayIndex] = useState(0)
  const [editingExpenseId, setEditingExpenseId] = useState(null) // ID of expense being edited
  const [rowData, setRowData] = useState({
    date: '',
    description: '',
    category_id: '',
    amount: 0
  })
  const [error, setError] = useState(null)

  // Calculate payday periods from a base date
  const getPaydayPeriod = (index) => {
    const startDate = new Date(PAYDAY_START)
    startDate.setDate(startDate.getDate() + index * PAYDAY_CYCLE)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + PAYDAY_CYCLE - 1)
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      displayStart: startDate.toLocaleDateString(),
      displayEnd: endDate.toLocaleDateString()
    }
  }

  // Get current payday period
  const getCurrentPaydayIndex = () => {
    const today = new Date().toISOString().split('T')[0]
    const date = new Date(today + 'T00:00:00')
    const diffMs = date - PAYDAY_START
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / PAYDAY_CYCLE)
  }

  // Load data on mount
  useEffect(() => {
    setSelectedPaydayIndex(getCurrentPaydayIndex())
    loadAllData()
  }, [])

  useEffect(() => {
    loadAllData()
  }, [selectedPaydayIndex])

  const loadAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      const period = getPaydayPeriod(selectedPaydayIndex)
      const startDate = period.startDate
      const endDate = period.endDate

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

  // Calculate chart data for budget totals (only active budgets)
  const getChartData = () => {
    let totalBudget = 0
    let totalExpenses = 0

    categories.forEach(category => {
      const categoryExpenses = expenses
        .filter(e => e.category_id === category.id)
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
      
      const budget = budgets[category.name] || 0
      // Only include budget if it's not zero (meaning it's active in our system)
      if (budget > 0) {
        totalBudget += budget
        totalExpenses += categoryExpenses
      }
    })

    const totalRemaining = totalBudget - totalExpenses

    return [
      {
        name: 'Totals',
        Budget: parseFloat(totalBudget.toFixed(2)),
        Expenses: parseFloat(totalExpenses.toFixed(2)),
        Remaining: parseFloat(Math.max(totalRemaining, 0).toFixed(2))
      }
    ]
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

  const currentPeriod = getPaydayPeriod(selectedPaydayIndex)

  return (
    <div className="expense-sheet-container">
      <div className="expense-sheet-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>📊 Expense Sheet (Biweekly)</h1>
            <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                className="btn btn-sm" 
                onClick={() => setSelectedPaydayIndex(selectedPaydayIndex - 1)}
                style={{ padding: '6px 12px' }}
              >
                <ChevronLeft size={18} />
              </button>
              <div style={{ minWidth: '220px', textAlign: 'center' }}>
                <small style={{ color: '#666', display: 'block' }}>Payday Period</small>
                <strong>{currentPeriod.displayStart} - {currentPeriod.displayEnd}</strong>
              </div>
              <button 
                className="btn btn-sm" 
                onClick={() => setSelectedPaydayIndex(selectedPaydayIndex + 1)}
                style={{ padding: '6px 12px' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
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

      {/* Budget Summary Chart */}
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ marginBottom: '15px', color: '#333' }}>Budget Summary - {currentPeriod.displayStart} to {currentPeriod.displayEnd}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value) => `$${value.toFixed(2)}`}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <Legend />
            <Bar dataKey="Budget" fill="#2196F3" name="Total Budget" />
            <Bar dataKey="Expenses" fill="#F44336" name="Total Expenses" />
            <Bar dataKey="Remaining" fill="#4CAF50" name="Total Remaining" />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '15px', 
          marginTop: '20px' 
        }}>
          <div style={{ 
            backgroundColor: '#E3F2FD', 
            padding: '15px', 
            borderRadius: '6px', 
            borderLeft: '4px solid #2196F3',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Total Budget</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>
              ${getChartData()[0].Budget.toFixed(2)}
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#FFEBEE', 
            padding: '15px', 
            borderRadius: '6px', 
            borderLeft: '4px solid #F44336',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Total Expenses</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#F44336' }}>
              ${getChartData()[0].Expenses.toFixed(2)}
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#E8F5E9', 
            padding: '15px', 
            borderRadius: '6px', 
            borderLeft: '4px solid #4CAF50',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Total Remaining</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
              ${getChartData()[0].Remaining.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

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
