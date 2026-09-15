# Supabase Setup Guide for BMS Frontend

This guide walks you through setting up Supabase as your database backend and deploying to Vercel.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project name**: `bms-budget-system` (or your choice)
   - **Database password**: Create a strong password (save this!)
   - **Region**: Select closest to your location
5. Click "Create new project" and wait for initialization (~3-5 minutes)

## Step 2: Get Your Credentials

1. Once the project is ready, go to **Settings > API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** → `VITE_SUPABASE_ANON_KEY`
3. Save these in `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Create Database Tables

Use the Supabase SQL Editor to create these tables:

### Categories Table
```sql
create table categories (
  id bigint primary key generated always as identity,
  name text not null unique,
  description text,
  created_at timestamp default current_timestamp
);
```

### Expenses Table
```sql
create table expenses (
  id bigint primary key generated always as identity,
  category_id bigint not null references categories(id) on delete cascade,
  amount decimal(10, 2) not null,
  description text,
  expense_date date not null,
  created_at timestamp default current_timestamp
);

create index idx_expenses_date on expenses(expense_date);
create index idx_expenses_category on expenses(category_id);
```

### Budgets Table
```sql
create table budgets (
  id bigint primary key generated always as identity,
  category_name text not null,
  amount decimal(10, 2) not null,
  alert_threshold integer default 80,
  month text,
  created_at timestamp default current_timestamp
);
```

### Incomes Table
```sql
create table incomes (
  id bigint primary key generated always as identity,
  amount decimal(10, 2) not null,
  description text,
  income_date date not null,
  adjustments jsonb,
  start_date date,
  end_date date,
  created_at timestamp default current_timestamp
);

create index idx_incomes_date on incomes(income_date);
```

### Savings Goals Table
```sql
create table savings_goals (
  id bigint primary key generated always as identity,
  name text not null,
  target_amount decimal(10, 2) not null,
  current_amount decimal(10, 2) default 0,
  deadline date,
  created_at timestamp default current_timestamp
);
```

### Recurring Expenses Table
```sql
create table recurring_expenses (
  id bigint primary key generated always as identity,
  name text not null,
  amount decimal(10, 2) not null,
  frequency text not null, -- 'daily', 'weekly', 'monthly', 'yearly'
  category_id bigint not null references categories(id),
  start_date date,
  end_date date,
  is_active boolean default true,
  interval_days integer default 30,
  created_at timestamp default current_timestamp
);
```

## Step 4: Grant Permissions

After creating all tables, run these GRANT statements in the Supabase SQL Editor to allow the anonymous role to access the data:

```sql
-- Grant permissions for all tables to anonymous users (development)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incomes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings_goals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_expenses TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
```

**Note:** For production, use Row Level Security (RLS) instead of granting direct permissions to the anon role.

## Step 5: (Optional) Set Row Level Security (RLS)

For production, enable RLS on tables:

1. Go to **Authentication > Policies**
2. For each table, enable "Enable RLS"
3. Add policies like:
```sql
-- Allow all authenticated users to read
create policy "Enable read for authenticated users" 
  on expenses for select 
  to authenticated 
  using (true);

-- Allow all authenticated users to insert
create policy "Enable insert for authenticated users" 
  on expenses for insert 
  to authenticated 
  with check (true);
```

## Step 5: Deploy to Vercel

### Option A: Deploy from GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_LOGIN_USERNAME`
   - `VITE_LOGIN_PASSWORD`
6. Click "Deploy"

### Option B: Deploy from CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
# When asked about environment variables, add:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_LOGIN_USERNAME
# - VITE_LOGIN_PASSWORD
```

## Step 6: Update Supabase CORS Settings

1. Go to **Settings > API**
2. Scroll to **CORS Settings**
3. Add your Vercel domain:
   ```
   https://your-project.vercel.app
   ```

## Step 7: Verify Connection

After deployment:

1. Visit your Vercel URL
2. Log in with your credentials
3. Try adding a category or expense
4. Check Supabase dashboard to see data appear

## Troubleshooting

### "No tables found" error
- Make sure all SQL tables are created in step 3
- Check table names match exactly (case-sensitive)

### CORS error when saving
- Add your Vercel domain to Supabase CORS settings
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct

### Authentication errors
- Check that `VITE_LOGIN_USERNAME` and `VITE_LOGIN_PASSWORD` are set
- Make sure you're entering correct credentials

### Data not saving
- Check browser console for errors
- Verify Supabase project is active (not paused)
- Check table permissions if RLS is enabled

## Security Notes

⚠️ **Important for Production:**

1. Never commit `.env.local` - use `.env.example` as template
2. Use Supabase anon key only (never expose service role key)
3. Enable RLS (Row Level Security) on production databases
4. Change default login credentials immediately
5. Set up proper authentication instead of hardcoded credentials
6. Use HTTPS only (Vercel does this automatically)
7. Regularly backup your database in Supabase

## Next Steps

- Set up proper authentication (Supabase Auth or OAuth)
- Add database backups
- Monitor database usage and quotas
- Set up error logging/monitoring
- Implement data validation on backend

For more help, see:
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [React Integration](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
