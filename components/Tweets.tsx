import Tweet from "./Tweet"

const Tweets = ({ tweets } : any) => {
  return (
    <main className='container max-w-full py-8'>
      {
        tweets.map((tweet:any) =>
          <Tweet key={tweet.id} tweet={tweet} />
        )
      }
    </main>
  )
}

export default Tweets
