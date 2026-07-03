import { create } from 'zustand'
import type { UserInfo } from '../types'

interface AuthState {
  token: string | null
  userInfo: UserInfo | null
  isLoggedIn: boolean
  setAuth: (token: string, userInfo: UserInfo) => void
  logout: () => void
  loadAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userInfo: null,
  isLoggedIn: false,

  setAuth: (token, userInfo) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
    set({ token, userInfo, isLoggedIn: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    set({ token: null, userInfo: null, isLoggedIn: false })
  },

  loadAuth: () => {
    const token = localStorage.getItem('token')
    const userInfoStr = localStorage.getItem('userInfo')
    if (token && userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr) as UserInfo
        set({ token, userInfo, isLoggedIn: true })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
      }
    }
  },
}))
