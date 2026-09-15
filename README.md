# Budget Management System - Frontend

A modern React-based frontend for the Budget Management System. Now using Supabase as the database backend and deployable on Vercel.

## Features

- 📊 **Dashboard** - Overview of finances with charts and trends
- 💰 **Expense Tracking** - Add, edit, and filter expenses with Excel-like sheet view
- 💵 **Income Management** - Track income sources
- 🎯 **Budget Planning** - Set and monitor budgets by category
- 🏆 **Savings Goals** - Create and track savings progress
- 🔐 **Secure Login** - Protected routes with authentication
- ☁️ **Cloud Database** - Supabase PostgreSQL integration
- 🚀 **Production Ready** - Deploy to Vercel with one click

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account (free at supabase.com)
- GitHub account (for Vercel deployment)

### 2. Local Development

```bash
# Clone or download the project
cd BMS-Frontend

# Install dependencies
npm install

# Create .env.local with Supabase credentials
# Copy from .env.example and add your Supabase URL and Anon Key

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Deploy to Vercel

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for step-by-step instructions.

## Setup Guides

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Complete guide to set up Supabase database
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Deploy to Vercel with one click
- **[SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md)** - What changed in the migration
- **[SECURITY_SETUP.md](./SECURITY_SETUP.md)** - Security and authentication setup

### Building for Production

```bash
npm run build
npm run preview
```

## Configuration

Update the API URL in `src/services/api.js` if your API runs on a different port:

```javascript
const API_BASE_URL = 'http://localhost:YOUR_PORT/api'
```

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool
- **Axios** - HTTP client
- **React Router** - Navigation
- **Recharts** - Charts and graphs
- **Lucide React** - Icons

## Project Structure

```
BMS-Frontend/
├── src/
│   ├── components/       # React components
│   │   ├── Dashboard.jsx
│   │   ├── Expenses.jsx
│   │   ├── Incomes.jsx
│   │   ├── Budgets.jsx
│   │   └── SavingsGoals.jsx
│   ├── services/         # API integration
│   │   └── api.js
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features Overview

### Dashboard
- Financial summary cards
- Monthly income/expense trends
- Category spending pie chart
- Recent transactions list
- Budget alerts
- Savings goals progress

### Expenses
- Add/edit/delete expenses
- Filter by date range and category
- Categorize expenses
- Add notes
- Track recurring expenses

### Incomes
- Record income sources
- Mark as recurring
- Date tracking
- Description fields

### Budgets
- Set budgets per category
- Weekly/Monthly/Yearly periods
- Real-time utilization tracking
- Alert thresholds
- Visual progress bars

### Savings Goals
- Create savings targets
- Track progress
- Add contributions
- Target dates
- Completion status
