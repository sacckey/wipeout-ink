import Tweets from '@/components/Tweets'
import { admin } from '@/lib/firebaseAdmin'
import { TweetType, TweetWithMetaType } from '@/types/tweet'
import { tweetWithMeta2Tweet } from '@/lib/utils'

export default function Ranking({ tweets }: { tweets: TweetType[] }) {
  return (
    <Tweets tweets={tweets} />
  )
}

export async function getStaticProps() {
  const tweetSnapshots = await admin.firestore().collection('tweets').where('active', '==', true).orderBy('likeCount', 'desc').orderBy('publishedAt', 'desc').limit(30).get() as admin.firestore.QuerySnapshot<TweetWithMetaType>
  const tweets = tweetSnapshots.docs.map(doc => tweetWithMeta2Tweet(doc.data()))

  return {
    props: {
      tweets,
    },
    revalidate: 60 * 5
  }
}