import { httpsCallable } from 'firebase/functions'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { functions } from '../lib/firebase'

export default function Debug() {
  const router = useRouter()

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') router.push("/")
  }, [])

  const fetch = async () => {
    const saveTestTweets = httpsCallable(functions, 'saveTestTweets')
    await saveTestTweets()

    router.push("/")
  }

  return (
    <div>
      <button type="button" onClick={fetch}>fetch</button>
    </div>
  )
}
