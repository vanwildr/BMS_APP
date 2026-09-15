import React, { useState, useEffect } from 'react'
import { getIncomes, createIncome, updateIncome, deleteIncome, saveIncomeAdjustments } from '../services/api'
import { Plus, Edit2, Trash2, X, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function Incomes() {
  const [incomes, setIncomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showOccurrencesModal, setShowOccurrencesModal] = useState(false)
  const [editingIncome, setEditingIncome] = useState(null)
  const [selectedRecurringIncome, setSelectedRecurringIncome] = useState(null)
  const [occurrenceAmounts, setOccurrenceAmounts] = useState({})
  const [monthlyIncomeData, setMonthlyIncomeData] = useState([])
  const [recurringIncomes, setRecurringIncomes] = useState([])
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    description: '',
    income_date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    frequency: 3,
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  })

  const frequencyOptions = [
    { value: 1, label: 'Daily' },
    { value: 2, label: 'Weekly' },
    { value: 5, label: 'Biweekly' },
    { value: 3, label: 'Monthly' },
    { value: 4, label: 'Yearly' }
  ]

  useEffect(() => {
    loadIncomes()
    loadRecurringIncomes()
  }, [])

  useEffect(() => {
    if (incomes.length > 0 || recurringIncomes.length > 0) {
      calculateMonthlyIncome(incomes)
    }
  }, [incomes, recurringIncomes])

  const loadRecurringIncomes = async () => {
    try {
      const response = await getIncomes({ is_recurring: true, page: 1, pageSize: 50 })
      const recurringData = response.data.data || []
      setRecurringIncomes(recurringData)
      return recurringData
    } catch (error) {
      console.error('Error loading recurring incomes:', error)
      return []
    }
  }

  const loadIncomes = async () => {
    try {
      setLoading(true)
      const response = await getIncomes({ page: 1, pageSize: 50 })
      setIncomes(response.data.data || [])
      calculateMonthlyIncome(response.data.data || [])
    } catch (error) {
      console.error('Error loading incomes:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyIncome = (incomesData) => {
    const currentYear = new Date().getFullYear()
    const monthlyData = {}

    // Initialize all months
    for (let month = 0; month < 12; month++) {
      const monthName = new Date(currentYear, month, 1).toLocaleDateString('en-US', { month: 'short' })
      monthlyData[month] = {
        month: monthName,
        totalIncome: 0,
        recurringIncome: 0
      }
    }

    // Aggregate regular income by month
    incomesData.forEach(income => {
      if (!income.is_recurring) {
        const incomeDate = new Date(income.income_date)
        if (incomeDate.getFullYear() === currentYear) {
          const month = incomeDate.getMonth()
          monthlyData[month].totalIncome += parseFloat(income.amount) || 0
        }
      }
    })

    // Add recurring income projections
    recurringIncomes.forEach(income => {
      const startDate = new Date(income.start_date || income.income_date)
      const endDate = income.end_date ? new Date(income.end_date) : new Date(currentYear + 1, 0, 0)

      let currentDate = new Date(startDate)

      while (currentDate.getFullYear() === currentYear && currentDate <= endDate) {
        const month = currentDate.getMonth()
        const frequency = income.frequency
        
        // Format date as yyyy-MM-dd to check for adjustments
        const dateStr = currentDate.toISOString().split('T')[0]
        const adjustments = income.adjustments || {}
        const amountForDate = adjustments[dateStr] !== undefined 
          ? parseFloat(adjustments[dateStr])
          : parseFloat(income.amount) || 0

        monthlyData[month].recurringIncome += amountForDate

        // Increment date based on frequency
        if (frequency === 2) { // Weekly
          currentDate.setDate(currentDate.getDate() + 7)
        } else if (frequency === 5) { // Biweekly
          currentDate.setDate(currentDate.getDate() + 14)
        } else if (frequency === 1) { // Daily
          currentDate.setDate(currentDate.getDate() + 1)
        } else if (frequency === 3) { // Monthly
          currentDate.setMonth(currentDate.getMonth() + 1)
        } else if (frequency === 4) { // Yearly
          currentDate.setFullYear(currentDate.getFullYear() + 1)
        } else {
          break // Stop if frequency is unknown
        }
      }
    })

    // Convert to array and sort by month
    const data = Object.values(monthlyData).map(item => ({
      month: item.month,
      income: parseFloat(item.totalIncome.toFixed(2)),
      recurring: parseFloat(item.recurringIncome.toFixed(2)),
      totalIncome: parseFloat((item.totalIncome + item.recurringIncome).toFixed(2))
    }))

    setMonthlyIncomeData(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        amount: parseFloat(formData.amount),
        source: formData.source,
        description: formData.description,
        income_date: formData.income_date,
        is_recurring: formData.is_recurring,
        frequency: formData.is_recurring ? parseInt(formData.frequency) : null,
        start_date: formData.is_recurring ? formData.start_date : null,
        end_date: formData.is_recurring ? formData.end_date : null
      }
      if (editingIncome) {
        await updateIncome(editingIncome.id, submitData)
      } else {
        await createIncome(submitData)
      }
      setShowModal(false)
      resetForm()
      loadIncomes()
      loadRecurringIncomes()
    } catch (error) {
      console.error('Error saving income:', error)
      alert('Error saving income')
    }
  }

  const handleEdit = (income) => {
    setEditingIncome(income)
    setFormData({
      amount: income.amount,
      source: income.source,
      description: income.description,
      income_date: income.income_date.split('T')[0],
      is_recurring: income.is_recurring,
      frequency: income.frequency || 3,
      start_date: income.start_date ? income.start_date.split('T')[0] : income.income_date.split('T')[0],
      end_date: income.end_date ? income.end_date.split('T')[0] : ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      try {
        await deleteIncome(id)
        loadIncomes()
        loadRecurringIncomes()
      } catch (error) {
        console.error('Error deleting income:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      source: '',
      description: '',
      income_date: new Date().toISOString().split('T')[0],
      is_recurring: false,
      frequency: 3,
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    })
    setEditingIncome(null)
  }

  const getFrequencyLabel = (frequency) => {
    const freq = frequencyOptions.find(f => f.value === frequency)
    return freq ? freq.label : 'Unknown'
  }

  const generateOccurrences = (income) => {
    const occurrences = []
    const startDate = new Date(income.start_date || income.income_date)
    const endDate = income.end_date ? new Date(income.end_date) : new Date(startDate.getFullYear() + 2, 11, 31)
    let currentDate = new Date(startDate)
    const maxOccurrences = 26 // Show up to 26 occurrences (1 year for biweekly)

    while (occurrences.length < maxOccurrences && currentDate <= endDate) {
      const frequency = income.frequency
      if (frequency === 2) { // Weekly
        occurrences.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 7)
      } else if (frequency === 5) { // Biweekly
        occurrences.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 14)
      } else if (frequency === 1) { // Daily
        occurrences.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      } else if (frequency === 3) { // Monthly
        occurrences.push(new Date(currentDate))
        currentDate.setMonth(currentDate.getMonth() + 1)
      } else if (frequency === 4) { // Yearly
        occurrences.push(new Date(currentDate))
        currentDate.setFullYear(currentDate.getFullYear() + 1)
      }
    }

    return occurrences
  }

  const handleAdjustAmounts = (income) => {
    setSelectedRecurringIncome(income)
    // Load existing adjustments from the income object
    const adjustments = income.adjustments || {}
    setOccurrenceAmounts(adjustments)
    setShowOccurrencesModal(true)
  }

  const handleOccurrenceAmountChange = (dateStr, amount) => {
    setOccurrenceAmounts({
      ...occurrenceAmounts,
      [dateStr]: parseFloat(amount) || 0
    })
  }

  const handleSaveOccurrenceAmounts = async () => {
    try {
      const adjustments = Object.entries(occurrenceAmounts)
        .filter(([_, amount]) => amount !== selectedRecurringIncome.amount && amount > 0)
        .reduce((acc, [date, amount]) => {
          acc[date] = parseFloat(amount)
          return acc
        }, {})

      if (Object.keys(adjustments).length > 0) {
        await saveIncomeAdjustments(selectedRecurringIncome.id, adjustments)
        alert(`Saved ${Object.keys(adjustments).length} amount adjustment(s)`)
      }
      setShowOccurrencesModal(false)
      setSelectedRecurringIncome(null)
      loadIncomes()
      loadRecurringIncomes()
    } catch (error) {
      console.error('Error saving income adjustments:', error)
      alert('Error saving adjustments. Please try again.')
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Income Sources</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Add Income
          </button>
        </div>

        {/* Monthly Income Chart */}
        {monthlyIncomeData.length > 0 && (
          <div style={{ marginBottom: '30px', padding: '0 20px' }}>
            <h2 className="card-title" style={{ marginTop: '20px', marginBottom: '20px' }}>
              Income Trends - {new Date().getFullYear()}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyIncomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#2196F3" 
                  name="One-Time Income"
                  strokeWidth={2}
                  dot={{ fill: '#2196F3', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="recurring" 
                  stroke="#4CAF50" 
                  name="Recurring Income"
                  strokeWidth={2}
                  dot={{ fill: '#4CAF50', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalIncome" 
                  stroke="#FF9800" 
                  name="Total Income"
                  strokeWidth={2}
                  dot={{ fill: '#FF9800', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Recurring</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((income) => (
                <tr key={income.id}>
                  <td>{new Date(income.income_date).toLocaleDateString()}</td>
                  <td><strong>{income.source}</strong></td>
                  <td>{income.description || '-'}</td>
                  <td style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    +${income.amount.toFixed(2)}
                  </td>
                  <td>
                    {income.is_recurring ? (
                      <span className="badge badge-success">Yes</span>
                    ) : (
                      <span className="badge">No</span>
                    )}
                  </td>
                  <td>
                    {income.end_date ? (
                      <span style={{ color: '#FF9800', fontWeight: 'bold' }}>
                        {new Date(income.end_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: '#666' }}>-</span>
                    )}
                  </td>
                  <td>
                    {income.is_recurring ? (
                      <button 
                        className="btn btn-sm btn-info" 
                        onClick={() => handleAdjustAmounts(income)}
                        style={{ marginRight: '5px' }}
                        title="Adjust amount for specific dates"
                      >
                        <Calendar size={14} />
                      </button>
                    ) : null}
                    <button className="btn btn-sm btn-primary" onClick={() => handleEdit(income)} style={{ marginRight: '5px' }}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(income.id)}>
                      <Trash2 size={14} />
                    </button>
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
              <h2 className="modal-title">{editingIncome ? 'Edit' : 'Add'} Income</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Amount *</label>
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
                <label className="form-label">Source *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Salary, Freelance, Investment"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  required
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
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.income_date}
                  onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  />
                  <span>Recurring Income</span>
                </label>
              </div>
              {formData.is_recurring && (
                <>
                  <div className="form-group">
                    <label className="form-label">Frequency *</label>
                    <select 
                      className="form-select" 
                      value={formData.frequency} 
                      onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) })}
                      required
                    >
                      {frequencyOptions.map((freq) => <option key={freq.value} value={freq.value}>{freq.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formData.start_date} 
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date (Optional)</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formData.end_date} 
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} 
                    />
                    <small style={{ color: '#666' }}>Leave empty for indefinite recurring income</small>
                  </div>
                </>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingIncome ? 'Update' : 'Add'} Income
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Income Amounts Modal */}
      {showOccurrencesModal && selectedRecurringIncome && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">Adjust Amounts - {selectedRecurringIncome.source}</h2>
              <button className="modal-close" onClick={() => { setShowOccurrencesModal(false); setSelectedRecurringIncome(null); }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '15px', color: '#666' }}>
                Base amount: <strong>${selectedRecurringIncome.amount.toFixed(2)}</strong> | 
                Frequency: <strong>{getFrequencyLabel(selectedRecurringIncome.frequency)}</strong>
              </p>
              <p style={{ marginBottom: '20px', fontSize: '0.9em', color: '#888' }}>
                Click on dates below to adjust the amount for that specific occurrence. Leave blank to use the base amount.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generateOccurrences(selectedRecurringIncome).map((date, index) => {
                      const dateStr = date.toISOString().split('T')[0]
                      const currentAmount = occurrenceAmounts[dateStr] !== undefined 
                        ? occurrenceAmounts[dateStr] 
                        : selectedRecurringIncome.amount

                      return (
                        <tr key={index}>
                          <td style={{ fontWeight: 'bold' }}>
                            {date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-input"
                              value={currentAmount}
                              onChange={(e) => handleOccurrenceAmountChange(dateStr, e.target.value)}
                              style={{ width: '120px' }}
                              placeholder={selectedRecurringIncome.amount.toFixed(2)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => { setShowOccurrencesModal(false); setSelectedRecurringIncome(null); }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveOccurrenceAmounts}
                >
                  Save Adjustments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Incomes
