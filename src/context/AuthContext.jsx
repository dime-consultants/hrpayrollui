import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { endpoints, tokenStore } from "../lib/api.js"

const AuthContext = createContext(null)
const USER_KEY = "hrp_user"

// Decode JWT payload to extract user identity (email, user_id, role)
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1]
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(loadStoredUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // On cold load: rehydrate user from token if localStorage is empty
    if (tokenStore.access && !user) {
      const claims = decodeJwt(tokenStore.access)
      if (claims) {
        const u = {
          id: claims.user_id,
          email: claims.email || claims.sub || "",
          role: claims.role || "officer",
        }
        setUserState(u)
        localStorage.setItem(USER_KEY, JSON.stringify(u))
      } else {
        // Token unparseable → clear session
        tokenStore.clear()
      }
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persistUser = useCallback((u) => {
    setUserState(u)
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
    else localStorage.removeItem(USER_KEY)
  }, [])

  // Login expects email + password (custom User model uses email as USERNAME_FIELD)
  const login = useCallback(
    async (email, password) => {
      const data = await endpoints.login({ email, password })
      tokenStore.set({ access: data.access, refresh: data.refresh })
      const claims = decodeJwt(data.access) || {}
      const u = {
        id: data.user?.id || claims.user_id,
        email: data.user?.email || email,
        full_name: data.user?.full_name || "",
        role: data.profile?.role || claims.role || "officer",
        organization: data.profile?.organization || null,
      }
      persistUser(u)
      return data
    },
    [persistUser],
  )

  const logout = useCallback(() => {
    tokenStore.clear()
    persistUser(null)
    window.location.href = "/login"
  }, [persistUser])

  const value = {
    user,
    loading,
    isAuthenticated: !!(user && tokenStore.access),
    login,
    logout,
    setUser: persistUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
