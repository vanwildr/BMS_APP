# 🚀 Supabase & Vercel Setup Checklist

## Phase 1: Supabase Setup ⏱️ ~15 minutes

- [ ] Create Supabase account at https://supabase.com
- [ ] Create new project
- [ ] Copy Project URL
- [ ] Copy Anon Key
- [ ] Go to SQL Editor in Supabase
- [ ] Create `categories` table (SQL in SUPABASE_SETUP.md)
- [ ] Create `expenses` table with indexes
- [ ] Create `budgets` table
- [ ] Create `incomes` table
- [ ] Create `savingsgoals` table
- [ ] Create `recurringexpenses` table
- [ ] Test connection locally

## Phase 2: Local Configuration ⏱️ ~5 minutes

- [ ] Copy `.env.example` to `.env.local`
- [ ] Replace `VITE_SUPABASE_URL` with your URL
- [ ] Replace `VITE_SUPABASE_ANON_KEY` with your key
- [ ] Keep login credentials or change them
- [ ] Run `npm run dev`
- [ ] Try adding a category
- [ ] Verify it appears in Supabase dashboard

## Phase 3: GitHub Setup ⏱️ ~5 minutes

- [ ] Create GitHub repository
- [ ] Add `.gitignore` entries (already included)
- [ ] Push code to GitHub
- [ ] Verify `.env.local` is NOT in git

```bash
# Make sure .env.local is ignored
git status
# Should NOT show .env.local
```

## Phase 4: Vercel Deployment ⏱️ ~10 minutes

### Option A: Via GitHub (Recommended)
- [ ] Go to https://vercel.com/new
- [ ] Click "Import Git Repository"
- [ ] Select your BMS-Frontend repo
- [ ] Add environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_LOGIN_USERNAME`
  - `VITE_LOGIN_PASSWORD`
- [ ] Click "Deploy"
- [ ] Wait for build to complete

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
# Follow prompts and add env vars
```

## Phase 5: Post-Deployment ⏱️ ~5 minutes

- [ ] Get your Vercel URL (e.g., https://bms-frontend.vercel.app)
- [ ] Go to Supabase Settings > API
- [ ] Add Vercel URL to CORS settings:
  ```
  https://your-project.vercel.app
  ```
- [ ] Wait 1-2 minutes for CORS to update
- [ ] Visit your Vercel URL
- [ ] Log in with your credentials
- [ ] Test adding an expense
- [ ] Verify it saves in Supabase

## Phase 6: Continuous Deployment ⏱️ Automatic

- [ ] Future pushes to GitHub automatically deploy
- [ ] Check Vercel dashboard for build logs
- [ ] Use git to manage versions

## Testing Checklist

**Local Testing (before Vercel):**
- [ ] Can access login page at localhost:5173
- [ ] Login works with correct credentials
- [ ] Can add a category
- [ ] Can add an expense
- [ ] Data appears in Supabase
- [ ] Can edit expense
- [ ] Can delete expense

**Production Testing (after Vercel):**
- [ ] Can access app at Vercel URL
- [ ] Login works
- [ ] Can add category/expense
- [ ] No CORS errors in console
- [ ] Data persists after refresh
- [ ] Responsive on mobile

## Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Build fails | Check `npm run build` locally first |
| CORS errors | Add Vercel domain to Supabase CORS |
| Blank page | Check browser console, verify env vars |
| Can't log in | Verify login credentials in `.env.local` |
| Data not saving | Verify Supabase tables exist |
| Database slow | Upgrade Supabase project |

## Important Security Notes

⚠️ **Before going live:**
- [ ] Change default login credentials
- [ ] Never commit `.env.local`
- [ ] Enable Row Level Security on Supabase
- [ ] Use strong passwords
- [ ] Review Supabase security settings
- [ ] Consider real authentication (OAuth, etc.)

## Environment Variables Checklist

**Must Set in `.env.local` (local dev):**
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_LOGIN_USERNAME=admin
VITE_LOGIN_PASSWORD=secure123
```

**Must Set in Vercel (Settings > Environment Variables):**
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_LOGIN_USERNAME=admin
VITE_LOGIN_PASSWORD=secure123
```

## Estimated Total Time: ~40 minutes

1. Supabase setup: 15 min
2. Local config: 5 min
3. GitHub setup: 5 min
4. Vercel deployment: 10 min
5. Testing: 5 min

## Next Steps After Deployment

- [ ] Set up proper authentication (Supabase Auth)
- [ ] Enable database backups
- [ ] Set up error logging
- [ ] Monitor database usage
- [ ] Add custom domain
- [ ] Set up GitHub Actions for CI/CD
- [ ] Document API schema

---

**Questions?** Check the detailed guides:
- SUPABASE_SETUP.md
- VERCEL_DEPLOYMENT.md
- SUPABASE_MIGRATION.md

**Status:** ✅ Ready to deploy!
