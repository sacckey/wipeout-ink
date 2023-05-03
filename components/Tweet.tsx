import { useAuthContext } from "@/contexts/AuthContext"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore"
import { TweetType } from "@/types/tweet"

const Tweet = ({ tweet }: { tweet: TweetType}) => {
  const { user, signInChecking, likeTweetIds, setLikeTweetIds } = useAuthContext()
  const isLoggedIn = !!user
  const isLoading = !!signInChecking

  const like = async () => {
    if (!isLoggedIn) {
      // TODO: error message
      return
    }

    await setDoc(doc(db, "users", user.uid, 'likes', tweet.id), {
      user: {
        ref: doc(db, 'users', user.uid)
      },
      tweet: {
        ref: doc(db, 'tweets', tweet.id)
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    setLikeTweetIds && setLikeTweetIds((ids) => [tweet.id, ...ids])
    tweet.likeCount += 1
  }

  const disLike = async () => {
    if (!isLoggedIn) {
      // TODO: error message
      return
    }

    await deleteDoc(doc(db, "users", user.uid, 'likes', tweet.id))

    setLikeTweetIds && setLikeTweetIds((ids) => ids.filter((id) => id !== tweet.id))
    tweet.likeCount = Math.max(0, tweet.likeCount - 1)
  }

  const likeButton = () => {
    if (isLoading) {
      return (
        <div className="w-12 h-6 group flex">
          <svg className="w-6 h-6 stroke-gray-300" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
          <span className="text-gray-300 font-semibold">X</span>
        </div>
      )
    }
    else if (isLoggedIn && likeTweetIds?.includes(tweet.id)) {
      return (
        <button onClick={() => disLike()} className="w-12 h-6 group flex">
          <svg className="w-6 h-6 stroke-yellow-500 fill-yellow-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
          <span className="text-yellow-500 font-semibold">{tweet.likeCount}</span>
        </button>
      )
    }
    else {
      return (
        <button onClick={() => like()} className="w-12 h-6 group flex">
          <svg className="w-6 h-6 stroke-gray-500 group-hover:stroke-yellow-500" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
          <span className="text-gray-500 group-hover:text-yellow-500 font-semibold">{tweet.likeCount}</span>
        </button>
      )
    }
  }

  return (
    <div className='bg-slate-100 border border-slate-300 rounded-2xl duration-300 my-8 p-5 max-w-xl mx-auto text-black'>
      <div className='flex'>
        <div className='flex justify-between'>
          <Link className='flex items-center gap-3 group' href={tweet.url}>
            <img className='rounded-full h-12 w-12' src={tweet.profileImageUrl} />
            <div className='flex flex-col leading-snug'>
              <span className='text-sm font-semibold flex gap-2'>
                {tweet.name}
                <span className='text-sm font-normal opacity-70 group-hover:opacity-100 duration-300'>@{tweet.username}</span>
              </span>
              <span className='text-sm opacity-80 group-hover:opacity-100 duration-300'>{(new Date(tweet.publishedAt)).toUTCString()}</span>
            </div>
          </Link>
        </div>
        <div className="flex ml-auto">
          <Link href={`/users/${tweet.twitterUid}`} className="h-6 w-6 mr-6">
            <svg className="stroke-gray-500 hover:stroke-gray-700" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </Link>
          {likeButton()}
        </div>
      </div>

      <div className='text-lg my-3 leading-normal'>{tweet.text}</div>
      <video controls src={tweet.video}></video>
      {/* <div className='flex mt-2 gap-8 text-sm font-medium tracking-wider'>
        <span>{tweet.metrics.replies} Replies</span>
        <span>{tweet.metrics.retweets} Retweets</span>
        <span>{tweet.metrics.likes} Likes</span>
      </div> */}
    </div>
  )
}

export default Tweet
