import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Expenses from './components/Expenses'
import ExpenseSheet from './components/ExpenseSheet'
import Incomes from './components/Incomes'
import Budgets from './components/Budgets'
import SavingsGoals from './components/SavingsGoals'
import RecurringExpenses from './components/RecurringExpenses'
import { DollarSign, TrendingUp, Wallet, Target, Receipt, Repeat, LogOut, Grid3x3 } from 'lucide-react'

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, logout, user } = useAuth()
  const isActive = (path) => location.pathname === path ? 'active' : ''
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Don't show navigation on login page
  if (location.pathname === '/login') {
    return null
  }
  
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <Wallet size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Budget Management System
        </div>
        <ul className="navbar-nav">
          <li><Link to="/" className={`nav-link ${isActive('/')}`}>
            <TrendingUp size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Dashboard
          </Link></li>
          <li><Link to="/expenses" className={`nav-link ${isActive('/expenses')}`}>
            <Receipt size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Expenses
          </Link></li>
          <li><Link to="/expense-sheet" className={`nav-link ${isActive('/expense-sheet')}`}>
            <Grid3x3 size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Sheet View
          </Link></li>
          <li><Link to="/incomes" className={`nav-link ${isActive('/incomes')}`}>
            <DollarSign size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Incomes
          </Link></li>
          <li><Link to="/budgets" className={`nav-link ${isActive('/budgets')}`}>
            <Wallet size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Budgets
          </Link></li>
          <li><Link to="/recurring" className={`nav-link ${isActive('/recurring')}`}>
            <Repeat size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Recurring
          </Link></li>
          <li><Link to="/savings" className={`nav-link ${isActive('/savings')}`}>
            <Target size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Savings Goals
          </Link></li>
        </ul>
        <div className="navbar-user">
          <span className="user-info">{user?.username}</span>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  )
}

function AppContent() {
  return (
    <>
      <Navigation />
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          } />
          <Route path="/expense-sheet" element={
            <ProtectedRoute>
              <ExpenseSheet />
            </ProtectedRoute>
          } />
          <Route path="/incomes" element={
            <ProtectedRoute>
              <Incomes />
            </ProtectedRoute>
          } />
          <Route path="/budgets" element={
            <ProtectedRoute>
              <Budgets />
            </ProtectedRoute>
          } />
          <Route path="/recurring" element={
            <ProtectedRoute>
              <RecurringExpenses />
            </ProtectedRoute>
          } />
          <Route path="/savings" element={
            <ProtectedRoute>
              <SavingsGoals />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App