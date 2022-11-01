import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import { getAuth, signInWithPopup, TwitterAuthProvider, signOut } from "firebase/auth"
import { useAuthContext } from "../contexts/AuthContext"
import { app } from "../lib/firebase"

const Header = () => {
  const { user, signInChecking } = useAuthContext()
  const isLoggedIn = !!user
  const isLoading = !!signInChecking
  const router = useRouter()
  const auth = getAuth(app)
  const provider = new TwitterAuthProvider()
  const insideRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const login = async () => {
    await signInWithPopup(auth, provider)
    setOpen(false)
    router.push("/")
  }

  const logout = async () => {
    await signOut(auth)
  }

  const toggleMenu = () => {
    setOpen((pre) => !pre)
  }

  useEffect(() => {
    //対象の要素を取得
    const el = insideRef.current

    //対象の要素がなければ何もしない
    if (!el) return

    //クリックした時に実行する関数
    const hundleClickOutside = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) {
        setOpen(false)
      } else {
        toggleMenu()
      }
    }

    //クリックイベントを設定
    document.addEventListener("click", hundleClickOutside)

    //クリーンアップ関数
    return () => {
      //コンポーネントがアンマウント、再レンダリングされたときにクリックイベントを削除
      document.removeEventListener("click", hundleClickOutside)
    }
  }, [insideRef])

  const loginButton = () => {
    if (isLoading) {
      return <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    }
    else {
      if (isLoggedIn) {
        return (
          <div className="relative">
            <img className="w-10 h-10 rounded-full cursor-pointer" src={user.photoURL?.toString()}></img>
            {open &&
            <div className="absolute -right-5">
              <ul className="py-1 text-sm" aria-labelledby="avatarButton">
                <li>
                  <a href="#" onClick={logout} className="block py-2 px-4 hover:bg-gray-600 hover:text-white">Logout</a>
                </li>
              </ul>
            </div>
            }
          </div>
        )
      }
      else {
        return <button onClick={login} className="inline-flex items-center bg-gray-800 border-0 py-1 px-3 focus:outline-none hover:bg-gray-700 rounded text-base mt-4 md:mt-0">Login</button>
      }
    }
  }

  return (
    <header className="text-gray-400 bg-black body-font">
      <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
        <a className="flex title-font font-medium items-center text-white mb-4 md:mb-0">
          <h1 className='font-quicksand text-4xl text-center'>WIPEOUT!</h1>
        </a>
        <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center">
          <a className="mr-5 hover:text-white">First Link</a>
          <a className="mr-5 hover:text-white">Second Link</a>
        </nav>
        <div ref={insideRef}>
          {loginButton()}
        </div>
      </div>
    </header>
  )
}

export default Header
