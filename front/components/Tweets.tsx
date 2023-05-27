import Tweet from './Tweet'
import { TweetType } from '@/types/tweet'

const Tweets = ({ tweets }: { tweets: TweetType[] }) => {
  return (
    <main className='container max-w-full py-8'>
      {
        tweets.map((tweet) =>
          <Tweet key={tweet.id} tweet={tweet} />
        )
      }
    </main>
  )
}

export default Tweets
