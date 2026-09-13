# Expense Sheet Feature Guide

## Overview

The **Expense Sheet** is an Excel-like spreadsheet interface for managing your monthly expenses. It provides a visual grid layout where you can quickly enter and track expenses across multiple budget categories.

---

## Features

### ✅ Excel-Like Interface
- Clean, grid-based layout similar to spreadsheets
- Click cells to enter amounts
- Press Enter or click outside to save automatically
- Date-based rows for organizing expenses chronologically

### ✅ Category Columns
- Each budget category has its own column
- Easily see how much you've spent in each category at a glance
- All categories from your budget configuration are displayed

### ✅ Budget Tracking
- **Budget Row** - Shows your allocated budget for each category
- **Total Row** - Displays total spending per category (highlighted in red if over budget)
- **Budget Status Row** - Shows remaining budget or overspend amount

### ✅ Automatic Calculations
- Real-time total calculations
- Overspent amounts clearly marked in red
- Visual indicators for under-budget and over-budget categories

### ✅ Color Coding
- 🔴 **Red** - Categories where you've exceeded the budget
- 🟢 **Green** - Categories within budget with remaining funds
- 🔵 **Blue** - Budget row and totals

---

## How to Use

### 1. **Navigate to Expense Sheet**
   - Click on **"Sheet View"** in the navigation menu
   - Or navigate to `/expense-sheet`

### 2. **View Your Budget**
   - The first row shows your budget allocation per category
   - Check the "Budget Status" row to see remaining budget or overspend

### 3. **Add an Expense**
   - Click on any empty cell in the data grid
   - Enter the amount (e.g., `50.99`)
   - Press **Enter** or click outside the cell
   - The expense is automatically saved

### 4. **View Totals**
   - The "Total" row shows cumulative spending per category
   - Red highlighting indicates overspending in that category
   - The footer shows overall expense totals and budgets

### 5. **Edit Existing Entries**
   - Click on an existing amount to edit it
   - Change the value and press Enter
   - Click the trash icon to delete an entire row's expenses

### 6. **Add New Row**
   - Click the **"Add Row"** button at the top
   - Or simply click an empty cell in the empty rows section
   - The app provides empty rows at the bottom for new entries

---

## Understanding the Layout

```
┌──────────┬──────────┬────────┬─────────┬────────────┐
│   Date   │ Expense  │  Food  │ Personal│ Healthcare │
├──────────┼──────────┼────────┼─────────┼────────────┤
│ Budget   │          │  $750  │  $100   │   $200     │
├──────────┼──────────┼────────┼─────────┼────────────┤
│ Aug 27   │ Groceries│$152.50 │         │            │
│ Aug 28   │ Gas      │        │         │ $45.00     │
├──────────┼──────────┼────────┼─────────┼────────────┤
│ Total    │          │$202.20 │  $23.83 │  $212.99   │
│ Budget   │          │  $750  │  $100   │   $200     │
│ Status   │          │$547.80 │ -$76.17 │  -$12.99   │
└──────────┴──────────┴────────┴─────────┴────────────┘
```

### Row Descriptions:
- **Budget Row** - Your allocated budget for each category
- **Data Rows** - Individual expenses organized by date
- **Total Row** - Sum of all expenses in each category (RED if over budget)
- **Budget Status Row** - Remaining budget (GREEN) or overspend amount (RED)

---

## Tips & Tricks

### 💡 Quick Data Entry
- Use **Tab** to move between cells (coming soon)
- Click cells in sequence to enter multiple expenses
- The app auto-focuses the next cell for faster entry

### 💡 Month Navigation
- The sheet displays the current month
- To view other months, use date filters (coming soon)

### 💡 Bulk Operations
- Delete entire rows using the trash icon
- All expenses for that date are removed at once

### 💡 Import from Previous Entry
- Use the main Expenses view to bulk import from CSV
- Then view in Sheet View for easy visualization

---

## Integration with Other Features

### Dashboard
- Expense totals from the sheet feed into your Dashboard
- Budget vs. Actual charts update automatically

### Budgets
- Budget amounts are pulled from your Budget configuration
- Changes to budgets are reflected immediately in the sheet

### Expenses List View
- Same data as the main Expenses view
- Use Sheet View for quick data entry
- Use Expenses view for detailed management

---

## Data Storage

- All expense data is stored in your backend database
- Changes are automatically saved when you press Enter or click outside a cell
- Session persists - no need to manually save
- Data is secure and tied to your login credentials

---

## Troubleshooting

### **No budgets showing?**
- Check that you've created budgets for the current month
- Navigate to the Budgets page to create them
- Refresh the page after creating budgets

### **Numbers not saving?**
- Ensure you press Enter or click outside the cell
- Check browser console for any API errors
- Verify your backend API is running

### **Red highlighting not updating?**
- Refresh the page to reload budget data
- Check that budget amounts are correctly set

### **Date showing incorrectly?**
- Expenses are grouped by their entry date
- Dates are in YYYY-MM-DD format
- Dates are based on your server timezone

---

## Keyboard Shortcuts (Planned)

| Shortcut | Action |
|----------|--------|
| Enter | Save current cell |
| Escape | Cancel editing |
| Tab | Move to next cell |
| Delete | Clear cell value |

---

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (optimized responsive layout)

---

## Performance

- Handles 100+ expense entries smoothly
- Real-time calculations with no lag
- Optimized for monthly data (typically 30-50 entries)
- For larger datasets, consider using date filters

---

## Security

- All data is encrypted in transit (HTTPS)
- Data is tied to your authenticated session
- No data is cached in browser beyond login session
- Clear browser cache to remove stored session data

---

## Next Steps

1. ✅ Enter your budget amounts in the Budgets section
2. ✅ Navigate to Sheet View
3. ✅ Start entering your daily expenses
4. ✅ Monitor your budget status in real-time
5. ✅ Check Dashboard for visual insights

---

For more help or feature requests, check the main documentation or contact support.
