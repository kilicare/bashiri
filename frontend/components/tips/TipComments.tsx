'use client'

import { TipComment as TipCommentType, UserTip } from '@/lib/types/tips'
import { useAuthStore } from '@/stores/auth.store'
import { addTipComment, getTipComments } from '@/lib/api/tips'
import { formatDistanceToNow } from 'date-fns'
import { useState, useEffect } from 'react'
import { PremiumButton } from '@/components/ui/Button'
import { Send } from 'lucide-react'

interface TipCommentsProps {
  tip: UserTip
}

export function TipComments({ tip }: TipCommentsProps) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState<TipCommentType[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getTipComments(tip.id)
        setComments(data.results)
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      }
    }

    fetchComments()
  }, [tip.id])

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return

    try {
      setIsLoading(true)
      const comment = await addTipComment(tip.id, newComment.trim())
      setComments([comment, ...comments])
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Comments ({tip.comments_count})</h3>

      {/* Comment Form */}
      {user ? (
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{user.username?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none resize-none"
              rows={2}
            />
            <div className="flex justify-end mt-2">
              <PremiumButton
                onClick={handleSubmitComment}
                disabled={isLoading || !newComment.trim()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <Send size={14} />
                Post
              </PremiumButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-white/5 rounded-lg">
          <p className="text-sm text-white/50 mb-3">Tafadhali Jiunge Ndogo kuweka comment</p>
          <a
            href="/auth/login"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-sm"
          >
            Ingia / Jisajili
          </a>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              {comment.user.avatar_url ? (
                <img
                  src={comment.user.avatar_url}
                  alt={comment.user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-white">
                  {comment.user.username?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-white">@{comment.user.username}</p>
                <p className="text-xs text-white/50">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <p className="text-sm text-white/80">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
