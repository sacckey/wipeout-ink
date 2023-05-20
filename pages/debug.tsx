import { httpsCallable } from 'firebase/functions'
import { useRouter } from 'next/router'
import { functions } from '@/lib/firebase'

export default function Debug() {
  const router = useRouter()

  const fetch = async () => {
    const saveTestTweets = httpsCallable(functions, 'saveTestTweets')
    await saveTestTweets()

    router.push('/')
  }

  return (
    <div>
      <button type="button" onClick={fetch}>fetch</button>
    </div>
  )
}

export async function getStaticProps() {
  return {
    notFound: process.env.NODE_ENV === 'production',
    props: {}
  }
}
