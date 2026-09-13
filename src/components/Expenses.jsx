import React, { useState, useEffect } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories } from '../services/api'
import { Plus, Edit2, Trash2, X, Upload, Check, ArrowUp, ArrowDown } from 'lucide-react'

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvData, setCsvData] = useState([])
  const [csvDataWithCategories, setCsvDataWithCategories] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    page: 1,
    pageSize: 20,
    sortBy: 'expenseDate',
    sortOrder: 'desc'
  })
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    notes: ''
  })

  useEffect(() => {
    loadCategories()
    loadExpenses()
  }, [filters])

  const loadCategories = async () => {
    try {
      const response = await getCategories()
      setCategories(response.data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const response = await getExpenses(filters)
      setExpenses(response.data.data || [])
      setTotalCount(response.data.totalCount || 0)
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, formData)
      } else {
        await createExpense(formData)
      }
      setShowModal(false)
      resetForm()
      loadExpenses()
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Error saving expense')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id)
        loadExpenses()
      } catch (error) {
        console.error('Error deleting expense:', error)
      }
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      amount: expense.amount,
      description: expense.description,
      expenseDate: expense.expenseDate.split('T')[0],
      categoryId: expense.categoryId,
      notes: expense.notes || ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0],
      categoryId: '',
      notes: ''
    })
    setEditingExpense(null)
  }

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    const data = []

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      // Skip empty rows
      if (values.length < 7 || !values[2]) continue

      const amount = parseFloat(values[6])
      
      // Skip zero amounts
      if (amount === 0 || isNaN(amount)) continue

      // Only include NEGATIVE values (expenses) - positive values are income
      if (amount > 0) continue

      data.push({
        date: values[2],
        description1: values[4],
        description2: values[5],
        amount: Math.abs(amount), // Convert to positive for display
        categoryId: '',
        notes: `${values[0]} - ****${values[1].slice(-4)}`
      })
    }

    return data
  }

  const handleCSVUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csvText = e.target.result
        const parsed = parseCSV(csvText)
        
        if (parsed.length === 0) {
          alert('No valid transactions found in CSV file')
          return
        }

        setCsvData(parsed)
        setCsvDataWithCategories(parsed.map(item => ({ ...item })))
        setShowImportModal(true)
      } catch (error) {
        console.error('Error parsing CSV:', error)
        alert('Error parsing CSV file')
      }
    }
    reader.readAsText(file)
  }

  const handleCategoryChange = (index, categoryId) => {
    const updated = [...csvDataWithCategories]
    updated[index].categoryId = categoryId
    setCsvDataWithCategories(updated)
  }

  const formatCSVDate = (dateStr) => {
    // Convert from M/D/YYYY to YYYY-MM-DD
    const dateParts = dateStr.split('/')
    return `${dateParts[2]}-${String(dateParts[0]).padStart(2, '0')}-${String(dateParts[1]).padStart(2, '0')}`
  }

  const handleImportExpenses = async () => {
    const toImport = csvDataWithCategories.filter(item => item.categoryId)

    if (toImport.length === 0) {
      alert('Please select a category for at least one expense')
      return
    }

    try {
      for (const item of toImport) {
        await createExpense({
          amount: item.amount.toString(),
          description: item.description1 || item.description2 || 'Bank Import',
          description2: item.description2 || '',
          expenseDate: formatCSVDate(item.date),
          categoryId: parseInt(item.categoryId),
          notes: item.notes
        })
      }

      alert(`Successfully imported ${toImport.length} expense(s)`)
      setShowImportModal(false)
      setCsvData([])
      setCsvDataWithCategories([])
      loadExpenses()
    } catch (error) {
      console.error('Error importing expenses:', error)
      alert('Error importing expenses')
    }
  }

  const handleSort = (column) => {
    if (filters.sortBy === column) {
      // Toggle sort order if clicking the same column
      setFilters({
        ...filters,
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
        page: 1
      })
    } else {
      // Set new sort column
      setFilters({
        ...filters,
        sortBy: column,
        sortOrder: 'asc',
        page: 1
      })
    }
  }

  const renderSortIcon = (column) => {
    if (filters.sortBy !== column) {
      return <span style={{ color: '#999', fontSize: '12px', marginLeft: '4px' }}>↕</span>
    }
    return filters.sortOrder === 'asc' ? (
      <ArrowUp size={14} style={{ marginLeft: '4px', display: 'inline' }} />
    ) : (
      <ArrowDown size={14} style={{ marginLeft: '4px', display: 'inline' }} />
    )
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Expenses</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="file" 
              id="csv-upload" 
              accept=".csv" 
              onChange={handleCSVUpload}
              style={{ display: 'none' }}
            />
            <button 
              className="btn btn-primary" 
              onClick={() => document.getElementById('csv-upload').click()}
              style={{ background: '#4CAF50' }}
            >
              <Upload size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Import CSV
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Add Expense
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value, page: 1 })}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('expenseDate')}>
                  Date {renderSortIcon('expenseDate')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('description')}>
                  Description {renderSortIcon('description')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('categoryName')}>
                  Category {renderSortIcon('categoryName')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('amount')}>
                  Amount {renderSortIcon('amount')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('notes')}>
                  Notes {renderSortIcon('notes')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                  <td>
                    <strong>{expense.description}</strong>
                    {expense.description2 && <div style={{ fontSize: '0.9em', color: '#333', marginTop: '4px' }}>{expense.description2}</div>}
                  </td>
                  <td>
                    <span className="badge badge-success">{expense.categoryName}</span>
                  </td>
                  <td>${expense.amount.toFixed(2)}</td>
                  <td>{expense.notes || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => handleEdit(expense)} style={{ marginRight: '5px' }}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(expense.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', borderTop: '2px solid #ddd' }}>
                <td colSpan="3" style={{ textAlign: 'right', paddingRight: '10px' }}>Total Expenses:</td>
                <td style={{ color: '#F44336' }}>
                  ${expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0).toFixed(2)}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Pagination */}
        {!loading && expenses.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
            <div style={{ color: '#666', fontSize: '14px' }}>
              Showing {((filters.page - 1) * filters.pageSize) + 1} to {Math.min(filters.page * filters.pageSize, totalCount)} of {totalCount} expenses
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
              >
                ← Previous
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#666' }}>Page {filters.page} of {Math.ceil(totalCount / filters.pageSize)}</span>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= Math.ceil(totalCount / filters.pageSize)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
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
                <label className="form-label">Description *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  required
                />
              </div>
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
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingExpense ? 'Update' : 'Create'} Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">Import Expenses from CSV</h2>
              <button className="modal-close" onClick={() => { setShowImportModal(false); setCsvData([]); setCsvDataWithCategories([]); }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '15px', color: '#666' }}>
                Found {csvDataWithCategories.length} transaction(s). Please select a category for each expense before importing.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ marginBottom: '20px' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Category *</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvDataWithCategories.map((item, index) => (
                      <tr key={index} style={{ backgroundColor: !item.categoryId ? '#fff3e0' : 'transparent' }}>
                        <td>{formatCSVDate(item.date)}</td>
                        <td>
                          <strong>{item.description1}</strong>
                          {item.description2 && <div style={{ fontSize: '0.9em', color: '#333', marginTop: '4px' }}>{item.description2}</div>}
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#F44336' }}>
                          ${item.amount.toFixed(2)}
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={item.categoryId}
                            onChange={(e) => handleCategoryChange(index, e.target.value)}
                            style={{ padding: '6px', minWidth: '150px' }}
                          >
                            <option value="">-- Select Category --</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ fontSize: '0.85em', color: '#999' }}>{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => { setShowImportModal(false); setCsvData([]); setCsvDataWithCategories([]); }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleImportExpenses}
                  style={{ background: '#4CAF50' }}
                >
                  <Check size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Import Selected ({csvDataWithCategories.filter(item => item.categoryId).length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses
