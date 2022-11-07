import Tweet from "./Tweet"

const Tweets = ({ tweets } : any) => {
  return (
    <div>
      {
        tweets.map((tweet:any) =>
          <Tweet key={tweet.id} tweet={tweet} />
        )
      }
    </div>
  )
}

export default Tweets
