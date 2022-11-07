import { fetchTweets } from 'lib/fetchTweets'
import { db } from "../../lib/firebase"
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore"
import Tweets from '../../components/Tweets'

export default function UserPage({ tweets }: any) {
  return (
    <main className='container max-w-full py-8'>
      <Tweets tweets={tweets} />
    </main>
  )
}

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps = async (context: { params: { twitterUid: string } }) => {
  const { twitterUid } = context.params
  const q = query(collection(db, "tweets"), where('twitterUid', '==', twitterUid), orderBy('publishedAt', 'desc'), limit(30))
  const tweetSnapshots = await getDocs(q)
  const tweets = await fetchTweets(tweetSnapshots)

  return {
    props: {
      tweets,
    },
    revalidate: 60 * 5
  }
}
