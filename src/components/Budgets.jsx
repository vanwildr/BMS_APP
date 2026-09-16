import React, { useState, useEffect } from 'react'
import { getBudgets, createBudget, updateBudget, deleteBudget, getCategories, getExpenses } from '../services/api'
import { Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react'

function Budgets() {
  const PAYDAY_START = new Date('2026-09-11')
  const PAYDAY_CYCLE = 14 // days

  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [selectedPaydayIndex, setSelectedPaydayIndex] = useState(0)
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 2, // Monthly
    start_date: '',
    end_date: '',
    alert_threshold: 80
  })

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

  // Find which payday period a date falls into
  const getPaydayIndexForDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    const diffMs = date - PAYDAY_START
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / PAYDAY_CYCLE)
  }

  // Get current payday period
  const getCurrentPaydayIndex = () => {
    const today = new Date().toISOString().split('T')[0]
    return getPaydayIndexForDate(today)
  }

  useEffect(() => {
    loadCategories()
    // Set to current payday period
    setSelectedPaydayIndex(getCurrentPaydayIndex())
  }, [])

  useEffect(() => {
    loadBudgets()
  }, [selectedPaydayIndex])

  const loadCategories = async () => {
    try {
      const response = await getCategories()
      setCategories(response.data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadBudgets = async () => {
    try {
      setLoading(true)
      const response = await getBudgets({ isActive: true })
      const period = getPaydayPeriod(selectedPaydayIndex)
      
      // Filter budgets by payday period
      const filteredBudgets = response.data.filter((budget) => {
        const budgetStart = new Date(budget.start_date)
        const budgetEnd = new Date(budget.end_date)
        const periodStart = new Date(period.startDate)
        const periodEnd = new Date(period.endDate)
        
        // Check if budget overlaps with this payday period
        return budgetStart <= periodEnd && budgetEnd >= periodStart
      })
      
      // Fetch expenses for the payday period to calculate spentAmount
      const expensesResponse = await getExpenses({ 
        start_date: period.startDate, 
        end_date: period.endDate, 
        pageSize: 1000 
      })
      const expenses = expensesResponse.data.data || []
      
      // Calculate spentAmount and derived fields for each budget
      const budgetsWithSpent = filteredBudgets.map((budget) => {
        const categoryExpenses = expenses.filter(exp => exp.category_id === budget.category_id)
        const spentAmount = categoryExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
        const utilizationPercentage = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0
        const remainingAmount = budget.amount - spentAmount
        const periodName = `${new Date(budget.start_date).toLocaleDateString()} to ${new Date(budget.end_date).toLocaleDateString()}`
        
        return {
          ...budget,
          spentAmount,
          utilizationPercentage,
          remainingAmount,
          periodName
        }
      })
      
      setBudgets(budgetsWithSpent)
    } catch (error) {
      console.error('Error loading budgets:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const period = getPaydayPeriod(selectedPaydayIndex)
      if (editingBudget) {
        await updateBudget(editingBudget.id, { ...formData, isActive: true })
      } else {
        await createBudget({
          ...formData,
          start_date: period.startDate,
          end_date: period.endDate
        })
      }
      setShowModal(false)
      resetForm()
      loadBudgets()
    } catch (error) {
      console.error('Error saving budget:', error)
      alert('Error saving budget')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id)
        loadBudgets()
      } catch (error) {
        console.error('Error deleting budget:', error)
      }
    }
  }

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    // Find the payday period for this budget
    const paydayIndex = getPaydayIndexForDate(budget.start_date)
    setSelectedPaydayIndex(paydayIndex)
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount,
      period: budget.period,
      start_date: budget.start_date.split('T')[0],
      end_date: budget.end_date.split('T')[0],
      alert_threshold: budget.alert_threshold || 80
    })
    setShowModal(true)
  }

  const resetForm = () => {
    const period = getPaydayPeriod(selectedPaydayIndex)
    setFormData({
      category_id: '',
      amount: '',
      period: 2,
      start_date: period.startDate,
      end_date: period.endDate,
      alert_threshold: 80
    })
    setEditingBudget(null)
  }

  const getStatusClass = (utilization) => {
    if (utilization >= 100) return 'danger'
    if (utilization >= 80) return 'warning'
    return ''
  }

  const currentPeriod = getPaydayPeriod(selectedPaydayIndex)

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 className="card-title">Budgets (Biweekly)</h1>
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
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
              <Plus size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Add Budget
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid grid-2">
            {budgets.map((budget) => (
              <div key={budget.id} className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3>{budget.category_name}</h3>
                    <small style={{ color: '#666' }}>{budget.periodName}</small>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-primary" onClick={() => handleEdit(budget)} style={{ marginRight: '5px' }}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(budget.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Spent: ${budget.spentAmount.toFixed(2)}</span>
                    <span>Budget: ${budget.amount.toFixed(2)}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${getStatusClass(budget.utilizationPercentage)}`}
                      style={{ width: `${Math.min(budget.utilizationPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    <small>
                      {budget.utilizationPercentage.toFixed(1)}% Used
                    </small>
                    <small style={{ color: budget.remainingAmount < 0 ? '#F44336' : '#4CAF50' }}>
                      ${Math.abs(budget.remainingAmount).toFixed(2)} {budget.remainingAmount < 0 ? 'Over' : 'Left'}
                    </small>
                  </div>
                  <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                    {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingBudget ? 'Edit Budget' : 'Add Budget'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Budget Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Period *</label>
                <select
                  className="form-select"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: parseInt(e.target.value) })}
                  required
                >
                  <option value="1">Weekly</option>
                  <option value="2">Monthly</option>
                  <option value="3">Yearly</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payday Period (Auto-set)</label>
                <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px', border: '1px solid #ddd' }}>
                  <strong>{currentPeriod.displayStart}</strong> to <strong>{currentPeriod.displayEnd}</strong>
                </div>
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Budget dates are automatically set to match your payday cycle
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Alert Threshold (%) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.alert_threshold}
                  onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
                  placeholder="80"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingBudget ? 'Update' : 'Create'} Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Budgets
