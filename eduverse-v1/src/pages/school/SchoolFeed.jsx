import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Heart, MessageSquare, Send, ThumbsUp, Users, Lock, MoreHorizontal, Image, Smile, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const avatarGradients = [
  'from-violet-500 to-cyan-500',
  'from-fuchsia-500 to-violet-500',
  'from-cyan-500 to-emerald-500',
  'from-rose-500 to-orange-500',
  'from-amber-400 to-yellow-300',
  'from-blue-500 to-violet-500',
];
function getGradient(name) {
  const i = (name?.charCodeAt(0) || 0) % avatarGradients.length;
  return avatarGradients[i];
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 'md' }) {
  const grad = getGradient(name);
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function CommentRow({ comment }) {
  return (
    <div className="flex gap-2 items-start">
      <Avatar name={comment.author_name} size="sm" />
      <div className="flex-1 bg-white/6 rounded-2xl px-3 py-2">
        <p className="text-xs font-semibold text-white/80">{comment.author_name}</p>
        <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{comment.content}</p>
      </div>
    </div>
  );
}

function PostCard({ post, onLike, currentUser }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);

  const toggleComments = async () => {
    if (!showComments) {
      const c = await base44.entities.Comment.filter({ post_id: post.id });
      setComments(c);
    }
    setShowComments(v => !v);
  };

  const handleLike = () => {
    setLiked(v => !v);
    onLike(post.id);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    const c = await base44.entities.Comment.create({
      post_id: post.id,
      content: commentText,
      author_name: currentUser?.full_name || 'User',
      author_id: currentUser?.id,
    });
    setComments(prev => [...prev, c]);
    setCommentText('');
    setSubmitting(false);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={post.author_name} size="lg" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">{post.author_name || 'Anonymous'}</span>
                {post.type === 'announcement' && (
                  <span className="text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full font-semibold">ANNOUNCEMENT</span>
                )}
              </div>
              <p className="text-[11px] text-white/35 mt-0.5">{timeAgo(post.created_date)} · 🌐</p>
            </div>
          </div>
          <button className="text-white/25 hover:text-white/60 transition-colors p-1 rounded-full hover:bg-white/8">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Images */}
      {post.image_urls?.length > 0 && (
        <div className={`${post.image_urls.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
          {post.image_urls.map((url, i) => (
            <img key={i} src={url} alt="" className="w-full object-cover max-h-80" />
          ))}
        </div>
      )}

      {/* Counts row */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-white/30 border-b border-white/6">
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px]">❤</span>
          <span>{post.like_count || 0}</span>
        </div>
        <button onClick={toggleComments} className="hover:underline hover:text-white/50 transition-colors">
          {post.comment_count || 0} comments
        </button>
      </div>

      {/* Action buttons */}
      <div className="px-2 py-1 flex items-center gap-1 border-b border-white/6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${liked ? 'text-rose-400 bg-rose-500/10' : 'text-white/40 hover:bg-white/5 hover:text-white/70'}`}>
          <ThumbsUp className="w-4 h-4" />
          Like
        </motion.button>
        <button
          onClick={toggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white/70 transition-all">
          <MessageSquare className="w-4 h-4" />
          Comment
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="px-4 py-3 space-y-3">
              {comments.map(c => <CommentRow key={c.id} comment={c} />)}
              {comments.length === 0 && <p className="text-xs text-white/25 text-center py-1">No comments yet — be the first!</p>}

              {/* Comment input */}
              <div className="flex gap-2 items-center">
                <Avatar name={currentUser?.full_name || 'You'} size="sm" />
                <div className="flex-1 flex items-center gap-2 bg-white/6 rounded-full px-4 py-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                    placeholder="Write a comment..."
                    className="flex-1 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                  <button onClick={handleComment} disabled={submitting || !commentText.trim()} className="text-emerald-400 disabled:opacity-30 hover:text-emerald-300 transition-colors">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupSidebar({ posts }) {
  return (
    <div className="space-y-4">
      {/* About */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-sm font-bold text-white">About</h3>
        <p className="text-xs text-white/50 leading-relaxed">
          The school feed showcases highlights and announcements shared by admins across all communities.
        </p>
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Lock className="w-3.5 h-3.5 text-white/30" />
            <span><span className="text-white/70 font-medium">Private</span> · Only members can see posts</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Users className="w-3.5 h-3.5 text-white/30" />
            <span className="text-white/70 font-medium">{posts.length} post{posts.length !== 1 ? 's' : ''} in feed</span>
          </div>
        </div>
      </div>

      {/* Pinned posts */}
      {posts.filter(p => p.is_pinned).length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-sm font-bold text-white mb-3">📌 Pinned</h3>
          <div className="space-y-3">
            {posts.filter(p => p.is_pinned).map(p => (
              <div key={p.id} className="flex gap-2">
                <Avatar name={p.author_name} size="sm" />
                <div>
                  <p className="text-xs font-semibold text-white/70">{p.author_name}</p>
                  <p className="text-xs text-white/40 line-clamp-2 mt-0.5">{p.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchoolFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Post.filter({ in_school_feed: true }),
      base44.auth.me(),
    ]).then(([p, user]) => {
      setPosts(p.sort((a, b) => {
        if (b.is_pinned !== a.is_pinned) return b.is_pinned ? 1 : -1;
        return new Date(b.created_date) - new Date(a.created_date);
      }));
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);

  const handleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    const newCount = (post?.like_count || 0) + 1;
    await base44.entities.Post.update(postId, { like_count: newCount });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: newCount } : p));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold font-heading text-white">School Feed</h1>
        <p className="text-xs text-white/35 mt-0.5">Highlights shared from communities</p>
      </div>

      <div className="flex gap-5 items-start">
        {/* Main feed */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Write bar (decorative, read-only for school) */}
          <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Avatar name={currentUser?.full_name || 'You'} />
            <div className="flex-1 bg-white/6 rounded-full px-4 py-2.5 text-sm text-white/30 cursor-default select-none">
              Posts shared by admins appear here...
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-white/4 animate-pulse" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No posts shared yet</p>
              <p className="text-white/20 text-xs mt-1">Admins can share posts from communities</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} currentUser={currentUser} />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <GroupSidebar posts={posts} />
        </div>
      </div>
    </div>
  );
}