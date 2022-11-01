import { ReactNode, createContext, useState, useContext, useEffect } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import type { User } from "firebase/auth"
import { useRouter } from "next/router"
import { app } from "../lib/firebase"

export type UserType = User | null

export type AuthContextProps = {
  user: UserType
  signInChecking: boolean
}

export type AuthProps = {
  children: ReactNode
}

const AuthContext = createContext<Partial<AuthContextProps>>({})

export const useAuthContext = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }: AuthProps) => {
  const router = useRouter()
  const auth = getAuth(app)
  const [user, setUser] = useState<UserType>(null)
  const [signInChecking, setSignInChecking] = useState(true)
  const isAvailableForViewing = router.pathname !== "/fav"
  const value = {
    user,
    signInChecking
  }

  useEffect(() => {
    const authStateChanged = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setSignInChecking(false)
      !user && !isAvailableForViewing && (await router.push("/"))
    })
    return () => {
      authStateChanged()
    }
  }, [])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
