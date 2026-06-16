import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, Users, Lock, Globe, MessageSquare, ArrowRight, Heart, Send, X, Trophy, Star, MoreHorizontal, Pin, Paperclip, Link2, Youtube, Smile, Mail, Settings, Trash2, Flame, ArrowUp, TrendingUp, Clock, ChevronDown, Tag, SlidersHorizontal, Check } from 'lucide-react';
import PostModal from '@/components/community/PostModal';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '@/components/ui/GlassButton';
import { Link } from 'react-router-dom';
import { filterEntitiesByUserAccess } from '@/lib/communityFilter';

// Unique gradient per author initial for avatar variety
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
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}


// Upvote-style post card (Reddit/PH style with expandable comments + comment upvotes)
function UpvotePostCard({ post, onUpvote, onShareToFeed, isAdmin, currentUserId, onCommentClick, showAllCommunities, communities }) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState([]);
  const grad = getGradient(post.author_name);
  const hasUpvoted = post.upvoted_by?.includes(currentUserId);
  const community = showAllCommunities ? communities?.find(c => c.id === post.community_id) : null;

  const titleMatch = post.content?.match(/^\*\*(.+?)\*\*\n\n([\s\S]*)$/);
  const title = titleMatch ? titleMatch[1] : null;
  const body = titleMatch ? titleMatch[2] : post.content;

  const toggleExpand = async () => {
    if (!expanded) {
      const c = await base44.entities.Comment.filter({ post_id: post.id });
      setLocalComments(c.sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0)));
    }
    setExpanded(v => !v);
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const c = await base44.entities.Comment.create({
      post_id: post.id,
      content: commentText,
      author_name: 'You',
      author_id: currentUserId || 'me',
      upvote_count: 0,
      upvoted_by: [],
    });
    setLocalComments(prev => [...prev, c]);
    setCommentText('');
    setSubmitting(false);
  };

  const handleCommentUpvote = async (comment) => {
    if (comment.upvoted_by?.includes(currentUserId)) return;
    const newCount = (comment.upvote_count || 0) + 1;
    const newUpvotedBy = [...(comment.upvoted_by || []), currentUserId];
    await base44.entities.Comment.update(comment.id, { upvote_count: newCount, upvoted_by: newUpvotedBy });
    setLocalComments(prev =>
      prev.map(c => c.id === comment.id ? { ...c, upvote_count: newCount, upvoted_by: newUpvotedBy } : c)
        .sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>

      <div className="flex gap-0">
        {/* Left upvote column */}
        <div className="flex flex-col items-center pt-4 pb-3 px-3 gap-1 border-r border-white/6"
          style={{ background: 'rgba(255,255,255,0.02)', minWidth: '52px' }}>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onUpvote(post)}
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all ${
              hasUpvoted
                ? 'text-orange-400 bg-orange-500/15'
                : 'text-white/30 hover:text-orange-400 hover:bg-orange-500/10'
            }`}>
            <ArrowUp className="w-4 h-4" strokeWidth={hasUpvoted ? 3 : 2} />
          </motion.button>
          <span className={`text-sm font-bold tabular-nums ${hasUpvoted ? 'text-orange-400' : 'text-white/60'}`}>
            {post.upvote_count || 0}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-4">
          {/* Author */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
              {(post.author_name || '?')[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-white/50 font-medium">{post.author_name || 'Anonymous'}</span>
            <span className="text-white/15">·</span>
            {community ? <span className="text-[11px] text-violet-400 font-medium">{community.name}</span> : <span className="text-[11px] text-white/30">{timeAgo(post.created_date)}</span>}
            <span className="text-white/15">·</span>
            <span className="text-[11px] text-white/30">{timeAgo(post.created_date)}</span>
            <button className="ml-auto text-white/20 hover:text-white/50 p-1 rounded-lg hover:bg-white/5 transition-colors">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Badges below author */}
          {(post.is_pinned || post.type === 'announcement' || post.is_hot_topic) && (
            <div className="flex gap-2 mb-2">
              {post.is_pinned && <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"><Pin className="w-2.5 h-2.5" /> PINNED</span>}
              {post.type === 'announcement' && <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 font-semibold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">📢 ANNOUNCEMENT</span>}
              {post.is_hot_topic && <span className="inline-flex items-center gap-1 text-[10px] text-orange-400 font-semibold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full"><Flame className="w-2.5 h-2.5" /> {post.hot_topic_name || 'HOT TOPIC'}</span>}
            </div>
          )}

          {/* Title + Body */}
          {title && <p className="text-sm font-bold text-white mb-1 leading-snug">{title}</p>}
          <p className="text-sm text-white/65 leading-relaxed">{body}</p>

          {/* Action row */}
          <div className="flex items-center gap-1 mt-3">
            <button onClick={() => onCommentClick(post)}
              className="flex items-center gap-1.5 text-xs text-white/35 hover:text-violet-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{post.comment_count || 0} comments</span>
            </button>
              </div>
        </div>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/6">
            <div className="p-4 space-y-3">
              {localComments.length === 0 && <p className="text-xs text-white/25 text-center py-2">No comments yet — be the first!</p>}
              {localComments.map(c => (
                <div key={c.id} className="flex gap-3 items-start">
                  {/* Comment upvote */}
                  <div className="flex flex-col items-center gap-0.5 pt-1">
                    <button
                      onClick={() => handleCommentUpvote(c)}
                      disabled={c.upvoted_by?.includes(currentUserId)}
                      className={`p-1 rounded transition-all ${
                        c.upvoted_by?.includes(currentUserId)
                          ? 'text-orange-400 cursor-default'
                          : 'text-white/25 hover:text-orange-400 hover:bg-orange-500/10'
                      }`}>
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-bold text-white/40 tabular-nums">{c.upvote_count || 0}</span>
                  </div>
                  {/* Comment bubble */}
                  <div className="flex-1 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-xs font-semibold text-white/70 mb-0.5">{c.author_name}</p>
                    <p className="text-xs text-white/55 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
              {/* Add comment */}
              <div className="flex gap-2 items-center pt-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">Y</div>
                <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <input value={commentText} onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                    placeholder="Add a comment..." className="flex-1 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none" />
                  <button onClick={handleComment} disabled={submitting || !commentText.trim()} className="text-violet-400 disabled:opacity-30 hover:text-violet-300 transition-colors">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Regular post card (original like/comment style)
function PostCard({ post, onLike, onShareToFeed, isAdmin, onCommentClick, showAllCommunities, communities }) {
  const grad = getGradient(post.author_name);
  const titleMatch = post.content?.match(/^\*\*(.+?)\*\*\n\n([\s\S]*)$/);
  const title = titleMatch ? titleMatch[1] : null;
  const body = titleMatch ? titleMatch[2] : post.content;
  const community = showAllCommunities ? communities?.find(c => c.id === post.community_id) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl p-5 transition-all hover:border-white/14"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>

      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
          {(post.author_name || '?')[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{post.author_name || 'Anonymous'}</p>
          <p className="text-[11px] text-white/35 mt-0.5">
            {timeAgo(post.created_date)}
            <span className="mx-1.5 text-white/20">·</span>
            {community ? <span className="text-violet-400 font-medium">{community.name}</span> : <span className="text-white/50">{post.topic_name || 'General discussion'}</span>}
          </p>
        </div>
        <button className="text-white/20 hover:text-white/50 transition-colors p-1 rounded-lg hover:bg-white/5">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Badges below author */}
      {(post.is_pinned || post.type === 'announcement' || post.is_hot_topic) && (
        <div className="flex gap-2 mb-3">
          {post.is_pinned && <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"><Pin className="w-2.5 h-2.5" /> PINNED</span>}
          {post.type === 'announcement' && <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 font-semibold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">📢 ANNOUNCEMENT</span>}
          {post.is_hot_topic && <span className="inline-flex items-center gap-1 text-[10px] text-orange-400 font-semibold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full"><Flame className="w-2.5 h-2.5" /> {post.hot_topic_name || 'HOT TOPIC'}</span>}
        </div>
      )}

      {title && <p className="text-sm font-bold text-white mb-1.5 leading-snug">{title}</p>}
      <p className="text-sm text-white/65 leading-relaxed">{body}</p>

      <div className="flex items-center gap-1 mt-4 pt-3 border-t border-white/6">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-violet-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5">
          <Heart className="w-3.5 h-3.5" />
          <span className="font-medium">{post.like_count || 0}</span>
        </motion.button>
        <button onClick={() => onCommentClick(post)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-violet-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="font-medium">{post.comment_count || 0}</span>
        </button>
      </div>
    </motion.div>
  );
}

const topicIcons = {
  general: <Tag className="w-3.5 h-3.5" />,
  hot_topic: <Flame className="w-3.5 h-3.5 text-orange-400" />,
  upvote: <ArrowUp className="w-3.5 h-3.5 text-orange-400" />,
};

// Category dropdown — only shows non-hot-topic categories
function CategoryDropdown({ topics, selectedTopic, onSelect }) {
  const [open, setOpen] = useState(false);

  const categoryTopics = [
    { id: null, name: 'General', type: 'general', style: 'regular' },
    ...topics.filter(t => t.type !== 'hot_topic'),
  ];
  const current = categoryTopics.find(t => t.id === selectedTopic) || categoryTopics[0];

  const getIcon = (t) => {
    if (t.style === 'upvote') return topicIcons.upvote;
    return topicIcons.general;
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/12 text-sm font-medium text-white/70 hover:border-violet-500/40 hover:text-white transition-all"
        style={{ background: 'rgba(255,255,255,0.05)' }}>
        <span className="text-white/50">{getIcon(current)}</span>
        <span>{current.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="absolute top-full left-0 mt-2 min-w-[180px] rounded-xl overflow-hidden z-50 shadow-2xl"
              style={{ background: 'rgba(18,22,44,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="p-1.5">
                {categoryTopics.map(t => (
                  <button
                    key={String(t.id)}
                    type="button"
                    onClick={() => { onSelect(t.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                      current.id === t.id ? 'bg-violet-500/15 text-violet-300' : 'text-white/60 hover:bg-white/6 hover:text-white'
                    }`}>
                    <span className="flex-shrink-0">{getIcon(t)}</span>
                    <span className="flex-1">{t.name}</span>
                    {t.style === 'upvote' && (
                      <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full font-semibold">Upvote</span>
                    )}
                    {current.id === t.id && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hot Topic dropdown — shows topics with type: hot_topic
function HotTopicDropdown({ topics, selectedHotTopic, onSelect }) {
  const [open, setOpen] = useState(false);
  const hotTopics = topics.filter(t => t.type === 'hot_topic');
  const current = hotTopics.find(t => t.id === selectedHotTopic);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
          current
            ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
            : 'border-white/12 text-white/50 hover:border-orange-500/30 hover:text-orange-300'
        }`}
        style={{ background: current ? undefined : 'rgba(255,255,255,0.05)' }}>
        <Flame className="w-3.5 h-3.5" />
        <span>{current ? current.name : 'Hot Topic'}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="absolute top-full left-0 mt-2 min-w-[180px] rounded-xl overflow-hidden z-50 shadow-2xl"
              style={{ background: 'rgba(18,22,44,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="p-1.5">
                {/* None option */}
                <button
                  type="button"
                  onClick={() => { onSelect(null); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                    !current ? 'bg-orange-500/10 text-orange-300' : 'text-white/50 hover:bg-white/6 hover:text-white'
                  }`}>
                  <span className="flex-1 text-white/40 italic">None</span>
                  {!current && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
                </button>
                {hotTopics.length === 0 && (
                  <p className="text-xs text-white/25 text-center py-3 px-3">No hot topics created yet</p>
                )}
                {hotTopics.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { onSelect(t.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                      current?.id === t.id ? 'bg-orange-500/15 text-orange-300' : 'text-white/60 hover:bg-white/6 hover:text-white'
                    }`}>
                  <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                    <span className="flex-1">{t.name}</span>
                    {current?.id === t.id && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StudentCommunities() {
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [tab, setTab] = useState('Feed');
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [posting, setPosting] = useState(false);
  const [writeExpanded, setWriteExpanded] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null); // for composer (category only)
  const [selectedHotTopic, setSelectedHotTopic] = useState(null); // selected hot topic id
  const [activeTopicFilter, setActiveTopicFilter] = useState('all'); // for feed filter
  const [sendEmail, setSendEmail] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [topics, setTopics] = useState([]); // CommunityTopic records for active community
  const [showTopicManager, setShowTopicManager] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicType, setNewTopicType] = useState('general');
  const [newTopicStyle, setNewTopicStyle] = useState('regular');
  const [upvoteSort, setUpvoteSort] = useState('top'); // 'top' | 'new'
  const [modalPost, setModalPost] = useState(null);
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
  const mainScrollRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'
  const [internships, setInternships] = useState([]);
  const [internshipFilter, setInternshipFilter] = useState('available');
  // Per-tab filter state
  const [postFilter, setPostFilter] = useState('all');
  const [classroomTagFilter, setClassroomTagFilter] = useState('all');
  const [leaderboardDateFilter, setLeaderboardDateFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (user) => {
      Promise.all([
        base44.entities.Community.list(),
        base44.entities.Post.list(),
        base44.entities.Course.list(),
        base44.entities.CommunityMember.list(),
        base44.entities.Internship.list(),
      ]).then(([c, p, co, m, interns]) => {
        // Filter by user's categories and country
        const filteredComms = filterEntitiesByUserAccess(c, user);
        const filteredCourses = filterEntitiesByUserAccess(co, user);
        const filteredInterns = interns.filter(i => {
          // Internships visible if community matches user access
          const comm = c.find(cc => cc.id === i.community_id);
          if (comm && !filterEntitiesByUserAccess([comm], user).length) return false;
          return i.is_active;
        });
        
        setCommunities(filteredComms);
        setPosts(p);
        setCourses(filteredCourses);
        setMembers(m);
        setInternships(filteredInterns);
        setCurrentUser(user);
        if (filteredComms.length > 0) {
          setActive(filteredComms[0].id);
          setViewMode('all');
        }
        setLoading(false);
      });
    });
  }, []);

  // Load topics when active community changes
  useEffect(() => {
    if (!active || communities.length === 0) return;
    
    if (viewMode === 'single') {
      base44.entities.CommunityTopic.filter({ community_id: active }).then(async (fetchedTopics) => {
        const hasContributions = fetchedTopics.some(t => t.name === 'Contributions');
        if (!hasContributions) {
          const contributions = await base44.entities.CommunityTopic.create({
            community_id: active,
            name: 'Contributions',
            type: 'general',
            style: 'upvote',
            order: 1,
          });
          fetchedTopics = [...fetchedTopics, contributions];
        }
        setTopics(fetchedTopics);
      });
      setActiveTopicFilter('all');
    }
  }, [active, communities]);

  const isAdmin = currentUser?.role === 'admin';

  const activeCommunity = communities.find(c => c.id === active);
  const activeTopic = activeTopicFilter !== 'all' && activeTopicFilter !== 'general'
    ? topics.find(t => t.id === activeTopicFilter)
    : null;
  const isUpvoteTopic = activeTopic?.style === 'upvote';

  const communityPosts = posts
    .filter(p => viewMode === 'all' ? true : p.community_id === active)
    .filter(p => {
      if (activeTopicFilter === 'all') return true;
      if (activeTopicFilter === 'general') return !p.topic_id;
      return p.topic_id === activeTopicFilter;
    })
    .filter(p => !searchQuery.trim() || p.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(p => {
      if (postFilter === 'all') return true;
      if (postFilter === 'announcement') return p.type === 'announcement';
      if (postFilter === 'regular') return p.type !== 'announcement' && !p.is_hot_topic && !p.upvote_count;
      if (postFilter === 'hot_topic') return p.is_hot_topic;
      if (postFilter === 'contribution') return p.upvote_count > 0 || topics.find(t => t.id === p.topic_id)?.style === 'upvote';
      if (postFilter === 'pinned') return p.is_pinned;
      if (postFilter.startsWith('topic_')) return p.topic_id === postFilter.replace('topic_', '');
      if (postFilter.startsWith('ht_')) return p.is_hot_topic && p.topic_id === postFilter.replace('ht_', '');
      return true;
    })
    .sort((a, b) => {
      // Pinned always first
      if (b.is_pinned !== a.is_pinned) return b.is_pinned ? 1 : -1;
      // Upvote topics: sort by votes unless "new" selected
      if (isUpvoteTopic && upvoteSort === 'top') return (b.upvote_count || 0) - (a.upvote_count || 0);
      return new Date(b.created_date) - new Date(a.created_date);
    });
  const rawCommunityCourses = viewMode === 'all' 
    ? courses
    : courses.filter(c => c.community_ids?.includes(active) || c.origin_community_id === active);
  const communityCourses = classroomTagFilter === 'all' ? rawCommunityCourses
    : rawCommunityCourses.filter(c => c.tags?.includes(classroomTagFilter.replace('tag_', '')));

  const filteredClassroomCommunities = classroomTagFilter === 'all' ? communities
    : communities.filter(c => c.tags?.includes(classroomTagFilter.replace('tag_', '')));
  const communityMembers = viewMode === 'all'
    ? members
    : members.filter(m => m.community_id === active);
  const communityInternships = viewMode === 'all'
    ? internships.filter(i => i.is_posted_to_all_schools || i.is_active)
    : internships.filter(i => (i.community_id === active || i.is_posted_to_all_schools) && i.is_active);

  const handleLike = async (postId) => {
    await base44.entities.Post.update(postId, { like_count: (posts.find(p => p.id === postId)?.like_count || 0) + 1 });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: (p.like_count || 0) + 1 } : p));
  };

  const handleShareToFeed = async (post) => {
    const newValue = !post.in_school_feed;
    await base44.entities.Post.update(post.id, { in_school_feed: newValue });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, in_school_feed: newValue } : p));
  };

  const handleUpvote = async (post) => {
    if (post.upvoted_by?.includes(currentUser?.id)) return;
    const newCount = (post.upvote_count || 0) + 1;
    const newUpvotedBy = [...(post.upvoted_by || []), currentUser?.id];
    await base44.entities.Post.update(post.id, { upvote_count: newCount, upvoted_by: newUpvotedBy });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, upvote_count: newCount, upvoted_by: newUpvotedBy } : p));
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    const topic = await base44.entities.CommunityTopic.create({
      community_id: active,
      name: newTopicName.trim(),
      type: newTopicType,
      style: newTopicStyle,
      order: topics.length,
    });
    setTopics(prev => [...prev, topic]);
    setNewTopicName('');
    setNewTopicType('general');
    setNewTopicStyle('regular');
  };

  const handleDeleteTopic = async (topicId) => {
    await base44.entities.CommunityTopic.delete(topicId);
    setTopics(prev => prev.filter(t => t.id !== topicId));
  };

  const handlePost = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    const fullContent = postTitle.trim() ? `**${postTitle.trim()}**\n\n${postContent}` : postContent;
    const topic = selectedTopic ? topics.find(t => t.id === selectedTopic) : null;
    const post = await base44.entities.Post.create({
      community_id: active,
      content: fullContent,
      author_name: 'You',
      author_id: 'me',
      like_count: 0,
      comment_count: 0,
      topic_id: topic?.id || null,
      topic_name: topic?.name || 'General discussion',
      is_hot_topic: !!selectedHotTopic,
      hot_topic_name: selectedHotTopic ? topics.find(t => t.id === selectedHotTopic)?.name || null : null,
    });
    setPosts(prev => [post, ...prev]);

    // Send email to all members if toggled
    if (sendEmail && isAdmin) {
      const emailTargets = communityMembers.filter(m => m.user_email);
      await Promise.allSettled(emailTargets.map(m =>
        base44.integrations.Core.SendEmail({
          to: m.user_email,
          subject: postTitle.trim() || `New post in ${activeCommunity?.name}`,
          body: `<h2>${postTitle.trim() || 'New Post'}</h2><p>${postContent.replace(/\n/g, '<br/>')}</p><hr/><p style="color:#888;font-size:12px">Posted in <strong>${activeCommunity?.name}</strong></p>`,
        })
      ));
    }

    setPostContent('');
    setPostTitle('');
    setSelectedTopic(null);
    setSelectedHotTopic(null);
    setSendEmail(false);
    setWriteExpanded(false);
    setPosting(false);
  };

  const tabs = viewMode === 'all' 
    ? ['Feed', 'Classroom', 'Leaderboards'] 
    : ['Feed', 'Classroom', 'Leaderboards', 'About'];

  const handleTabChange = (t) => {
    setTab(t);
    setFilterOpen(false);
    // Reset tab-specific filters on tab change
    setPostFilter('all');
    setClassroomTagFilter('all');
    setLeaderboardDateFilter('all');
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  };

  return (
    <>
    <div className="flex flex-col h-screen overflow-hidden bg-background">

      {/* Top bar — matches screenshot style */}
      <div className="flex-shrink-0 border-b border-white/8" style={{ background: 'rgba(10,14,32,0.95)' }}>

        {/* Row 1: Community dropdown + search */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/6">
          {/* Community switcher dropdown */}
          <div className="relative">
            <button
              onClick={() => setCommunityDropdownOpen(v => !v)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/10 hover:border-violet-500/40 transition-all text-sm font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(34,211,238,0.4))' }}>
                {viewMode === 'all' ? '◆' : (activeCommunity?.logo_url
                  ? <img src={activeCommunity.logo_url} className="w-full h-full rounded-lg object-cover" alt="" />
                  : (activeCommunity?.name?.[0] || 'C'))}
              </div>
              <span className="max-w-[160px] truncate">{viewMode === 'all' ? 'All Communities' : (activeCommunity?.name || 'Select community')}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform flex-shrink-0 ${communityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {communityDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCommunityDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    className="absolute top-full left-0 mt-2 min-w-[220px] rounded-xl overflow-hidden z-50 shadow-2xl"
                    style={{ background: 'rgba(14,18,42,0.99)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div className="p-1.5">
                      {loading ? (
                        <div className="p-3 space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 rounded-lg bg-white/4 animate-pulse" />)}</div>
                      ) : (
                        <>
                          <button onClick={() => { setViewMode('all'); setTab('Feed'); setCommunityDropdownOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all mb-1.5 ${viewMode === 'all' ? 'bg-violet-500/15 text-violet-300' : 'text-white/60 hover:bg-white/6 hover:text-white'}`}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.5), rgba(34,211,238,0.3))' }}>◆</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">All Communities</p>
                              <p className="text-[10px] text-white/30">Aggregated view</p>
                            </div>
                            {viewMode === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
                          </button>
                          <div className="border-t border-white/8 my-1" />
                          {communities.map(comm => (
                            <button key={comm.id}
                              onClick={() => { setActive(comm.id); setViewMode('single'); setTab('Feed'); setCommunityDropdownOpen(false); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${active === comm.id && viewMode === 'single' ? 'bg-violet-500/15 text-violet-300' : 'text-white/60 hover:bg-white/6 hover:text-white'}`}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.5), rgba(34,211,238,0.3))' }}>
                            {comm.logo_url ? <img src={comm.logo_url} className="w-full h-full rounded-lg object-cover" alt="" /> : comm.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{comm.name}</p>
                            <p className="text-[10px] text-white/30">{comm.member_count || 0} members</p>
                          </div>
                          {active === comm.id && viewMode === 'single' && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
                          </button>
                          ))}
                          </>
                          )}
                          </div>
                          </motion.div>
                          </>
                          )}
                          </AnimatePresence>
          </div>

          {/* Context-aware Filter button */}
          {(() => {
            // Build options based on current tab + viewMode
            let filterOptions = [];
            let currentFilter = 'all';
            let setCurrentFilter = () => {};
            let label = 'Filter';

            if (tab === 'Feed') {
              currentFilter = postFilter;
              setCurrentFilter = setPostFilter;
              if (viewMode === 'all') {
                filterOptions = [
                  { value: 'all', label: 'All Posts', icon: null },
                  { value: 'announcement', label: 'Announcements', icon: <span className="text-xs">📢</span> },
                  { value: 'regular', label: 'Regular Posts', icon: <MessageSquare className="w-3.5 h-3.5 text-violet-400" /> },
                  { value: 'hot_topic', label: 'Hot Topics', icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
                  { value: 'contribution', label: 'Contributions', icon: <ArrowUp className="w-3.5 h-3.5 text-orange-400" /> },
                ];
              } else {
                // Single community feed — categories + hot topics + contributions + post types
                const categoryOpts = topics.filter(t => t.type !== 'hot_topic').map(t => ({
                  value: `topic_${t.id}`,
                  label: t.name,
                  icon: t.style === 'upvote' ? <ArrowUp className="w-3.5 h-3.5 text-orange-400" /> : <Tag className="w-3.5 h-3.5 text-violet-400" />,
                }));
                const hotTopicOpts = topics.filter(t => t.type === 'hot_topic').map(t => ({
                  value: `ht_${t.id}`,
                  label: t.name,
                  icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
                }));
                filterOptions = [
                  { value: 'all', label: 'All Posts', icon: null },
                  ...categoryOpts,
                  ...(hotTopicOpts.length ? [{ value: '__divider_ht', label: '── Hot Topics', icon: null, divider: true }, ...hotTopicOpts] : []),
                  { value: '__divider_type', label: '── Post Type', icon: null, divider: true },
                  { value: 'announcement', label: 'Announcements', icon: <span className="text-xs">📢</span> },
                  { value: 'regular', label: 'Regular Posts', icon: <MessageSquare className="w-3.5 h-3.5 text-violet-400" /> },
                ];
              }
            } else if (tab === 'Classroom') {
              currentFilter = classroomTagFilter;
              setCurrentFilter = setClassroomTagFilter;
              label = 'Filter';
              if (viewMode === 'all') {
                // Filter by community tags
                const allTags = [...new Set(communities.flatMap(c => c.tags || []))];
                filterOptions = [
                  { value: 'all', label: 'All Communities', icon: null },
                  ...allTags.map(tag => ({ value: `tag_${tag}`, label: tag, icon: <Tag className="w-3.5 h-3.5 text-violet-400" /> })),
                ];
              } else {
                // Filter by course tags
                const allCourseTags = [...new Set(communityCourses.flatMap(c => c.tags || []))];
                filterOptions = [
                  { value: 'all', label: 'All Courses', icon: null },
                  ...allCourseTags.map(tag => ({ value: `tag_${tag}`, label: tag, icon: <Tag className="w-3.5 h-3.5 text-violet-400" /> })),
                ];
              }
            } else if (tab === 'Leaderboards') {
              currentFilter = leaderboardDateFilter;
              setCurrentFilter = setLeaderboardDateFilter;
              label = 'Period';
              filterOptions = [
                { value: 'all', label: 'All Time', icon: null },
                { value: 'this_week', label: 'This Week', icon: <Clock className="w-3.5 h-3.5 text-violet-400" /> },
                { value: 'this_month', label: 'This Month', icon: <Clock className="w-3.5 h-3.5 text-violet-400" /> },
                { value: 'this_year', label: 'This Year', icon: <Clock className="w-3.5 h-3.5 text-violet-400" /> },
              ];
            }

            const isActive = currentFilter !== 'all';

            return (
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(v => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${isActive ? 'border-violet-500/50 bg-violet-500/15 text-violet-300' : 'border-white/10 text-white/50 hover:border-violet-500/30 hover:text-white/70'}`}
                  style={!isActive ? { background: 'rgba(255,255,255,0.04)' } : {}}>
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
                </button>

                <AnimatePresence>
                  {filterOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        className="absolute top-full left-0 mt-2 min-w-[200px] rounded-xl overflow-hidden z-50 shadow-2xl"
                        style={{ background: 'rgba(14,18,42,0.99)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        <div className="p-1.5 max-h-80 overflow-y-auto scrollbar-thin">
                          {filterOptions.map(opt => opt.divider ? (
                            <div key={opt.value} className="px-3 py-1.5 text-[10px] text-white/25 font-semibold uppercase tracking-wider">{opt.label}</div>
                          ) : (
                            <button
                              key={opt.value}
                              onClick={() => { setCurrentFilter(opt.value); setFilterOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${currentFilter === opt.value ? 'bg-violet-500/15 text-violet-300' : 'text-white/60 hover:bg-white/6 hover:text-white'}`}>
                              {opt.icon ? <span className="flex-shrink-0">{opt.icon}</span> : <span className="w-3.5 h-3.5 flex-shrink-0" />}
                              <span className="flex-1">{opt.label}</span>
                              {currentFilter === opt.value && <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            );
          })()}

          {/* Search posts */}
          <div className="flex-1 relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder-white/25 border border-white/8 focus:outline-none focus:border-violet-500/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          </div>
        </div>

        {/* Row 2: Tab nav */}
        <div className="flex items-center gap-0 px-5">
          {tabs.map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t ? 'border-violet-400 text-violet-300' : 'border-transparent text-white/40 hover:text-white/70'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main scrollable area */}
      <div ref={mainScrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {!activeCommunity ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-12 h-12 text-violet-500/20 mx-auto mb-3" />
              <p className="text-white/40">Select a community</p>
            </div>
          </div>
        ) : (
          <>

            {/* Content + Right sidebar layout */}
            <div className="flex gap-6 p-6 max-w-5xl">

              {/* Main feed column */}
              <div className="flex-1 min-w-0">

                {tab === 'Feed' && (
                  <>
                    {/* Write post bar — Skool style — only show in single mode */}
                    {viewMode === 'single' && (
                    <div className="rounded-2xl border border-white/10 mb-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {/* Collapsed: clickable prompt row */}
                      {!writeExpanded ? (
                        <div className="flex items-center gap-3 px-4 py-3.5 cursor-text" onClick={() => setWriteExpanded(true)}>
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/50 to-cyan-500/30 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ring-2 ring-violet-500/20">Y</div>
                          <span className="flex-1 text-sm text-white/30 select-none">Write something...</span>
                          <div className="flex items-center gap-1.5 text-xs text-white/20 border border-white/8 rounded-lg px-2.5 py-1.5 hover:border-violet-500/30 hover:text-violet-400 transition-all">
                            <span className="w-2 h-2 rounded-full border-2 border-current inline-block" />
                            Go Live
                          </div>
                        </div>
                      ) : (
                        /* Expanded Skool-style composer */
                        <div>
                          {/* Header: posting in */}
                          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/8">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/50 to-cyan-500/30 flex items-center justify-center text-xs font-bold text-white ring-2 ring-violet-500/20 flex-shrink-0">Y</div>
                            <p className="text-sm text-white/50">
                              <span className="font-semibold text-white">You</span>
                              <span className="mx-1">posting in</span>
                              <span className="font-bold text-violet-300">{activeCommunity?.name}</span>
                            </p>
                            <button onClick={() => { setWriteExpanded(false); setPostContent(''); setPostTitle(''); setSelectedHotTopic(null); setSelectedTopic(null); }} className="ml-auto text-white/30 hover:text-white/70 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="px-4 pt-4">
                            <input
                              value={postTitle}
                              onChange={e => setPostTitle(e.target.value)}
                              className="w-full bg-transparent text-xl font-semibold text-white placeholder-white/20 focus:outline-none mb-3"
                              placeholder="Title"
                            />
                            {/* Body textarea */}
                            <textarea
                              autoFocus
                              value={postContent}
                              onChange={e => setPostContent(e.target.value)}
                              className="w-full bg-transparent text-sm text-white/70 placeholder-white/25 focus:outline-none resize-none min-h-[100px] leading-relaxed"
                              placeholder="Write something..."
                            />
                          </div>

                          <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap">
                            <CategoryDropdown
                              topics={topics}
                              selectedTopic={selectedTopic}
                              onSelect={setSelectedTopic}
                            />
                            <HotTopicDropdown
                              topics={topics}
                              selectedHotTopic={selectedHotTopic}
                              onSelect={setSelectedHotTopic}
                            />
                          </div>

                          {/* Toolbar row: icons + Cancel/Post */}
                          <div className="px-4 py-2.5 border-t border-white/8 flex items-center gap-1">
                            {[
                              { icon: Paperclip, label: 'Attach' },
                              { icon: Link2, label: 'Link' },
                              { icon: Youtube, label: 'Video' },
                              { icon: Smile, label: 'Emoji' },
                            ].map(({ icon: Icon, label }) => (
                              <button key={label} title={label}
                                className="p-2 rounded-lg text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                                <Icon className="w-4 h-4" />
                              </button>
                            ))}
                            <button className="px-2 py-1.5 rounded-lg text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-all text-xs font-bold tracking-wide">
                              GIF
                            </button>
                            <div className="ml-auto flex items-center gap-2">
                              <button onClick={() => { setWriteExpanded(false); setPostContent(''); setPostTitle(''); setSelectedHotTopic(null); setSendEmail(false); }}
                                className="text-xs font-semibold text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg transition-colors">
                                Cancel
                              </button>
                              <button onClick={handlePost} disabled={posting || !postContent.trim()}
                                className="px-5 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold disabled:opacity-40 transition-all shadow-lg shadow-violet-500/20">
                                {posting ? 'Posting...' : 'Post'}
                              </button>
                            </div>
                          </div>

                          {/* Email toggle row — admin only */}
                          {isAdmin && (
                            <div className="px-4 py-2.5 border-t border-white/8 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-white/40">
                                <Mail className="w-3.5 h-3.5" />
                                <span>Send email to all members</span>
                              </div>
                              {/* Toggle switch */}
                              <button
                                type="button"
                                onClick={() => setSendEmail(v => !v)}
                                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${sendEmail ? 'bg-violet-500' : 'bg-white/10'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${sendEmail ? 'left-5' : 'left-0.5'}`} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    )}

                    {/* Topic filter bar — single mode only */}
                    {viewMode === 'single' && (
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                      {/* All */}
                      <button onClick={() => setActiveTopicFilter('all')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${activeTopicFilter === 'all' ? 'bg-violet-500/25 border-violet-500/50 text-violet-300' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}>
                        All
                      </button>
                      {/* General discussion */}
                      <button onClick={() => setActiveTopicFilter('general')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${activeTopicFilter === 'general' ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}>
                        General
                      </button>
                      {/* Category topics (exclude hot_topic type) */}
                      {topics.filter(t => t.type !== 'hot_topic').map(t => (
                        <button key={t.id} onClick={() => { setActiveTopicFilter(t.id); setUpvoteSort('top'); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${activeTopicFilter === t.id ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}>
                          {t.style === 'upvote' && <ArrowUp className="w-3 h-3 text-orange-400" />}
                          {t.name}
                        </button>
                      ))}
                      {/* Admin: manage topics */}
                      {isAdmin && (
                        <button onClick={() => setShowTopicManager(v => !v)}
                          className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-white/30 hover:text-white/60 border border-white/8 hover:border-white/20 transition-all">
                          <Settings className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    )}

                    {/* Topic manager panel (admin only) */}
                    {viewMode === 'single' && (
                    <AnimatePresence>
                      {showTopicManager && isAdmin && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="rounded-xl border border-white/10 mb-5 overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Manage Topics</p>
                            <button onClick={() => setShowTopicManager(false)} className="text-white/30 hover:text-white/60"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="p-4 space-y-2">
                            {/* General — undeletable */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/4">
                              <span className="text-xs text-white/50 flex-1">🏷️ General discussion</span>
                              <span className="text-[10px] text-white/20 italic">default</span>
                            </div>
                            {topics.map(t => (
                              <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/4">
                                {t.type === 'hot_topic' ? <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" /> : <span className="text-xs">🏷️</span>}
                                <span className="text-xs text-white/70 flex-1">{t.type === 'hot_topic' ? `HOT TOPIC: ${t.name}` : t.name}</span>
                                {t.style === 'upvote' && (
                                  <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                    <ArrowUp className="w-2.5 h-2.5" /> Upvote
                                  </span>
                                )}
                                <button onClick={() => handleDeleteTopic(t.id)} className="text-white/20 hover:text-rose-400 transition-colors p-1">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {/* Add new topic */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              <input value={newTopicName} onChange={e => setNewTopicName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddTopic()}
                                placeholder="New topic name..."
                                className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50" />
                              <select value={newTopicType} onChange={e => setNewTopicType(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none">
                                <option value="general">General</option>
                                <option value="hot_topic">Hot Topic</option>
                              </select>
                              <select value={newTopicStyle} onChange={e => setNewTopicStyle(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none"
                                title="Topic style">
                                <option value="regular">💬 Regular</option>
                                <option value="upvote">⬆️ Upvote</option>
                              </select>
                              <button onClick={handleAddTopic} disabled={!newTopicName.trim()}
                                className="px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold disabled:opacity-40 transition-all">
                                Add
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    )}

                    {/* Upvote sort toggle — only shown when viewing an upvote-style topic */}
                    {isUpvoteTopic && (
                      <div className="flex items-center gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setUpvoteSort('top')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${upvoteSort === 'top' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'text-white/35 hover:text-white/60'}`}>
                          <TrendingUp className="w-3.5 h-3.5" /> Top
                        </button>
                        <button onClick={() => setUpvoteSort('new')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${upvoteSort === 'new' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-white/35 hover:text-white/60'}`}>
                          <Clock className="w-3.5 h-3.5" /> New
                        </button>
                      </div>
                    )}

                    {/* Posts */}
                    <div className="space-y-3">
                      {communityPosts.length === 0 ? (
                        <div className="text-center py-16">
                          <MessageSquare className="w-10 h-10 text-violet-500/15 mx-auto mb-3" />
                          <p className="text-white/30 text-sm">No posts yet — be the first!</p>
                        </div>
                      ) : communityPosts.map(post =>
                        isUpvoteTopic ? (
                          <UpvotePostCard key={post.id} post={post} onUpvote={handleUpvote} onShareToFeed={handleShareToFeed} isAdmin={isAdmin} currentUserId={currentUser?.id} onCommentClick={setModalPost} viewMode={viewMode} communities={communities} />
                        ) : (
                          <PostCard key={post.id} post={post} onLike={handleLike} onShareToFeed={handleShareToFeed} isAdmin={isAdmin} onCommentClick={setModalPost} viewMode={viewMode} communities={communities} />
                        )
                      )}
                    </div>
                  </>
                )}

                {tab === 'Classroom' && (
                  <div className="space-y-3">
                    {viewMode === 'all' ? (
                      <>
                        <p className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-4">Communities</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredClassroomCommunities.map(community => (
                            <button
                              key={community.id}
                              onClick={() => { setActive(community.id); setViewMode('single'); }}
                              className={`rounded-2xl border p-4 transition-all text-left ${
                                active === community.id && viewMode === 'single'
                                  ? 'border-violet-500/40 bg-violet-500/10'
                                  : 'border-white/8 hover:border-violet-500/25 bg-white/3'
                              }`}
                              style={active !== community.id || viewMode !== 'single' ? { background: 'rgba(255,255,255,0.03)' } : {}}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center text-sm font-bold text-violet-300 flex-shrink-0">
                                  {community.logo_url ? <img src={community.logo_url} className="w-full h-full rounded-lg object-cover" alt="" /> : community.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white">{community.name}</p>
                                  <p className="text-xs text-white/40 mt-1 line-clamp-1">{community.description || 'No description'}</p>
                                  <p className="text-xs text-white/25 mt-2 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {community.member_count || 0} members
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                       <>
                        <p className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-4">Courses in this community</p>
                        {communityCourses.length === 0 ? (
                          <div className="text-center py-16">
                            <BookOpen className="w-10 h-10 text-violet-500/15 mx-auto mb-3" />
                            <p className="text-white/30 text-sm">No courses added to this community yet</p>
                          </div>
                        ) : communityCourses.map(course => (
                          <div key={course.id} className="rounded-2xl border border-white/8 p-4 hover:border-violet-500/25 transition-all flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-5 h-5 text-violet-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white">{course.title}</p>
                              <p className="text-xs text-white/30 mt-0.5">{course.total_lessons || 0} lessons · {course.estimated_hours || 0}h</p>
                            </div>
                            <Link to={`/student/courses`}>
                              <GlassButton size="sm" variant="primary-violet">Start <ArrowRight className="w-3 h-3" /></GlassButton>
                            </Link>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}



                {tab === 'Leaderboards' && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-4">
                      {viewMode === 'all' ? 'Overall' : 'Community'} Top Members
                      {leaderboardDateFilter !== 'all' && ` · ${leaderboardDateFilter === 'this_week' ? 'This Week' : leaderboardDateFilter === 'this_month' ? 'This Month' : 'This Year'}`}
                    </p>
                    {[...communityMembers].filter(m => {
                      if (leaderboardDateFilter === 'all') return true;
                      const joined = new Date(m.joined_date || m.created_date);
                      const now = new Date();
                      if (leaderboardDateFilter === 'this_week') { const w = new Date(now); w.setDate(now.getDate() - 7); return joined >= w; }
                      if (leaderboardDateFilter === 'this_month') { const mo = new Date(now); mo.setMonth(now.getMonth() - 1); return joined >= mo; }
                      if (leaderboardDateFilter === 'this_year') { const yr = new Date(now); yr.setFullYear(now.getFullYear() - 1); return joined >= yr; }
                      return true;
                    }).sort((a, b) => (b.points || 0) - (a.points || 0)).map((m, i) => (
                      <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl border border-white/6 hover:border-violet-500/20 transition-all" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span className={`text-sm font-bold w-7 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-white/25'}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center text-xs font-bold text-violet-300">
                          {(m.user_name || '?')[0]}
                        </div>
                        <span className="flex-1 text-sm font-medium text-white">{m.user_name}</span>
                        <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {(m.points || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {communityMembers.length === 0 && (
                      <div className="text-center py-16">
                        <Trophy className="w-10 h-10 text-violet-500/15 mx-auto mb-3" />
                        <p className="text-white/30 text-sm">No members on the leaderboard yet</p>
                      </div>
                    )}
                  </div>
                )}


                {tab === 'About' && viewMode === 'single' && (
                  <div className="space-y-5">
                    {/* Intro video */}
                    {activeCommunity.intro_video_url && (
                      <div className="rounded-2xl overflow-hidden border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="aspect-video">
                          {activeCommunity.intro_video_url.includes('youtube') || activeCommunity.intro_video_url.includes('youtu.be') ? (
                            <iframe
                              src={activeCommunity.intro_video_url.replace('watch?v=', 'embed/')}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video src={activeCommunity.intro_video_url} controls className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: 'Members', value: activeCommunity.member_count || communityMembers.length },
                        { label: 'Courses', value: communityCourses.length },
                        { label: 'Posts', value: communityPosts.length },
                      ].map(s => (
                        <div key={s.label} className="rounded-2xl border border-white/8 py-4 px-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <p className="text-2xl font-bold text-white font-heading">{s.value}</p>
                          <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* About content */}
                    <div className="rounded-2xl border border-white/8 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <h3 className="text-base font-bold text-white font-heading mb-1">{activeCommunity.name}</h3>
                      {activeCommunity.about_tagline && (
                        <p className="text-sm text-violet-300 mb-4">{activeCommunity.about_tagline}</p>
                      )}
                      <div className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">
                        {activeCommunity.about_content || activeCommunity.description || 'No about page content yet.'}
                      </div>
                      {activeCommunity.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/8">
                          {activeCommunity.tags.map(tag => (
                            <span key={tag} className="text-xs px-3 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right sidebar — Skool style */}
              <div className="w-60 flex-shrink-0 space-y-4">

                {viewMode === 'all' ? (
                  <>
                    {/* Welcome card */}
                    {(() => {
                      const totalMembers = communities.reduce((sum, c) => sum + (c.member_count || 0), 0);
                      const totalAdmins = members.filter(m => m.role === 'admin' || m.role === 'moderator').length;
                      const userRankEntry = [...members]
                        .sort((a, b) => (b.points || 0) - (a.points || 0))
                        .findIndex(m => m.user_id === currentUser?.id);
                      const userRank = userRankEntry >= 0 ? userRankEntry + 1 : null;
                      return (
                        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div className="h-16 relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.5), rgba(6,182,212,0.25))' }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          </div>
                          <div className="p-4">
                            <h4 className="text-sm font-bold text-white font-heading mb-1">Welcome!</h4>
                            <p className="text-xs text-white/50 leading-relaxed mb-4">
                              {communities[0]?.description || 'Explore communities, internships, and connect with fellow members.'}
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-center py-3 border-t border-white/6">
                              <div>
                                <p className="text-base font-bold text-white">{totalMembers || members.length}</p>
                                <p className="text-[10px] text-white/30">Members</p>
                              </div>
                              <div>
                                <p className="text-base font-bold text-white">0</p>
                                <p className="text-[10px] text-white/30">Online</p>
                              </div>
                              <div>
                                <p className="text-base font-bold text-white">{userRank ? `#${userRank}` : '—'}</p>
                                <p className="text-[10px] text-white/30">Your Rank</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Internships section */}
                    <div className="rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Internships</p>
                      <div className="flex gap-1.5 mb-4 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setInternshipFilter('available')}
                          className={`flex-1 px-2 py-1.5 rounded text-[10px] font-semibold transition-all ${internshipFilter === 'available' ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white/60'}`}>
                          Available
                        </button>
                        <button onClick={() => setInternshipFilter('active')}
                          className={`flex-1 px-2 py-1.5 rounded text-[10px] font-semibold transition-all ${internshipFilter === 'active' ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white/60'}`}>
                          Active
                        </button>
                      </div>
                      <div className="space-y-2">
                        {internships
                          .filter(i => {
                            if (internshipFilter === 'available') return i.status === 'active' || i.is_active;
                            if (internshipFilter === 'active') return i.status === 'active' && i.enrolled_count > 0;
                            return true;
                          })
                          .slice(0, 3)
                          .map(i => (
                            <Link key={i.id} to={`/student/internships/${i.id}`} className="block p-2.5 rounded-lg border border-white/8 hover:border-violet-500/20 transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
                              <p className="text-xs font-semibold text-white/70 truncate">{i.title || i.company_name}</p>
                              <p className="text-[10px] text-white/40 truncate">{i.position_title}</p>
                            </Link>
                          ))}
                        {internships.filter(i => {
                          if (internshipFilter === 'available') return i.status === 'active' || i.is_active;
                          if (internshipFilter === 'active') return i.status === 'active' && i.enrolled_count > 0;
                          return true;
                        }).length === 0 && (
                          <p className="text-[10px] text-white/25 text-center py-3">No internships</p>
                        )}
                      </div>
                    </div>

                    {/* Top members mini */}
                    {communityMembers.length > 0 && (
                      <div className="rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Leaderboard</p>
                        <div className="space-y-2">
                          {[...communityMembers].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 3).map((m, i) => (
                            <div key={m.id} className="flex items-center gap-2">
                              <span className="text-xs w-4 text-white/20">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-300">
                                {(m.user_name || '?')[0]}
                              </div>
                              <span className="flex-1 text-xs text-white/70 truncate">{m.user_name}</span>
                              <span className="text-[10px] text-amber-400 font-semibold">{(m.points || 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Internships section — single community view */}
                    {tab === 'Feed' && (
                      <div className="rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Internships</p>
                        <div className="flex gap-1.5 mb-4 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <button onClick={() => setInternshipFilter('available')}
                            className={`flex-1 px-2 py-1.5 rounded text-[10px] font-semibold transition-all ${internshipFilter === 'available' ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white/60'}`}>
                            Available
                          </button>
                          <button onClick={() => setInternshipFilter('active')}
                            className={`flex-1 px-2 py-1.5 rounded text-[10px] font-semibold transition-all ${internshipFilter === 'active' ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white/60'}`}>
                            Active
                          </button>
                        </div>
                        <div className="space-y-2">
                          {communityInternships
                            .filter(i => {
                              if (internshipFilter === 'available') return i.status === 'active' || i.is_active;
                              if (internshipFilter === 'active') return i.status === 'active' && i.enrolled_count > 0;
                              return true;
                            })
                            .slice(0, 3)
                            .map(i => (
                              <Link key={i.id} to={`/student/internships/${i.id}`} className="block p-2.5 rounded-lg border border-white/8 hover:border-violet-500/20 transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <p className="text-xs font-semibold text-white/70 truncate">{i.title || i.company_name}</p>
                                <p className="text-[10px] text-white/40 truncate">{i.position_title}</p>
                              </Link>
                            ))}
                          {communityInternships.filter(i => {
                            if (internshipFilter === 'available') return i.status === 'active' || i.is_active;
                            if (internshipFilter === 'active') return i.status === 'active' && i.enrolled_count > 0;
                            return true;
                          }).length === 0 && (
                            <p className="text-[10px] text-white/25 text-center py-3">No internships</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Community card */}
                    <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="h-20 relative overflow-hidden"
                        style={{ background: activeCommunity.cover_url ? `url(${activeCommunity.cover_url}) center/cover` : 'linear-gradient(135deg, rgba(109,40,217,0.5), rgba(6,182,212,0.25))' }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                      <div className="p-4">
                        <h4 className="text-sm font-bold text-white font-heading mb-1">{activeCommunity.name}</h4>
                        <p className="text-xs text-white/40 leading-relaxed mb-4">{activeCommunity.description || 'No description.'}</p>
                        <div className="grid grid-cols-3 gap-2 text-center mb-4 py-3 border-y border-white/6">
                          <div>
                            <p className="text-base font-bold text-white">{activeCommunity.member_count || communityMembers.length}</p>
                            <p className="text-[10px] text-white/30">Members</p>
                          </div>
                          <div>
                            <p className="text-base font-bold text-white">0</p>
                            <p className="text-[10px] text-white/30">Online</p>
                          </div>
                          <div>
                            <p className="text-base font-bold text-white">{communityMembers.filter(m => m.role === 'admin' || m.role === 'moderator').length || 1}</p>
                            <p className="text-[10px] text-white/30">Admins</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          {activeCommunity.is_private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          <span>{activeCommunity.is_private ? 'Private community' : 'Public community'}</span>
                        </div>
                        {activeCommunity.is_paid && (
                          <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <span className="text-xs text-amber-400">Subscription</span>
                            <span className="text-xs font-bold text-amber-400">${activeCommunity.price}/{activeCommunity.billing_type === 'monthly' ? 'mo' : activeCommunity.billing_type === 'yearly' ? 'yr' : 'once'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top members mini */}
                    {communityMembers.length > 0 && (
                      <div className="rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Top Members</p>
                        <div className="space-y-2">
                          {[...communityMembers].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 3).map((m, i) => (
                            <div key={m.id} className="flex items-center gap-2">
                              <span className="text-xs w-4 text-white/20">{i + 1}</span>
                              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-300">
                                {(m.user_name || '?')[0]}
                              </div>
                              <span className="flex-1 text-xs text-white/70 truncate">{m.user_name}</span>
                              <span className="text-[10px] text-amber-400 font-semibold">{(m.points || 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>

    {/* Post detail modal */}
    <AnimatePresence>
      {modalPost && (
        <PostModal
          post={modalPost}
          onClose={() => setModalPost(null)}
          onLike={handleLike}
          onUpvote={handleUpvote}
          isAdmin={isAdmin}
          currentUser={currentUser}
          isUpvote={isUpvoteTopic}
        />
      )}
    </AnimatePresence>
    </>
  );
}