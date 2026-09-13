import React, { useState, useEffect } from 'react'
import { getBudgets, createBudget, updateBudget, deleteBudget, getCategories } from '../services/api'
import { Plus, Edit2, Trash2, X } from 'lucide-react'

function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // Format: YYYY-MM
  )
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 2, // Monthly
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    alertThreshold: 80
  })

  const getMonthDateRange = (monthString) => {
    const [year, month] = monthString.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    return { startDate, endDate }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadBudgets()
  }, [selectedMonth])

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
      // Filter budgets by startDate month and year matching selectedMonth
      const filteredBudgets = response.data.filter((budget) => {
        const budgetMonth = budget.startDate.slice(0, 7) // Extract YYYY-MM from startDate
        return budgetMonth === selectedMonth
      })
      setBudgets(filteredBudgets)
    } catch (error) {
      console.error('Error loading budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, { ...formData, isActive: true })
      } else {
        await createBudget(formData)
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
    const budgetMonth = budget.startDate.slice(0, 7) // Extract YYYY-MM
    setSelectedMonth(budgetMonth)
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount,
      period: budget.period,
      startDate: budget.startDate.split('T')[0],
      endDate: budget.endDate.split('T')[0],
      alertThreshold: budget.alertThreshold || 80
    })
    setShowModal(true)
  }

  const resetForm = () => {
    const { startDate, endDate } = getMonthDateRange(selectedMonth)
    setFormData({
      categoryId: '',
      amount: '',
      period: 2,
      startDate,
      endDate,
      alertThreshold: 80
    })
    setEditingBudget(null)
  }

  const getStatusClass = (utilization) => {
    if (utilization >= 100) return 'danger'
    if (utilization >= 80) return 'warning'
    return ''
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="card-title">Budgets</h1>
              <div style={{ marginTop: '10px' }}>
                <label className="form-label" style={{ marginBottom: '5px', display: 'block' }}>Select Month:</label>
                <input
                  type="month"
                  className="form-input"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: '150px' }}
                />
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
                    <h3>{budget.categoryName}</h3>
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
                    {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
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
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Alert Threshold (%) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
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
