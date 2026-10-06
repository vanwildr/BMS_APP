-- Dashboard Summary View for Supabase - Simple and Working Version
-- This view provides basic stats; for JSON arrays use separate queries or the function

DROP VIEW IF EXISTS dashboard_summary CASCADE;

CREATE VIEW dashboard_summary AS
SELECT
  (SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) FROM incomes)::numeric as totalIncome,
  (SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) FROM expenses)::numeric as totalExpenses,
  (SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) FROM incomes)::numeric - 
  (SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) FROM expenses)::numeric as netIncome,
  CASE 
    WHEN (SELECT COALESCE(SUM(amount), 0) FROM budgets) = 0 THEN 0::numeric
    ELSE ROUND(
      ((SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)::numeric FROM expenses) / 
       (SELECT COALESCE(SUM(amount), 0)::numeric FROM budgets)) * 100, 2
    )
  END as budgetUtilization;


-- Monthly Trends View
DROP VIEW IF EXISTS monthly_trends CASCADE;

CREATE VIEW monthly_trends AS
WITH monthly_data AS (
  SELECT 
    DATE_TRUNC('month', e.expense_date)::date as month_date,
    TO_CHAR(DATE_TRUNC('month', e.expense_date), 'Mon YYYY') as monthName,
    COALESCE(SUM(CASE WHEN i.amount > 0 THEN i.amount ELSE 0 END), 0)::numeric as totalIncome,
    COALESCE(SUM(CASE WHEN e.amount > 0 THEN e.amount ELSE 0 END), 0)::numeric as totalExpenses
  FROM expenses e
  LEFT JOIN incomes i ON DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', i.income_date)
  GROUP BY DATE_TRUNC('month', e.expense_date)
)
SELECT 
  month_date,
  monthName,
  totalIncome,
  totalExpenses,
  (totalIncome - totalExpenses)::numeric as netSavings
FROM monthly_data
ORDER BY month_date DESC;


-- Top Categories by Spending View
DROP VIEW IF EXISTS top_categories_spending CASCADE;

CREATE VIEW top_categories_spending AS
SELECT 
  c.id as category_id,
  c.name as category_name,
  COALESCE(SUM(CASE WHEN e.amount > 0 THEN e.amount ELSE 0 END), 0)::numeric as totalAmount,
  CASE 
    WHEN (SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) FROM expenses) = 0 THEN 0::numeric
    ELSE ROUND(
      (COALESCE(SUM(CASE WHEN e.amount > 0 THEN e.amount ELSE 0 END), 0)::numeric / 
       (SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)::numeric FROM expenses)) * 100, 2
    )
  END as percentage
FROM categories c
LEFT JOIN expenses e ON c.id = e.category_id
GROUP BY c.id, c.name
ORDER BY totalAmount DESC;


-- Recent Expenses View
DROP VIEW IF EXISTS recent_expenses_list CASCADE;

CREATE VIEW recent_expenses_list AS
SELECT 
  e.id,
  e.expense_date as expenseDate,
  e.description,
  COALESCE(c.name, 'Unknown') as category_name,
  e.amount
FROM expenses e
LEFT JOIN categories c ON e.category_id = c.id
ORDER BY e.expense_date DESC
LIMIT 10;


-- Savings Progress View
DROP VIEW IF EXISTS savings_progress_list CASCADE;

CREATE VIEW savings_progress_list AS
SELECT 
  id,
  name,
  target_amount as targetAmount,
  current_amount as currentAmount,
  CASE 
    WHEN target_amount = 0 THEN 0::numeric
    ELSE ROUND((current_amount::numeric / target_amount::numeric) * 100, 2)
  END as progressPercentage
FROM savings_goals
ORDER BY (current_amount::numeric / NULLIF(target_amount::numeric, 0)) DESC;


-- Composite Function to return everything as JSON
DROP FUNCTION IF EXISTS get_dashboard_summary() CASCADE;

CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS json AS $$
DECLARE
  v_summary json;
  v_trends json;
  v_categories json;
  v_recent json;
  v_savings json;
BEGIN
  -- Get dashboard summary
  SELECT json_build_object(
    'totalIncome', totalIncome,
    'totalExpenses', totalExpenses,
    'netIncome', netIncome,
    'budgetUtilization', budgetUtilization
  ) INTO v_summary FROM dashboard_summary;

  -- Get monthly trends
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'month', month_date,
        'monthName', monthName,
        'totalIncome', totalIncome,
        'totalExpenses', totalExpenses,
        'netSavings', netSavings
      )
    ),
    '[]'::json
  ) INTO v_trends FROM monthly_trends;

  -- Get top categories
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'category_id', category_id,
        'category_name', category_name,
        'totalAmount', totalAmount,
        'percentage', percentage
      )
    ),
    '[]'::json
  ) INTO v_categories FROM top_categories_spending;

  -- Get recent expenses
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', id,
        'expenseDate', expenseDate,
        'description', description,
        'category_name', category_name,
        'amount', amount
      )
    ),
    '[]'::json
  ) INTO v_recent FROM recent_expenses_list;

  -- Get savings progress
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'targetAmount', targetAmount,
        'currentAmount', currentAmount,
        'progressPercentage', progressPercentage
      )
    ),
    '[]'::json
  ) INTO v_savings FROM savings_progress_list;

  -- Combine all into one object
  RETURN json_build_object(
    'totalIncome', (v_summary->>'totalIncome')::numeric,
    'totalExpenses', (v_summary->>'totalExpenses')::numeric,
    'netIncome', (v_summary->>'netIncome')::numeric,
    'budgetUtilization', (v_summary->>'budgetUtilization')::numeric,
    'monthlyTrends', v_trends,
    'topCategoriesBySpending', v_categories,
    'recentExpenses', v_recent,
    'savingsProgress', v_savings
  );
END;
$$ LANGUAGE plpgsql STABLE;


-- SETUP INSTRUCTIONS:
-- 1. Copy and paste all SQL code into Supabase SQL Editor
-- 2. Run the entire script
-- 3. Grant permissions (run these in Supabase as authenticated user):

-- Grant permissions on views
GRANT SELECT ON dashboard_summary TO anon, authenticated;
GRANT SELECT ON monthly_trends TO anon, authenticated;
GRANT SELECT ON top_categories_spending TO anon, authenticated;
GRANT SELECT ON recent_expenses_list TO anon, authenticated;
GRANT SELECT ON savings_progress_list TO anon, authenticated;

-- Grant permission on function
GRANT EXECUTE ON FUNCTION get_dashboard_summary() TO anon, authenticated;

-- 4. In your API (src/services/api.js), update getDashboard() to use:
--    SELECT get_dashboard_summary() as data;

-- USAGE EXAMPLES:

-- Get basic dashboard stats (view):
-- SELECT * FROM dashboard_summary;

-- Get full dashboard with all arrays as JSON (function):
-- SELECT get_dashboard_summary() as data;

-- Get individual data sets (views):
-- SELECT * FROM monthly_trends;
-- SELECT * FROM top_categories_spending;
-- SELECT * FROM recent_expenses_list;
-- SELECT * FROM savings_progress_list;
