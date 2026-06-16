import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Heart, MessageSquare, Send, Pin, Flame, ArrowUp, MoreHorizontal, Paperclip, Link2, Youtube, Smile, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const avatarGradients = [
  'from-violet-500 to-cyan-500', 'from-fuchsia-500 to-violet-500',
  'from-cyan-500 to-emerald-500', 'from-rose-500 to-orange-500',
  'from-amber-400 to-yellow-300', 'from-blue-500 to-violet-500',
];
function getGradient(name) {
  return avatarGradients[(name?.charCodeAt(0) || 0) % avatarGradients.length];
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CommentItem({ comment, replies, isUpvote, currentUser, onUpvote, onReply, onCommentUpvote }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const replyRef = useRef(null);

  const handleSubmitReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    await onReply(comment.id, replyText);
    setReplyText('');
    setShowReplyInput(false);
    setSubmitting(false);
  };

  useEffect(() => {
    if (showReplyInput) setTimeout(() => replyRef.current?.focus(), 100);
  }, [showReplyInput]);

  return (
    <div>
      {/* Main comment */}
      <div className="flex gap-3 items-start">
        {isUpvote && (
          <div className="flex flex-col items-center gap-0.5 pt-2">
            <button
              onClick={() => onCommentUpvote(comment)}
              disabled={comment.upvoted_by?.includes(currentUser?.id)}
              className={`p-1 rounded transition-all ${comment.upvoted_by?.includes(currentUser?.id) ? 'text-orange-400 cursor-default' : 'text-white/25 hover:text-orange-400 hover:bg-orange-500/10'}`}>
              <ArrowUp className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-bold text-white/40">{comment.upvote_count || 0}</span>
          </div>
        )}
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGradient(comment.author_name)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5`}>
          {(comment.author_name || '?')[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs font-semibold text-white/80 mb-0.5">{comment.author_name}</p>
            <p className="text-xs text-white/60 leading-relaxed">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-1.5 ml-2">
            <span className="text-[10px] text-white/25">{timeAgo(comment.created_date)}</span>
            <button
              onClick={() => setShowReplyInput(v => !v)}
              className="text-[10px] font-semibold text-white/30 hover:text-violet-400 transition-colors flex items-center gap-1">
              <CornerDownRight className="w-2.5 h-2.5" /> Reply
            </button>
            {replies.length > 0 && (
              <span className="text-[10px] text-white/25">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
            )}
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 flex items-center gap-2 overflow-hidden"
              >
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getGradient(currentUser?.full_name || 'Y')} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                  {(currentUser?.full_name || 'Y')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-2 border border-white/10 focus-within:border-violet-500/40 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <input
                    ref={replyRef}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmitReply()}
                    placeholder={`Reply to ${comment.author_name}...`}
                    className="flex-1 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSubmitReply}
                  disabled={submitting || !replyText.trim()}
                  className="w-7 h-7 rounded-full bg-violet-500 hover:bg-violet-400 disabled:opacity-30 flex items-center justify-center transition-all flex-shrink-0">
                  <Send className="w-3 h-3 text-white" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Replies (sub-comments) */}
      {replies.length > 0 && (
        <div className="ml-11 mt-2 space-y-2 pl-3 border-l border-white/8">
          {replies.map(reply => (
            <div key={reply.id} className="flex gap-2 items-start">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getGradient(reply.author_name)} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5`}>
                {(reply.author_name || '?')[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[11px] font-semibold text-white/80 mb-0.5">{reply.author_name}</p>
                  <p className="text-[11px] text-white/55 leading-relaxed">{reply.content}</p>
                </div>
                <span className="text-[10px] text-white/20 ml-2 mt-0.5 block">{timeAgo(reply.created_date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostModal({ post, onClose, onLike, isAdmin, currentUser, isUpvote, onUpvote }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const grad = getGradient(post.author_name);

  const titleMatch = post.content?.match(/^\*\*(.+?)\*\*\n\n([\s\S]*)$/);
  const title = titleMatch ? titleMatch[1] : null;
  const body = titleMatch ? titleMatch[2] : post.content;

  useEffect(() => {
    base44.entities.Comment.filter({ post_id: post.id }).then(c => {
      setComments(isUpvote ? c.sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0)) : c);
      setLoading(false);
    });
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [post.id]);

  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const c = await base44.entities.Comment.create({
      post_id: post.id,
      content: commentText,
      author_name: currentUser?.full_name || 'You',
      author_id: currentUser?.id || 'me',
      upvote_count: 0,
      upvoted_by: [],
    });
    setComments(prev => [...prev, c]);
    setCommentText('');
    setSubmitting(false);
  };

  const handleReply = async (parentCommentId, text) => {
    const reply = await base44.entities.Comment.create({
      post_id: post.id,
      parent_comment_id: parentCommentId,
      content: text,
      author_name: currentUser?.full_name || 'You',
      author_id: currentUser?.id || 'me',
      upvote_count: 0,
      upvoted_by: [],
    });
    setComments(prev => [...prev, reply]);
  };

  const handleCommentUpvote = async (comment) => {
    if (comment.upvoted_by?.includes(currentUser?.id)) return;
    const newCount = (comment.upvote_count || 0) + 1;
    const newUpvotedBy = [...(comment.upvoted_by || []), currentUser?.id];
    await base44.entities.Comment.update(comment.id, { upvote_count: newCount, upvoted_by: newUpvotedBy });
    setComments(prev =>
      prev.map(c => c.id === comment.id ? { ...c, upvote_count: newCount, upvoted_by: newUpvotedBy } : c)
        .sort((a, b) => isUpvote ? (b.upvote_count || 0) - (a.upvote_count || 0) : 0)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden z-10 shadow-2xl"
        style={{ background: 'rgba(14,18,40,0.99)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 flex-shrink-0">
          <p className="text-sm font-semibold text-white/60">Post</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/8">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Post body */}
          <div className="px-5 py-4 border-b border-white/6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
                {(post.author_name || '?')[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{post.author_name || 'Anonymous'}</p>
                <p className="text-[11px] text-white/35">
                  {timeAgo(post.created_date)}
                  <span className="mx-1.5 text-white/20">·</span>
                  <span className="text-white/50">{post.topic_name || 'General discussion'}</span>
                </p>
              </div>
              <button className="text-white/20 hover:text-white/50 transition-colors p-1 rounded-lg hover:bg-white/5">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {(post.is_pinned || post.type === 'announcement' || post.is_hot_topic) && (
              <div className="flex gap-2 mb-3">
                {post.is_pinned && <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"><Pin className="w-2.5 h-2.5" /> PINNED</span>}
                {post.type === 'announcement' && <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 font-semibold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">📢 ANNOUNCEMENT</span>}
                {post.is_hot_topic && <span className="inline-flex items-center gap-1 text-[10px] text-orange-400 font-semibold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full"><Flame className="w-2.5 h-2.5" /> {post.hot_topic_name || 'HOT TOPIC'}</span>}
              </div>
            )}

            {title && <p className="text-base font-bold text-white mb-2 leading-snug">{title}</p>}
            <p className="text-sm text-white/70 leading-relaxed">{body}</p>

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/6 text-xs text-white/35">
              {isUpvote ? (
                <button onClick={() => onUpvote && onUpvote(post)}
                  className={`flex items-center gap-1.5 transition-colors ${post.upvoted_by?.includes(currentUser?.id) ? 'text-orange-400' : 'hover:text-orange-400'}`}>
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span className="font-semibold">{post.upvote_count || 0}</span>
                </button>
              ) : (
                <button onClick={() => onLike && onLike(post.id)}
                  className="flex items-center gap-1.5 hover:text-violet-400 transition-colors">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="font-semibold">{post.like_count || 0}</span>
                </button>
              )}
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="font-semibold">{topLevelComments.length}</span> comments
              </span>
            </div>
          </div>

          {/* Comments list */}
          <div className="px-5 py-4 space-y-4">
            {loading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />)}</div>
            ) : topLevelComments.length === 0 ? (
              <p className="text-xs text-white/25 text-center py-4">No comments yet — be the first!</p>
            ) : topLevelComments.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                replies={getReplies(c.id)}
                isUpvote={isUpvote}
                currentUser={currentUser}
                onCommentUpvote={handleCommentUpvote}
                onReply={handleReply}
              />
            ))}
          </div>
        </div>

        {/* Comment input — sticky footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-white/8" style={{ background: 'rgba(14,18,40,0.99)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getGradient(currentUser?.full_name || 'Y')} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
              {(currentUser?.full_name || 'Y')[0]?.toUpperCase()}
            </div>
            <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 border border-white/10 focus-within:border-violet-500/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <input
                ref={inputRef}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
              />
              <div className="flex items-center gap-1 text-white/20">
                <button className="p-1 hover:text-white/50 transition-colors"><Paperclip className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:text-white/50 transition-colors"><Link2 className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:text-white/50 transition-colors"><Youtube className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:text-white/50 transition-colors"><Smile className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:text-white/50 transition-colors text-[11px] font-bold">GIF</button>
              </div>
            </div>
            <button
              onClick={handleComment}
              disabled={submitting || !commentText.trim()}
              className="w-9 h-9 rounded-full bg-violet-500 hover:bg-violet-400 disabled:opacity-30 flex items-center justify-center transition-all flex-shrink-0">
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}