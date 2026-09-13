import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('bms_auth')
    const storedUser = localStorage.getItem('bms_user')
    
    if (storedAuth === 'true' && storedUser) {
      setIsAuthenticated(true)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (username, password) => {
    // In production, this should call your backend API for authentication
    // For now, using environment variable or hardcoded credentials
    const validUsername = import.meta.env.VITE_LOGIN_USERNAME || 'admin'
    const validPassword = import.meta.env.VITE_LOGIN_PASSWORD || 'secure123'

    if (username === validUsername && password === validPassword) {
      const userData = {
        username: username,
        loginTime: new Date().toISOString()
      }
      
      localStorage.setItem('bms_auth', 'true')
      localStorage.setItem('bms_user', JSON.stringify(userData))
      localStorage.setItem('bms_session_start', new Date().getTime().toString())
      
      setIsAuthenticated(true)
      setUser(userData)
      return { success: true }
    }
    
    return { success: false, error: 'Invalid username or password' }
  }

  const logout = () => {
    localStorage.removeItem('bms_auth')
    localStorage.removeItem('bms_user')
    localStorage.removeItem('bms_session_start')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
