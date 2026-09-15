import React, { useState, useEffect } from 'react'
import { getDashboard, getBudgetAlerts, getRecurringExpenses, getIncomes, getBudgets, getCategories } from '../services/api'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Wallet, ChevronDown, ChevronUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

const COLORS = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336', '#3F51B5', '#009688', '#607D8B']

function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [recurringExpenses, setRecurringExpenses] = useState([])
  const [recurringIncomes, setRecurringIncomes] = useState([])
  const [projectedCashBalance, setProjectedCashBalance] = useState([])
  const [showCashProjection, setShowCashProjection] = useState(false)
  const [sortColumn, setSortColumn] = useState('category_name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadDashboard()
    loadAlerts()
    loadBudgets()
    loadCategories()
    loadRecurringData()
  }, [dateRange])

  const loadBudgets = async () => {
    try {
      const response = await getBudgets()
      setBudgets(response.data || [])
    } catch (error) {
      console.error('Error loading budgets:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadRecurringData = async () => {
    try {
      const [expensesRes, incomesRes] = await Promise.all([
        getRecurringExpenses({ isActive: true }),
        getIncomes({ isRecurring: true })
      ])
      setRecurringExpenses(expensesRes.data || [])
      setRecurringIncomes(incomesRes.data?.data || [])
    } catch (error) {
      console.error('Error loading recurring data:', error)
    }
  }

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await getDashboard(dateRange)
      setDashboard(response.data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAlerts = async () => {
    try {
      const response = await getBudgetAlerts()
      setAlerts(response.data)
    } catch (error) {
      console.error('Error loading alerts:', error)
    }
  }

  const calculateCashProjection = () => {
    if (!dashboard || recurringExpenses.length === 0) return

    const startingBalance = dashboard.netIncome
    const weeks = 13
    const projections = []
    let balance = startingBalance

    for (let week = 1; week <= weeks; week++) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() + (week - 1) * 7)
      
      let weeklyIncome = 0
      let weeklyExpenses = 0

      // Calculate income for this week
      recurringIncomes.forEach(income => {
        if (income.isRecurring && income.frequency) {
          const frequency = income.frequency
          if (frequency === 2 || frequency === 5) { // Weekly or Biweekly
            const interval = frequency === 2 ? 7 : 14
            const startDate = new Date(income.incomeDate)
            const daysDiff = Math.floor((weekStart - startDate) / (1000 * 60 * 60 * 24))
            if (daysDiff >= 0 && daysDiff % interval < 7) {
              weeklyIncome += parseFloat(income.amount) || 0
            }
          } else if (frequency === 1) { // Daily
            weeklyIncome += (parseFloat(income.amount) || 0) * 7
          } else if (frequency === 3) { // Monthly
            if (weekStart.getDate() <= 7) weeklyIncome += parseFloat(income.amount) || 0
          } else if (frequency === 4) { // Yearly
            if (weekStart.getMonth() === 0 && weekStart.getDate() <= 7) weeklyIncome += parseFloat(income.amount) || 0
          }
        }
      })

      // Calculate expenses for this week
      recurringExpenses.forEach(expense => {
        const frequency = expense.frequency
        if (frequency === 2 || frequency === 5) { // Weekly or Biweekly
          const interval = frequency === 2 ? 7 : 14
          const startDate = new Date(expense.start_date)
          const daysDiff = Math.floor((weekStart - startDate) / (1000 * 60 * 60 * 24))
          if (daysDiff >= 0 && daysDiff % interval < 7 && (!expense.end_date || new Date(expense.end_date) >= weekStart)) {
            weeklyExpenses += parseFloat(expense.amount) || 0
          }
        } else if (frequency === 1) { // Daily
          weeklyExpenses += (parseFloat(expense.amount) || 0) * 7
        } else if (frequency === 3) { // Monthly
          if (weekStart.getDate() <= 7) weeklyExpenses += parseFloat(expense.amount) || 0
        } else if (frequency === 4) { // Yearly
          if (weekStart.getMonth() === 0 && weekStart.getDate() <= 7) weeklyExpenses += parseFloat(expense.amount) || 0
        }
      })

      balance += weeklyIncome - weeklyExpenses

      projections.push({
        week,
        weekDate: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: parseFloat(balance.toFixed(2)),
        income: parseFloat(weeklyIncome.toFixed(2)),
        expenses: parseFloat(weeklyExpenses.toFixed(2)),
        netChange: parseFloat((weeklyIncome - weeklyExpenses).toFixed(2))
      })
    }

    setProjectedCashBalance(projections)
  }

  useEffect(() => {
    if (dashboard && recurringExpenses.length >= 0 && recurringIncomes.length >= 0) {
      calculateCashProjection()
    }
  }, [dashboard, recurringExpenses, recurringIncomes])

  const getSortedCategories = () => {
    const categoriesWithSpending = categories.map(category => {
      const budget = budgets.find(b => b.category_id === category.id)
      const spent = dashboard?.topCategoriesBySpending?.find(
        cat => cat.category_id === category.id
      )?.totalAmount || 0
      const remaining = budget ? budget.amount - spent : 0
      const percentUsed = budget ? (spent / budget.amount) * 100 : 0

      return {
        ...category,
        budget: budget?.amount || 0,
        spent,
        remaining,
        percentUsed,
        hasBudget: !!budget,
        budgetId: budget?.id
      }
    })

    return [...categoriesWithSpending].sort((a, b) => {
      let aValue, bValue

      switch (sortColumn) {
        case 'spent':
          aValue = a.spent
          bValue = b.spent
          break
        case 'budget':
          aValue = a.budget
          bValue = b.budget
          break
        case 'remaining':
          aValue = a.remaining
          bValue = b.remaining
          break
        case 'percentUsed':
          aValue = a.percentUsed
          bValue = b.percentUsed
          break
        case 'category_name':
        default:
          aValue = a.name
          bValue = b.name
          break
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const SortableHeader = ({ column, label }) => (
    <th
      onClick={() => handleSort(column)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      title={`Sort by ${label}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {label}
        {sortColumn === column && (
          sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
        )}
      </div>
    </th>
  )


  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title">Financial Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9em' }}>From:</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              style={{ width: '140px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9em' }}>To:</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              style={{ width: '140px' }}
            />
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div className="card" style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #FF9800' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <AlertTriangle size={24} color="#FF9800" />
            <h3>Budget Alerts</h3>
          </div>
          {alerts.map((alert) => (
            <div key={alert.budgetId} className="alert alert-warning" style={{ marginBottom: '10px' }}>
                <strong>{alert.category_name}</strong>: {alert.message}
              <br />
              <small>
                Spent: ${alert.spentAmount.toFixed(2)} / ${alert.budgetAmount.toFixed(2)} 
                ({alert.utilizationPercentage.toFixed(1)}%)
              </small>
            </div>
          ))}
        </div>
      )}

      {/* Budget vs Spending Grid */}
      {categories.length > 0 && (
        <div className="card">
          <h2 className="card-title">Budget vs Spending</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <SortableHeader column="category_name" label="Category" />
                  <SortableHeader column="budget" label="Budget" />
                  <SortableHeader column="spent" label="Spent" />
                  <SortableHeader column="remaining" label="Remaining" />
                  <SortableHeader column="percentUsed" label="% Used" />
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {getSortedCategories().map((item) => {
                  if (!item.hasBudget) {
                    return (
                      <tr key={`category-${item.id}`} style={{ backgroundColor: 'rgba(200, 200, 200, 0.05)' }}>
                        <td><strong>{item.name}</strong></td>
                        <td style={{ color: '#999' }}>No budget</td>
                        <td style={{ fontWeight: 'bold' }}>
                          ${item.spent.toFixed(2)}
                        </td>
                        <td style={{ color: '#999' }}>-</td>
                        <td style={{ color: '#999' }}>-</td>
                        <td>-</td>
                      </tr>
                    )
                  }

                  const statusColor = item.percentUsed > 100 ? '#F44336' : item.percentUsed > 75 ? '#FF9800' : '#4CAF50'

                  return (
                    <tr key={`budget-${item.budgetId}`} style={{ backgroundColor: item.percentUsed > 100 ? 'rgba(244, 67, 54, 0.05)' : 'transparent' }}>
                      <td><strong>{item.name}</strong></td>
                      <td>${item.budget.toFixed(2)}</td>
                      <td style={{ color: item.percentUsed > 100 ? '#F44336' : '#000', fontWeight: 'bold' }}>
                        ${item.spent.toFixed(2)}
                      </td>
                      <td style={{ color: item.remaining < 0 ? '#F44336' : '#4CAF50', fontWeight: 'bold' }}>
                        ${item.remaining.toFixed(2)}
                      </td>
                      <td style={{ color: statusColor, fontWeight: 'bold' }}>
                        {item.percentUsed.toFixed(1)}%
                      </td>
                      <td style={{ minWidth: '200px' }}>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(item.percentUsed, 100)}%`,
                              backgroundColor: statusColor
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const categories = getSortedCategories()
                  const totalBudget = categories.reduce((sum, item) => sum + item.budget, 0)
                  const totalSpent = categories.reduce((sum, item) => sum + item.spent, 0)
                  const totalRemaining = totalBudget - totalSpent
                  const totalPercentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
                  const totalStatusColor = totalPercentUsed > 100 ? '#F44336' : totalPercentUsed > 75 ? '#FF9800' : '#4CAF50'

                  return (
                    <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', fontWeight: 'bold', borderTop: '2px solid #ddd' }}>
                      <td><strong>TOTAL</strong></td>
                      <td>${totalBudget.toFixed(2)}</td>
                      <td style={{ color: totalPercentUsed > 100 ? '#F44336' : '#000' }}>
                        ${totalSpent.toFixed(2)}
                      </td>
                      <td style={{ color: totalRemaining < 0 ? '#F44336' : '#4CAF50' }}>
                        ${totalRemaining.toFixed(2)}
                      </td>
                      <td style={{ color: totalStatusColor }}>
                        {totalPercentUsed.toFixed(1)}%
                      </td>
                      <td style={{ minWidth: '200px' }}>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(totalPercentUsed, 100)}%`,
                              backgroundColor: totalStatusColor
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  )
                })()}
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-4">
        <div className="stat-card info">
          <div className="stat-label">Total Income</div>
          <div className="stat-value">
            <DollarSign size={24} style={{ verticalAlign: 'middle' }} />
            {dashboard.totalIncome.toFixed(2)}
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">
            <TrendingDown size={24} style={{ verticalAlign: 'middle' }} />
            {dashboard.totalExpenses.toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Income</div>
          <div className="stat-value">
            {dashboard.netIncome >= 0 ? (
              <TrendingUp size={24} style={{ verticalAlign: 'middle' }} />
            ) : (
              <TrendingDown size={24} style={{ verticalAlign: 'middle' }} />
            )}
            {dashboard.netIncome.toFixed(2)}
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Budget Used</div>
          <div className="stat-value">
            <Wallet size={24} style={{ verticalAlign: 'middle' }} />
            {dashboard.budgetUtilization.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-2">
        {/* Monthly Trends */}
        <div className="card">
          <h2 className="card-title">Monthly Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboard.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalIncome" stroke="#4CAF50" name="Income" />
              <Line type="monotone" dataKey="totalExpenses" stroke="#F44336" name="Expenses" />
              <Line type="monotone" dataKey="netSavings" stroke="#2196F3" name="Savings" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Spending */}
        <div className="card">
          <h2 className="card-title">Spending by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboard.topCategoriesBySpending}
                dataKey="totalAmount"
                nameKey="category_name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.category_name} (${entry.percentage.toFixed(1)}%)`}
              >
                {dashboard.topCategoriesBySpending.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 13-Week Cash Projection */}
      {projectedCashBalance.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="card-title">13-Week Cash Balance Projection</h2>
            <button 
              className="btn btn-outline" 
              onClick={() => setShowCashProjection(!showCashProjection)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {showCashProjection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              {showCashProjection ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={projectedCashBalance} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="weekDate" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => `$${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              />
              <Legend />
              <Bar dataKey="balance" fill="#2196F3" name="Projected Balance" />
              <Bar dataKey="income" fill="#4CAF50" name="Weekly Income" />
              <Bar dataKey="expenses" fill="#F44336" name="Weekly Expenses" />
            </BarChart>
          </ResponsiveContainer>

          {/* Expandable Table */}
          {showCashProjection && (
            <div style={{ marginTop: '30px', overflowX: 'auto' }}>
              <table className="table" style={{ fontSize: '0.9em' }}>
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Starting Date</th>
                    <th>Weekly Income</th>
                    <th>Weekly Expenses</th>
                    <th>Net Change</th>
                    <th>Projected Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {projectedCashBalance.map((proj, index) => (
                    <tr key={index} style={{ backgroundColor: proj.balance < 0 ? 'rgba(244, 67, 54, 0.1)' : 'transparent' }}>
                      <td><strong>Week {proj.week}</strong></td>
                      <td>{proj.weekDate}</td>
                      <td style={{ color: '#4CAF50', fontWeight: 'bold' }}>+${proj.income.toFixed(2)}</td>
                      <td style={{ color: '#F44336', fontWeight: 'bold' }}>-${proj.expenses.toFixed(2)}</td>
                      <td style={{ fontWeight: 'bold', color: proj.netChange >= 0 ? '#4CAF50' : '#F44336' }}>
                        {proj.netChange >= 0 ? '+' : ''} ${proj.netChange.toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 'bold', color: proj.balance < 0 ? '#F44336' : '#2196F3', fontSize: '1.1em' }}>
                        ${proj.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Recent Expenses */}
      <div className="card">
        <h2 className="card-title">Recent Expenses</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.recentExpenses.map((expense) => (
              <tr key={expense.id}>
                <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                <td>{expense.description}</td>
                <td>
                  <span className="badge badge-success">{expense.category_name}</span>
                </td>
                <td>${expense.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Savings Goals Progress */}
      {dashboard.savingsProgress.length > 0 && (
        <div className="card">
          <h2 className="card-title">Savings Goals</h2>
          <div className="grid grid-2">
            {dashboard.savingsProgress.map((goal) => (
              <div key={goal.id} style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                <h4>{goal.name}</h4>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>${goal.currentAmount.toFixed(2)}</span>
                    <span>${goal.targetAmount.toFixed(2)}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${goal.progressPercentage > 75 ? '' : goal.progressPercentage > 50 ? 'warning' : 'danger'}`}
                      style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <small style={{ marginTop: '5px', display: 'block', color: '#666' }}>
                    {goal.progressPercentage.toFixed(1)}% Complete
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
