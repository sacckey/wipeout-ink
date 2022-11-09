import Tweets from '../components/Tweets'
import { useEffect, useState } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import axios from 'axios'

export default function Likes() {
  const { user, signInChecking, likeTweetIds } = useAuthContext()
  const isLoggedIn = !!user
  const isLoading = !!signInChecking
  const [tweets, setTweets] = useState<any>([])

  useEffect(() => {
    const getTweets = async () => {
      if (!isLoading && user && likeTweetIds) {
        const token = await user.getIdToken()

        const res = await axios.get('/api/getTweets', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            tweetIds: likeTweetIds.slice(0,10)
          }
        })

        setTweets(res.data.tweets)
      }
    }
    getTweets()
  }, [isLoading])

  return (
    <Tweets tweets={tweets} />
  )
}
