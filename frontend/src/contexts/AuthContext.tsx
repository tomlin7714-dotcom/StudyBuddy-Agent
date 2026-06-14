import React, { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/client'

interface AuthState {
  token: string
  userId: string
  username: string
}

interface AuthContextType {
  auth: AuthState | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'study_buddy_auth'

function loadAuth(): AuthState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Also store token for axios interceptor
      api.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`
      return parsed
    }
  } catch { /* ignore */ }
  return null
}

function saveAuth(auth: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  api.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY)
  delete api.defaults.headers.common['Authorization']
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth)

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password })
    const state: AuthState = {
      token: res.data.token,
      userId: res.data.user_id,
      username: res.data.username,
    }
    saveAuth(state)
    setAuth(state)
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const res = await api.post('/auth/register', { username, password })
    const state: AuthState = {
      token: res.data.token,
      userId: res.data.user_id,
      username: res.data.username,
    }
    saveAuth(state)
    setAuth(state)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setAuth(null)
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
