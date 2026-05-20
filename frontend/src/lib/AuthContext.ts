import { createContext } from 'react'

interface AuthContextValue {
  token: string | null
  userId: string | null
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  userId: null,
  signOut: () => {},
})
