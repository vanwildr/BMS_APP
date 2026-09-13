import React, { useState, useEffect } from 'react'
import { getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, contributeSavingsGoal } from '../services/api'
import { Plus, Edit2, Trash2, X, TrendingUp } from 'lucide-react'

function SavingsGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [contributeAmount, setContributeAmount] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    description: ''
  })

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      setLoading(true)
      const response = await getSavingsGoals()
      setGoals(response.data)
    } catch (error) {
      console.error('Error loading savings goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, formData)
      } else {
        await createSavingsGoal(formData)
      }
      setShowModal(false)
      resetForm()
      loadGoals()
    } catch (error) {
      console.error('Error saving goal:', error)
      alert('Error saving goal')
    }
  }

  const handleContribute = async (e) => {
    e.preventDefault()
    try {
      await contributeSavingsGoal(selectedGoal.id, parseFloat(contributeAmount))
      setShowContributeModal(false)
      setContributeAmount('')
      setSelectedGoal(null)
      loadGoals()
    } catch (error) {
      console.error('Error contributing:', error)
      alert('Error adding contribution')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      try {
        await deleteSavingsGoal(id)
        loadGoals()
      } catch (error) {
        console.error('Error deleting goal:', error)
      }
    }
  }

  const handleEdit = (goal) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : '',
      description: goal.description || ''
    })
    setShowModal(true)
  }

  const openContributeModal = (goal) => {
    setSelectedGoal(goal)
    setShowContributeModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      description: ''
    })
    setEditingGoal(null)
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'success'
    if (percentage >= 75) return 'info'
    if (percentage >= 50) return 'warning'
    return 'danger'
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Savings Goals</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Add Savings Goal
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid grid-2">
            {goals.map((goal) => (
              <div key={goal.id} className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3>{goal.name}</h3>
                    {goal.targetDate && (
                      <small style={{ color: '#666' }}>
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                  <div>
                    <button className="btn btn-sm btn-primary" onClick={() => handleEdit(goal)} style={{ marginRight: '5px' }}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(goal.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {goal.description && (
                  <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                    {goal.description}
                  </p>
                )}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                      ${goal.currentAmount.toFixed(2)}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>
                      ${goal.targetAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${goal.progressPercentage >= 100 ? '' : goal.progressPercentage >= 75 ? '' : 'warning'}`}
                      style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                    <small>{goal.progressPercentage.toFixed(1)}% Complete</small>
                    {!goal.isCompleted && (
                      <button 
                        className="btn btn-sm btn-primary" 
                        onClick={() => openContributeModal(goal)}
                      >
                        <TrendingUp size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        Contribute
                      </button>
                    )}
                  </div>
                  {goal.isCompleted && (
                    <div className="badge badge-success" style={{ marginTop: '10px', width: '100%', textAlign: 'center' }}>
                      🎉 Goal Achieved!
                    </div>
                  )}
                  {goal.remainingAmount > 0 && (
                    <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                      ${goal.remainingAmount.toFixed(2)} remaining
                    </small>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingGoal ? 'Edit Savings Goal' : 'Add Savings Goal'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Goal Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Current Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingGoal ? 'Update' : 'Create'} Savings Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && selectedGoal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add Contribution</h2>
              <button className="modal-close" onClick={() => { setShowContributeModal(false); setContributeAmount(''); }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p><strong>{selectedGoal.name}</strong></p>
              <small style={{ color: '#666' }}>
                Current: ${selectedGoal.currentAmount.toFixed(2)} / ${selectedGoal.targetAmount.toFixed(2)}
              </small>
            </div>
            <form onSubmit={handleContribute}>
              <div className="form-group">
                <label className="form-label">Contribution Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Add Contribution
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SavingsGoals
