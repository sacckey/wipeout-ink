import { ReactNode, createContext, useState, useContext, useEffect, Dispatch, SetStateAction } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import type { User } from "firebase/auth"
import { useRouter } from "next/router"
import { app, db } from "../lib/firebase"
import { query, collection, getDocs, orderBy } from "firebase/firestore"

export type UserType = User | null

export type AuthContextProps = {
  user: UserType
  signInChecking: boolean,
  likeTweetIds: string[],
  setLikeTweetIds: Dispatch<SetStateAction<string[]>>
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
  const [likeTweetIds, setLikeTweetIds] = useState<string[]>([])
  const isAvailableForViewing = router.pathname !== '/likes'
  const value = {
    user,
    signInChecking,
    likeTweetIds,
    setLikeTweetIds
  }

  useEffect(() => {
    const authStateChanged = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (!!user) {
        const q = query(collection(db, 'users', user.uid, 'likes'), orderBy('createdAt', 'desc'))
        const likeSnapshots = await getDocs(q)
        const ids = likeSnapshots.docs.map((doc) => doc.id)

        setLikeTweetIds(ids)
      }
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
