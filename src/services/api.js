import axios from 'axios'

const API_BASE_URL = 'http://localhost:5036/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Categories
export const getCategories = () => api.get('/categories')
export const createCategory = (data) => api.post('/categories', data)

// Expenses
export const getExpenses = (params) => api.get('/expenses', { params })
export const getExpenseById = (id) => api.get(`/expenses/${id}`)
export const createExpense = (data) => api.post('/expenses', data)
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`)
export const getTotalExpenses = (params) => api.get('/expenses/total', { params })

// Incomes
export const getIncomes = (params) => api.get('/incomes', { params })
export const createIncome = (data) => api.post('/incomes', data)
export const updateIncome = (id, data) => api.put(`/incomes/${id}`, data)
export const deleteIncome = (id) => api.delete(`/incomes/${id}`)
export const saveIncomeAdjustments = (incomeId, adjustments) => api.post(`/incomes/${incomeId}/adjustments`, { adjustments })

// Budgets
export const getBudgets = (params) => api.get('/budgets', { params })
export const createBudget = (data) => api.post('/budgets', data)
export const updateBudget = (id, data) => api.put(`/budgets/${id}`, data)
export const deleteBudget = (id) => api.delete(`/budgets/${id}`)
export const getBudgetAlerts = () => api.get('/budgets/alerts')

// Savings Goals
export const getSavingsGoals = () => api.get('/savingsgoals')
export const createSavingsGoal = (data) => api.post('/savingsgoals', data)
export const updateSavingsGoal = (id, data) => api.put(`/savingsgoals/${id}`, data)
export const deleteSavingsGoal = (id) => api.delete(`/savingsgoals/${id}`)
export const contributeSavingsGoal = (id, amount) => api.post(`/savingsgoals/${id}/contribute`, { amount })

// Recurring Expenses
export const getRecurringExpenses = (params) => api.get('/recurringexpenses', { params })
export const getRecurringExpenseById = (id) => api.get(`/recurringexpenses/${id}`)
export const createRecurringExpense = (data) => api.post('/recurringexpenses', data)
export const updateRecurringExpense = (id, data) => api.put(`/recurringexpenses/${id}`, data)
export const deleteRecurringExpense = (id) => api.delete(`/recurringexpenses/${id}`)
export const processRecurringExpenses = () => api.post('/recurringexpenses/process')

// Dashboard
export const getDashboard = (params) => api.get('/dashboard', { params })
export const getMonthlyTrends = (months = 6) => api.get(`/dashboard/trends?months=${months}`)
export const getCategorySpending = (params) => api.get('/dashboard/category-spending', { params })

export default api