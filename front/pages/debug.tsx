import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useState } from 'react'
import Head from 'next/head'

export default function Debug() {
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)

    const saveSampleTweets = httpsCallable(functions, 'saveSampleTweets')
    await saveSampleTweets()

    setLoading(false)
  }

  return (
    <div>
      <Head>
        <title>Debug | wipeout.ink</title>
        <meta property="og:image" content="ogp.png" />
      </Head>

      <h1 className='font-quicksand text-3xl text-center'>Debug</h1>
      <main className='container max-w-full py-8'>
        <div className='border border-gray-600 rounded-2xl h-52 my-8 p-5 max-w-xl mx-auto'>
          <div className="px-6 py-4">
            <div className="font-bold text-xl mb-2">Save sample tweets</div>
            <p className="text-gray-200 text-base">
              Create dummy tweets.
            </p>
          </div>
          <div className="pr-6 py-4 text-right">
            {
              !loading &&
              <button onClick={save} disabled={loading} className="bg-white hover:bg-gray-300 text-black font-bold py-2 px-4 rounded">Save</button>
            }
            {
              loading &&
              <div className="inline-block mr-4 h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  )
}

export async function getStaticProps() {
  return {
    notFound: process.env.NODE_ENV === 'production',
    props: {}
  }
}
