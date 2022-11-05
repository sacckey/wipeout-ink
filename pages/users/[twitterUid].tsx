import Tweet from 'components/Tweet'
import { fetchTweets } from 'lib/fetchTweets'
import { db } from "../../lib/firebase"
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore"

// TODO: コンポーネントにする
export default function UserPage({ tweets }: any) {
  return (
    <div>
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
  const tweetIds = tweetSnapshots.docs.map((doc) => doc.id)

  const tweets = await fetchTweets(tweetIds)
  return {
    props: {
      tweets,
    },
    revalidate: 60 * 5
  }
}
