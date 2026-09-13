# Budget Management System - Frontend

A modern React-based frontend for the Budget Management System API.

## Features

- 📊 **Dashboard** - Overview of finances with charts and trends
- 💰 **Expense Tracking** - Add, edit, and filter expenses
- 💵 **Income Management** - Track income sources
- 🎯 **Budget Planning** - Set and monitor budgets by category
- 🏆 **Savings Goals** - Create and track savings progress

## Setup

### Prerequisites

- Node.js 18+ installed
- BMS API running on `http://localhost:5000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

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
