import { fetchTweets } from 'lib/fetchTweets'
import { db } from "../lib/firebase"
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore"
import Tweets from '../components/Tweets'

export default function Ranking({ tweets }: any) {
  return (
    <Tweets tweets={tweets} />
  )
}

export async function getStaticProps() {
  const q = query(collection(db, "tweets"), where('active', '==', true), orderBy('likeCount', 'desc'), orderBy('publishedAt', 'desc'), limit(30))
  const tweetSnapshots = await getDocs(q)
  const tweets = fetchTweets(tweetSnapshots)

  return {
    props: {
      tweets,
    },
    revalidate: 60 * 5
  }
}
