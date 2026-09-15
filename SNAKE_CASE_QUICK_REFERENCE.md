# Quick Reference: Snake Case Conversion Summary

## What Was Changed?

All database columns and table names have been converted from camelCase to snake_case to comply with PostgreSQL conventions and ensure compatibility with Supabase.

## Key Conversions

### Column Names
| Old (camelCase) | New (snake_case) | Used In |
|---|---|---|
| `expenseDate` | `expense_date` | expenses table |
| `categoryId` | `category_id` | expenses, recurring_expenses |
| `incomeDate` | `income_date` | incomes table |
| `targetAmount` | `target_amount` | savings_goals table |
| `currentAmount` | `current_amount` | savings_goals table |
| `targetDate` | `deadline` | savings_goals table |
| `startDate` | `start_date` | incomes, recurring_expenses |
| `endDate` | `end_date` | incomes, recurring_expenses |
| `categoryName` | `category_name` | budgets table |
| `alertThreshold` | `alert_threshold` | budgets table |
| `isActive` | `is_active` | recurring_expenses table |

### Table Names
| Old | New |
|---|---|
| `savingsgoals` | `savings_goals` |
| `recurringexpenses` | `recurring_expenses` |
| `categories` | `categories` ✅ (no change) |
| `expenses` | `expenses` ✅ (no change) |
| `budgets` | `budgets` ✅ (no change) |
| `incomes` | `incomes` ✅ (no change) |

## Files Updated

1. **src/services/api.js** - All 30+ API functions updated with snake_case column references
2. **src/components/Budgets.jsx** - 4 instances of `alertThreshold` → `alert_threshold`
3. **src/components/Dashboard.jsx** - 6 instances of `categoryName` → `category_name`
4. **src/components/Expenses.jsx** - 13 instances of `expenseDate`/`categoryId` → snake_case
5. **src/components/ExpenseSheet.jsx** - 9 instances of `expenseDate`/`categoryId` → snake_case
6. **src/components/Incomes.jsx** - 18 instances of income-related fields → snake_case
7. **src/components/RecurringExpenses.jsx** - 10 instances of `categoryId`/`startDate`/`endDate` → snake_case
8. **src/components/SavingsGoals.jsx** - 8 instances of `targetAmount`/`currentAmount` → snake_case
9. **SUPABASE_SETUP.md** - Updated all SQL CREATE TABLE statements
10. **SUPABASE_MIGRATION.md** - Updated table name references

## How It Works

```
Component State (camelCase)          Database Columns (snake_case)
─────────────────────                ─────────────────────
formData.expenseDate          →      expense_date
formData.categoryId           →      category_id
formData.targetAmount         →      target_amount
etc.                                  etc.
```

The api.js wrapper layer converts between component state (camelCase) and database queries (snake_case).

## Testing Steps

1. **Verify Build**
   ```bash
   npm run build  # Should succeed with no errors
   ```

2. **Create Supabase Tables**
   - Open Supabase SQL Editor
   - Copy SQL from SUPABASE_SETUP.md
   - Execute all CREATE TABLE statements

3. **Grant Permissions**
   - Run GRANT statements from SUPABASE_SETUP.md
   - Ensure anonymous role has SELECT, INSERT, UPDATE, DELETE

4. **Test Locally**
   ```bash
   npm run dev
   # Navigate to http://localhost:5173
   # Log in and test expense entry
   ```

5. **Verify in Supabase**
   - Open Supabase SQL Editor
   - Query tables to confirm data is saving with snake_case columns:
   ```sql
   SELECT * FROM expenses LIMIT 1;  -- Should show expense_date, category_id
   SELECT * FROM incomes LIMIT 1;   -- Should show income_date
   SELECT * FROM savings_goals LIMIT 1;  -- Should show target_amount, current_amount
   ```

## Troubleshooting

### Error: "relation 'expenses' does not exist"
- Check that tables are created with lowercase names
- Confirm SQL CREATE TABLE statements were executed

### Error: "column 'expenseDate' does not exist"
- Confirm all columns use snake_case (expense_date, not expenseDate)
- Check SUPABASE_SETUP.md for correct column names

### Error: "permission denied for schema public"
- Run GRANT statements from SUPABASE_SETUP.md
- Verify anon role has permissions

### Data not appearing in forms
- Check browser console for errors
- Verify column names match in both api.js and database
- Check .env.local has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

## Build Status

✅ **Production Build: SUCCESS**
- Build time: 3.05s
- Bundle size: ~892 KB (with warning about chunk size, but no errors)
- Exit code: 0

## Documentation

- [SNAKE_CASE_CONVERSION.md](SNAKE_CASE_CONVERSION.md) - Detailed conversion guide
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Database setup and SQL
- [SUPABASE_MIGRATION.md](SUPABASE_MIGRATION.md) - Migration summary
- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Production deployment
