import { fetchTweets } from '@/lib/fetchTweets'
import Tweets from '@/components/Tweets'
import { admin } from '@/lib/firebaseAdmin'

export default function Ranking({ tweets }: any) {
  return (
    <Tweets tweets={tweets} />
  )
}

export async function getStaticProps() {
  const tweetSnapshots = await admin.firestore().collection('tweets').where('active', '==', true).orderBy('likeCount', 'desc').orderBy('publishedAt', 'desc').limit(30).get()
  const tweets = fetchTweets(tweetSnapshots)

  return {
    props: {
      tweets,
    },
    revalidate: 60 * 5
  }
}
