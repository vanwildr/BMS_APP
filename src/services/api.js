import { supabase } from './supabase'

// Helper to format response like axios
const formatResponse = (data) => ({
  data: data,
  status: 200
})

// Helper to handle Supabase errors
const handleError = (error) => {
  const err = new Error(error.message)
  err.response = {
    data: {
      message: error.message
    },
    status: 400
  }
  throw err
}

// Categories
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    if (error) handleError(error)
    return formatResponse(data || [])
  } catch (err) {
    throw err
  }
}

export const createCategory = async (data) => {
  try {
    const { data: result, error } = await supabase
      .from('categories')
      .insert([data])
      .select()
    if (error) handleError(error)
    return formatResponse(result?.[0])
  } catch (err) {
    throw err
  }
}

// Expenses
export const getExpenses = async (params) => {
  try {
    let query = supabase
      .from('expenses')
      .select('*, categories(name)')

    if (params?.start_date) {
      query = query.gte('expense_date', params.start_date)
    }
    if (params?.end_date) {
      query = query.lte('expense_date', params.end_date)
    }

    query = query.order('expense_date', { ascending: false })

    if (params?.pageSize) {
      query = query.limit(params.pageSize)
    }

    const { data, error } = await query

    if (error) handleError(error)
    
    // Flatten the categories data into category_name for component compatibility
    const flattened = (data || []).map(expense => ({
      ...expense,
      category_name: expense.categories?.name || 'Unknown'
    }))
    
    return formatResponse({ data: flattened })
  } catch (err) {
    throw err
  }
}

export const getExpenseById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, categories(name)')
      .eq('id', id)
      .single()
    if (error) handleError(error)
    
    // Flatten the categories data into category_name for component compatibility
    const flattened = data ? {
      ...data,
      category_name: data.categories?.name || 'Unknown'
    } : null
    
    return formatResponse(flattened)
  } catch (err) {
    throw err
  }
}

export const createExpense = async (data) => {
  try {
    const { data: result, error } = await supabase
      .from('expenses')
      .insert([data])
      .select('*, categories(name)')
    if (error) handleError(error)
    
    // Flatten the categories data into category_name for component compatibility
    const expense = result?.[0]
    const flattened = expense ? {
      ...expense,
      category_name: expense.categories?.name || 'Unknown'
    } : null
    
    return formatResponse(flattened)
  } catch (err) {
    throw err
  }
}

export const updateExpense = async (id, data) => {
  try {
    const { data: result, error } = await supabase
      .from('expenses')
      .update(data)
      .eq('id', id)
      .select('*, categories(name)')
    if (error) handleError(error)
    
    // Flatten the categories data into category_name for component compatibility
    const expense = result?.[0]
    const flattened = expense ? {
      ...expense,
      category_name: expense.categories?.name || 'Unknown'
    } : null
    
    return formatResponse(flattened)
  } catch (err) {
    throw err
  }
}

export const deleteExpense = async (id) => {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    if (error) handleError(error)
    return formatResponse({ success: true })
  } catch (err) {
    throw err
  }
}

export const getTotalExpenses = async (params) => {
  try {
    let query = supabase
      .from('expenses')
      .select('amount', { count: 'exact' })

    if (params?.start_date) {
      query = query.gte('expense_date', params.start_date)
    }
    if (params?.end_date) {
      query = query.lte('expense_date', params.end_date)
    }

    const { data, error, count } = await query

    if (error) handleError(error)
    const total = data?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0
    return formatResponse({ total, count })
  } catch (err) {
    throw err
  }
}

// Incomes
export const getIncomes = async (params) => {
  try {
    let query = supabase
      .from('incomes')
      .select('*')

    if (params?.start_date) {
      query = query.gte('income_date', params.start_date)
    }
    if (params?.end_date) {
      query = query.lte('income_date', params.end_date)
    }

    query = query.order('income_date', { ascending: false })

    if (params?.pageSize) {
      query = query.limit(params.pageSize)
    }

    const { data, error } = await query

    if (error) handleError(error)
    return formatResponse({ data: data || [] })
  } catch (err) {
    throw err
  }
}

export const createIncome = async (data) => {
  try {
    const { data: result, error } = await supabase
      .from('incomes')
      .insert([data])
      .select()
    if (error) handleError(error)
    return formatResponse(result?.[0])
  } catch (err) {
    throw err
  }
}

export const updateIncome = async (id, data) => {
  try {
    const { data: result, error } = await supabase
      .from('incomes')
      .update(data)
      .eq('id', id)
      .select()
    if (error) handleError(error)
    return formatResponse(result?.[0])
  } catch (err) {
    throw err
  }
}

export const deleteIncome = async (id) => {
  try {
    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', id)
    if (error) handleError(error)
    return formatResponse({ success: true })
  } catch (err) {
    throw err
  }
}

export const saveIncomeAdjustments = async (incomeId, adjustments) => {
  try {
    const { data, error } = await supabase
      .from('incomes')
      .update({ adjustments })
      .eq('id', incomeId)
      .select()
    if (error) handleError(error)
    return formatResponse(data?.[0])
  } catch (err) {
    throw err
  }
}

// Budgets
export const getBudgets = async (params) => {
  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(name)')
      .order('category_id')
    if (error) handleError(error)
    
    // Flatten the categories data into category_name for component compatibility
    const flattened = (data || []).map(budget => ({
      ...budget,
      category_name: budget.categories?.name || 'Unknown'
    }))
    
    return formatResponse(flattened || [])
  } catch (err) {
    throw err
  }
}

export const createBudget = async (data) => {
  try {
    const { data: result, error } = await supabase
      .from('budgets')
      .insert([data])
      .select()
    if (error) handleError(error)
    return formatResponse(result?.[0])
  } catch (err) {
    throw err
  }
}

export const updateBudget = async (id, data) => {
  try {
    const { data: result, error } = await supabase
      .from('budgets')
      .update(data)
      .eq('id', id)
      .select()
    if (error) handleError(error)
    return formatResponse(result?.[0])
  } catch (err) {
    throw err
  }
}

export const deleteBudget = async (id) => {
  try {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
    if (error) handleError(error)
    return formatResponse({ success: true })
  } catch (err) {
    throw err
  }
}

export const getBudgetAlerts = async () => {
  try {
    const { data, error } = await supabase
      .from('budget_alerts')
      .select('*')
    if (error) handleError(error)
    return formatResponse(data || [])
  } catch (err) {
    throw err
  }
}

// Savings Goals
export const getSavingsGoals = async () => {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('name')
    if (error) handleError(error)
    return formatResponse(data || [])
  } catch (err) {
    throw err
  }
}

export const createSavingsGoal = async (data) => {
  try {
    const { data: result, error } = await supabase
      .from('savings_goals')
      .insert([data])
      .select()
    if (error) handleError(error)
    return formatResponse(result?.[0])
  } catch (err) {
    throw err
  }
}

export const updateSavingsGoal = async (id, data) => {
  try {
    const { data: result, error } = await supabase
      .from('savings_goals')
      .update(data)
      .eq('id', id)
      .select()
    if (error) handleError(error)
    return formatResponse(result?.[0])
  } catch (err) {
    throw err
  }
}

export const deleteSavingsGoal = async (id) => {
  try {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id)
    if (error) handleError(error)
    return formatResponse({ success: true })
  } catch (err) {
    throw err
  }
}

export const contributeSavingsGoal = async (id, amount) => {
  try {
    // Get current goal
    const { data: goal, error: fetchError } = await supabase
      .from('savings_goals')
      .select('current_amount')
      .eq('id', id)
      .single()
    
    if (fetchError) handleError(fetchError)

    const newAmount = (goal?.current_amount || 0) + amount

    const { data: result, error } = await supabase
      .from('savings_goals')
      .update({ current_amount: newAmount })
      .eq('id', id)
      .select()
    if (error) handleError(error)
    return formatResponse(result?.[0])
  } catch (err) {
    throw err
  }
}

// Recurring Expenses
export const getRecurringExpenses = async (params) => {
  try {
    let query = supabase
      .from('recurring_expenses')
      .select('*')
      .order('name')

    if (params?.pageSize) {
      query = query.limit(params.pageSize)
    }

    const { data, error } = await query

    if (error) handleError(error)
    return formatResponse({ data: data || [] })
  } catch (err) {
    throw err
  }
}

export const getRecurringExpenseById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('id', id)
      .single()
    if (error) handleError(error)
    return formatResponse(data)
  } catch (err) {
    throw err
  }
}

export const createRecurringExpense = async (data) => {
  try {
    const { data: result, error } = await supabase
      .from('recurring_expenses')
      .insert([data])
      .select()
    if (error) handleError(error)
    return formatResponse(result?.[0])
  } catch (err) {
    throw err
  }
}

export const updateRecurringExpense = async (id, data) => {
  try {
    const { data: result, error } = await supabase
      .from('recurring_expenses')
      .update(data)
      .eq('id', id)
      .select()
    if (error) handleError(error)
    return formatResponse(result?.[0])
  } catch (err) {
    throw err
  }
}

export const deleteRecurringExpense = async (id) => {
  try {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id)
    if (error) handleError(error)
    return formatResponse({ success: true })
  } catch (err) {
    throw err
  }
}

export const processRecurringExpenses = async () => {
  try {
    // This would typically call a Supabase function or backend
    const { data, error } = await supabase
      .rpc('process_recurring_expenses')
    if (error) handleError(error)
    return formatResponse(data)
  } catch (err) {
    throw err
  }
}

// Dashboard
export const getDashboard = async (params) => {
  try {
    let query = supabase
      .from('dashboard_summary')
      .select('*')

    const { data, error } = await query

    if (error) handleError(error)
    return formatResponse(data || {})
  } catch (err) {
    throw err
  }
}

export const getMonthlyTrends = async (months = 6) => {
  try {
    const { data, error } = await supabase
      .from('monthly_trends')
      .select('*')
      .limit(months)
      .order('month', { ascending: false })

    if (error) handleError(error)
    return formatResponse(data || [])
  } catch (err) {
    throw err
  }
}

export const getCategorySpending = async (params) => {
  try {
    const { data, error } = await supabase
      .from('category_spending')
      .select('*')
      .order('amount', { ascending: false })

    if (error) handleError(error)
    return formatResponse(data || [])
  } catch (err) {
    throw err
  }
}

export default supabase