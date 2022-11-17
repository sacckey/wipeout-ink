import Head from 'next/head'
import { fetchTweets } from 'lib/fetchTweets'
import { db } from "../lib/firebase"
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore"
import Tweets from '../components/Tweets'

export default function Home({ tweets }: any) {
  return (
    <div>
      <Head>
        <title>wipeout.ink</title>
      </Head>

      <Tweets tweets={tweets} />
    </div>
  )
}

export async function getStaticProps() {
  const q = query(collection(db, "tweets"), orderBy('publishedAt', 'desc'), limit(30))
  const tweetSnapshots = await getDocs(q)
  const tweets = fetchTweets(tweetSnapshots)

  return {
    props: {
      tweets,
    },
    revalidate: 60 * 5
  }
}
