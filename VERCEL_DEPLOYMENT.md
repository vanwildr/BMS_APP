# Vercel Deployment Guide

Quick guide to deploy your BMS Frontend to Vercel.

## Prerequisites

- Supabase project set up (see SUPABASE_SETUP.md)
- GitHub account with your code pushed
- Vercel account (free tier available)

## Option 1: Deploy from GitHub (Recommended)

### Step 1: Push code to GitHub

```bash
git add .
git commit -m "Configure Supabase integration"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Search for your repository and click "Import"

### Step 3: Configure Environment Variables

In the "Environment Variables" section, add:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | From Supabase Settings > API |
| `VITE_SUPABASE_ANON_KEY` | From Supabase Settings > API |
| `VITE_LOGIN_USERNAME` | Your desired username |
| `VITE_LOGIN_PASSWORD` | Your desired password |

### Step 4: Deploy

Click "Deploy" and wait for completion (~2-3 minutes)

Once deployed, you'll get a URL like: `https://bms-frontend.vercel.app`

## Option 2: Deploy from CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Deploy

```bash
vercel
```

When prompted:
- "Which scope?": Select your account
- "Link to existing project?": No (first time)
- "Project name?": `bms-frontend`
- "Where is your code?": `.` (current directory)
- "Want to modify these settings?": Yes

### Step 4: Set Environment Variables

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_LOGIN_USERNAME
vercel env add VITE_LOGIN_PASSWORD
```

### Step 5: Redeploy

```bash
vercel --prod
```

## Update Supabase CORS

After getting your Vercel URL:

1. Go to Supabase > Settings > API
2. Scroll to "CORS Settings"
3. Add your Vercel URL:
   ```
   https://your-project.vercel.app
   ```

## Automatic Deployments

Once linked to GitHub:
- Every push to `main` branch → automatic deployment
- Pull requests get preview URLs
- Easy rollback to previous versions

## Using Custom Domain

1. In Vercel project settings > Domains
2. Add your custom domain
3. Update DNS records (follow Vercel's instructions)
4. Update Supabase CORS with new domain

## Monitoring & Logs

In Vercel dashboard:
- **Deployments**: View all deployment history
- **Logs**: Check runtime logs
- **Analytics**: Monitor performance
- **Settings**: Manage environment variables

## Troubleshooting

### Build fails
```bash
# Try building locally first
npm run build

# Check for errors in browser console
```

### CORS errors
- Verify Supabase URL and key are correct
- Check Supabase CORS settings include your Vercel domain
- Wait a few minutes for CORS changes to propagate

### Blank page
- Check browser console for errors
- Verify all environment variables are set
- Ensure `.env.local` is NOT in git (use `.gitignore`)

### Database not connecting
- Test locally with `npm run dev` first
- Verify Supabase project is active
- Check internet connection (not behind restrictive firewall)

## Performance Tips

1. Vercel automatically optimizes:
   - JavaScript bundling
   - Image optimization
   - CSS minification
   - Cache headers

2. Monitor build time:
   - Aim for < 1 minute
   - Use `npm run build` locally to test

3. Check performance:
   - Vercel Dashboard > Analytics
   - Google PageSpeed Insights
   - Lighthouse in Chrome DevTools

## Costs

Vercel Free Tier includes:
- Unlimited projects
- Unlimited static content
- 100 GB bandwidth/month
- Automatic SSL
- GitHub integration

Paid plans start at $20/month for additional features.

## Next Steps

1. Set up GitHub Actions for CI/CD
2. Add error tracking (Sentry, Rollbar)
3. Monitor database performance
4. Set up automated backups
5. Consider edge functions for complex logic

## Rolling Back

If something breaks:

1. Go to Vercel > Deployments
2. Find previous working deployment
3. Click the "..." menu > "Redeploy"
4. Or revert git commit and push to trigger new deploy

---

**That's it!** Your BMS is now live and accessible from anywhere. 🚀
