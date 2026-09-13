import React, { useState, useEffect } from 'react'
import { getRecurringExpenses, createRecurringExpense, updateRecurringExpense, deleteRecurringExpense, processRecurringExpenses, getCategories } from '../services/api'
import { Plus, Edit2, Trash2, X, Calendar, PlayCircle, TrendingUp, AlertCircle } from 'lucide-react'

function RecurringExpenses() {
  const [recurringExpenses, setRecurringExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [showProjection, setShowProjection] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    categoryId: '',
    frequency: 3,
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  })

  const frequencyOptions = [
    { value: 1, label: 'Daily' },
    { value: 2, label: 'Weekly' },
    { value: 5, label: 'Biweekly' },
    { value: 3, label: 'Monthly' },
    { value: 4, label: 'Yearly' }
  ]

  const getFrequencyLabel = (frequencyValue) => {
    const option = frequencyOptions.find(opt => opt.value === frequencyValue)
    return option ? option.label : 'Unknown'
  }

  useEffect(() => {
    loadCategories()
    loadRecurringExpenses()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await getCategories()
      setCategories(response.data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadRecurringExpenses = async () => {
    try {
      setLoading(true)
      const response = await getRecurringExpenses({ isActive: true })
      setRecurringExpenses(response.data)
    } catch (error) {
      console.error('Error loading recurring expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingExpense) {
        await updateRecurringExpense(editingExpense.id, { ...formData, isActive: true })
      } else {
        await createRecurringExpense(formData)
      }
      setShowModal(false)
      resetForm()
      loadRecurringExpenses()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error saving recurring expense')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this recurring expense?')) {
      try {
        await deleteRecurringExpense(id)
        loadRecurringExpenses()
      } catch (error) {
        console.error('Error deleting:', error)
      }
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      name: expense.name,
      amount: expense.amount,
      categoryId: expense.categoryId,
      frequency: expense.frequency,
      startDate: expense.startDate.split('T')[0],
      endDate: expense.endDate ? expense.endDate.split('T')[0] : ''
    })
    setShowModal(true)
  }

  const handleProcessAll = async () => {
    if (window.confirm('Process all due recurring expenses now?')) {
      try {
        const response = await processRecurringExpenses()
        alert(response.data.message)
        loadRecurringExpenses()
      } catch (error) {
        console.error('Error processing:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '', amount: '', categoryId: '', frequency: 3,
      startDate: new Date().toISOString().split('T')[0], endDate: ''
    })
    setEditingExpense(null)
  }

  const calculateProjection = () => {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    const projections = []

    recurringExpenses.forEach(expense => {
      if (!expense.isActive) return
      let currentDate = new Date(expense.nextDueDate)

      while (currentDate <= nextMonth) {
        if (currentDate >= now) {
          projections.push({
            ...expense,
            projectedDate: new Date(currentDate),
            isThisMonth: currentDate.getMonth() === now.getMonth(),
            isNextMonth: currentDate.getMonth() === (now.getMonth() + 1) % 12
          })
        }

        switch (expense.frequency) {
          case 1: currentDate.setDate(currentDate.getDate() + 1); break
          case 2: currentDate.setDate(currentDate.getDate() + 7); break
          case 5: currentDate.setDate(currentDate.getDate() + 14); break
          case 3: currentDate.setMonth(currentDate.getMonth() + 1); break
          case 4: currentDate.setFullYear(currentDate.getFullYear() + 1); break
          default: currentDate.setMonth(currentDate.getMonth() + 1)
        }
        if (projections.length > 100) break
      }
    })

    return projections.sort((a, b) => a.projectedDate - b.projectedDate)
  }

  const projections = calculateProjection()
  const thisMonthTotal = projections.filter(p => p.isThisMonth).reduce((sum, p) => sum + p.amount, 0)
  const nextMonthTotal = projections.filter(p => p.isNextMonth).reduce((sum, p) => sum + p.amount, 0)

  const getDaysUntil = (date) => {
    const diff = new Date(date) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getStatusBadge = (expense) => {
    const days = getDaysUntil(expense.nextDueDate)
    if (days < 0) return <span className="badge badge-danger">Overdue</span>
    if (days === 0) return <span className="badge badge-warning">Due Today</span>
    if (days <= 7) return <span className="badge badge-warning">Due in {days} days</span>
    return <span className="badge badge-success">Due in {days} days</span>
  }

  const getExpensesForDate = (date) => {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    return recurringExpenses.filter(expense => {
      if (!expense.isActive) return false
      
      const startDate = new Date(expense.startDate)
      const endDate = expense.endDate ? new Date(expense.endDate) : null
      
      if (targetDate < startDate) return false
      if (endDate && targetDate > endDate) return false
      
      const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24))
      
      switch (expense.frequency) {
        case 1: return true
        case 2: return daysDiff % 7 === 0
        case 5: return daysDiff % 14 === 0
        case 3: return startDate.getDate() === targetDate.getDate()
        case 4: return startDate.getMonth() === targetDate.getMonth() && startDate.getDate() === targetDate.getDate()
        default: return false
      }
    })
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarDate)
    const firstDay = getFirstDayOfMonth(calendarDate)
    const days = []
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day))
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Recurring Expenses</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => setShowProjection(!showProjection)} style={{ background: showProjection ? '#2196F3' : '#4CAF50' }}>
              <TrendingUp size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {showProjection ? 'Hide' : 'Show'} Projection
            </button>
            <button className="btn btn-primary" onClick={() => setShowCalendar(!showCalendar)} style={{ background: showCalendar ? '#9C27B0' : '#2196F3' }}>
              <Calendar size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {showCalendar ? 'Hide' : 'Show'} Calendar
            </button>
            <button className="btn btn-primary" onClick={handleProcessAll} style={{ background: '#FF9800' }}>
              <PlayCircle size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Process Due
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Add Recurring
            </button>
          </div>
        </div>

        {showProjection && (
          <div style={{ marginBottom: '30px' }}>
            <div className="grid grid-3" style={{ marginBottom: '20px' }}>
              <div className="stat-card info">
                <div className="stat-label">This Month (Remaining)</div>
                <div className="stat-value">${thisMonthTotal.toFixed(2)}</div>
                <small>{projections.filter(p => p.isThisMonth).length} expenses</small>
              </div>
              <div className="stat-card warning">
                <div className="stat-label">Next Month (Projected)</div>
                <div className="stat-value">${nextMonthTotal.toFixed(2)}</div>
                <small>{projections.filter(p => p.isNextMonth).length} expenses</small>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Active</div>
                <div className="stat-value">{recurringExpenses.length}</div>
                <small>recurring expenses</small>
              </div>
            </div>

            <div className="card" style={{ background: '#f8f9fa' }}>
              <h3 style={{ marginBottom: '15px' }}>
                <Calendar size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Upcoming Expenses (Next 60 Days)
              </h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense</th>
                    <th>Category</th>
                    <th>Frequency</th>
                    <th>Amount</th>
                    <th>Period</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.slice(0, 20).map((proj, index) => (
                    <tr key={`${proj.id}-${index}`}>
                      <td>
                        <strong>{proj.projectedDate.toLocaleDateString()}</strong>
                        <br/><small style={{ color: '#666' }}>{proj.projectedDate.toLocaleDateString('en-US', { weekday: 'short' })}</small>
                      </td>
                      <td>{proj.name}</td>
                      <td><span className="badge badge-success">{proj.categoryName}</span></td>
                      <td>{getFrequencyLabel(proj.frequency)}</td>
                      <td style={{ fontWeight: 'bold', color: '#F44336' }}>${proj.amount.toFixed(2)}</td>
                      <td>
                        {proj.isThisMonth && <span className="badge" style={{ background: '#2196F3', color: 'white' }}>This Month</span>}
                        {proj.isNextMonth && <span className="badge" style={{ background: '#FF9800', color: 'white' }}>Next Month</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showCalendar && (
          <div className="card" style={{ background: '#f8f9fa', marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-sm btn-outline" 
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                >
                  ← Previous
                </button>
                <button 
                  className="btn btn-sm btn-outline" 
                  onClick={() => setCalendarDate(new Date())}
                >
                  Today
                </button>
                <button 
                  className="btn btn-sm btn-outline" 
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                >
                  Next →
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {weekDays.map(day => (
                    <th key={day} style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', borderBottom: '2px solid #ddd' }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
                  <tr key={weekIndex}>
                    {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
                      const expenses = date ? getExpensesForDate(date) : []
                      const isToday = date && new Date().toDateString() === date.toDateString()
                      const isCurrentMonth = date && date.getMonth() === calendarDate.getMonth()
                      
                      return (
                        <td
                          key={dayIndex}
                          style={{
                            padding: '10px',
                            border: '1px solid #ddd',
                            minHeight: '120px',
                            verticalAlign: 'top',
                            backgroundColor: isToday ? '#e3f2fd' : isCurrentMonth ? '#fff' : '#f5f5f5',
                            cursor: expenses.length > 0 ? 'pointer' : 'default'
                          }}
                        >
                          {date && (
                            <>
                              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: isCurrentMonth ? '#333' : '#999' }}>
                                {date.getDate()}
                              </div>
                              <div style={{ fontSize: '0.85em' }}>
                                {expenses.map((expense, idx) => (
                                  <div 
                                    key={idx} 
                                    style={{
                                      padding: '4px',
                                      marginBottom: '4px',
                                      backgroundColor: '#FFE0B2',
                                      borderLeft: '3px solid #FF9800',
                                      borderRadius: '2px',
                                      fontSize: '0.75em',
                                      color: '#333',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={`${expense.name} - $${expense.amount.toFixed(2)}`}
                                  >
                                    <strong>{expense.name}</strong>
                                    <br />
                                    <span style={{ color: '#D84315' }}>
                                      ${expense.amount.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <small style={{ color: '#666' }}>
                <strong>Legend:</strong> Orange boxes = recurring expenses due on that day
              </small>
            </div>
          </div>
        )}

        <h3 style={{ marginBottom: '15px' }}>Active Recurring Expenses</h3>
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : recurringExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
            <p>No recurring expenses yet. Add one to start tracking!</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>Amount</th><th>Frequency</th><th>Next Due</th><th>Status</th><th>Generated</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recurringExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td><strong>{expense.name}</strong></td>
                  <td><span className="badge badge-success">{expense.categoryName}</span></td>
                  <td style={{ fontWeight: 'bold', color: '#F44336' }}>${expense.amount.toFixed(2)}</td>
                  <td>{getFrequencyLabel(expense.frequency)}</td>
                  <td>{new Date(expense.nextDueDate).toLocaleDateString()}<br/><small style={{ color: '#666' }}>{new Date(expense.nextDueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</small></td>
                  <td>{getStatusBadge(expense)}</td>
                  <td><span className="badge" style={{ background: '#e0e0e0', color: '#333' }}>{expense.generatedExpensesCount} times</span></td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => handleEdit(expense)} style={{ marginRight: '5px' }}><Edit2 size={14} /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(expense.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingExpense ? 'Edit' : 'Add'} Recurring Expense</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Expense Name *</label>
                <input type="text" className="form-input" placeholder="e.g., Netflix, Rent" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount *</label>
                <input type="number" step="0.01" className="form-input" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} required>
                  <option value="">Select Category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Frequency *</label>
                <select className="form-select" value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) })} required>
                  {frequencyOptions.map((freq) => <option key={freq.value} value={freq.value}>{freq.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input type="date" className="form-input" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Date (Optional)</label>
                <input type="date" className="form-input" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                <small style={{ color: '#666' }}>Leave empty for indefinite</small>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{editingExpense ? 'Update' : 'Create'} Recurring Expense</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecurringExpenses