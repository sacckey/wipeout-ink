import Head from 'next/head'
import Tweet from 'components/Tweet'
import { fetchTweets } from 'lib/fetchTweets'

export default function Home({ tweets }: any) {
  return (
    <div>
      <Head>
        <title>WIPEOUT!</title>
      </Head>

      <main className='container max-w-full py-8'>
        <h1 className='font-quicksand text-6xl text-center'>WIPEOUT!</h1>
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
  const tweets = await fetchTweets()
  return {
    props: {
      tweets,
    },
    revalidate: 60 * 5
  }
}
