import { useState, useEffect } from 'react'
import { authApi } from '@/lib/api'
import type { User, AuthResponse } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('bus_booking_auth_token')
    if (token) {
      try {
        const response = await authApi.getProfile()
        setUser(response.data)
      } catch {
        localStorage.removeItem('bus_booking_auth_token')
      }
    }
    setLoading(false)
  }

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await authApi.login({ email, password })
    localStorage.setItem('bus_booking_auth_token', response.data.token)
    setUser(response.data.user)
    return response.data
  }

  const register = async (data: {
    name: string
    email: string
    password: string
    phone: string
  }): Promise<AuthResponse> => {
    const response = await authApi.register(data)
    localStorage.setItem('bus_booking_auth_token', response.data.token)
    setUser(response.data.user)
    return response.data
  }

  const logout = async () => {
    await authApi.logout()
    localStorage.removeItem('bus_booking_auth_token')
    setUser(null)
  }

  return { user, loading, login, register, logout, checkAuth }
}
