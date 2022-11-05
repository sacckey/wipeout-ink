import Head from 'next/head'
import Tweet from 'components/Tweet'
import { fetchTweets } from 'lib/fetchTweets'
import { db } from "../lib/firebase"
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore"

export default function Home({ tweets }: any) {
  return (
    <div>
      <Head>
        <title>wipeout.ink</title>
      </Head>

      <main className='container max-w-full py-8'>
        {
          tweets.map((tweet:any) =>
            tweet.source === 'Nintendo Switch Share' &&
            <Tweet key={tweet.id} tweet={tweet} />
          )
        }
      </main>
    </div>
  )
}

export async function getStaticProps() {
  const q = query(collection(db, "tweets"), orderBy('publishedAt', 'desc'), limit(30))
  const tweetSnapshots = await getDocs(q)
  const tweetIds = tweetSnapshots.docs.map((doc) => doc.id)

  const tweets = await fetchTweets(tweetIds)
  return {
    props: {
      tweets,
    },
    revalidate: 60 * 5
  }
}
