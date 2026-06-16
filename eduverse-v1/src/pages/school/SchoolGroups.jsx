import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ThumbsUp, MessageSquare, Send, MoreHorizontal, Users, Lock, Globe, Pin, Image, Smile, BarChart2, Plus, X } from 'lucide-react';
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
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d` : new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {(name || '?')[0].toUpperCase()}
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

  const handleLike = () => { setLiked(v => !v); onLike(post.id); };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const c = await base44.entities.Comment.create({
      post_id: post.id, content: commentText,
      author_name: currentUser?.full_name || 'User', author_id: currentUser?.id,
    });
    setComments(prev => [...prev, c]);
    setCommentText('');
    setSubmitting(false);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar name={post.author_name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{post.author_name || 'Anonymous'}</span>
                {post.type === 'announcement' && (
                  <span className="text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full font-semibold">ANNOUNCEMENT</span>
                )}
                {post.is_pinned && (
                  <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1"><Pin className="w-2.5 h-2.5" />PINNED</span>
                )}
              </div>
              <p className="text-[11px] text-white/35 mt-0.5">{timeAgo(post.created_date)} · 🌐</p>
            </div>
          </div>
          <button className="text-white/25 hover:text-white/60 p-1 rounded-full hover:bg-white/8 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

        {post.image_urls?.length > 0 && (
          <div className={`rounded-xl overflow-hidden mb-3 ${post.image_urls.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''}`}>
            {post.image_urls.map((url, i) => <img key={i} src={url} alt="" className="w-full object-cover max-h-72" />)}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-white/30 pb-2 border-b border-white/6">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px] text-white">❤</span>
            <span>{post.like_count || 0}</span>
          </div>
          <button onClick={toggleComments} className="hover:text-white/55 transition-colors">{post.comment_count || 0} comments</button>
        </div>
      </div>

      <div className="px-2 pb-1 flex gap-1 border-b border-white/6">
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${liked ? 'text-rose-400 bg-rose-500/10' : 'text-white/40 hover:bg-white/5 hover:text-white/70'}`}>
          <ThumbsUp className="w-3.5 h-3.5" /> Like
        </motion.button>
        <button onClick={toggleComments}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white/40 hover:bg-white/5 hover:text-white/70 transition-all">
          <MessageSquare className="w-3.5 h-3.5" /> Comment
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="px-4 py-3 space-y-3">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2 items-start">
                  <Avatar name={c.author_name} size="sm" />
                  <div className="flex-1 bg-white/6 rounded-2xl px-3 py-2">
                    <p className="text-xs font-semibold text-white/80">{c.author_name}</p>
                    <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-xs text-white/25 text-center py-1">No comments yet</p>}
              <div className="flex gap-2 items-center">
                <Avatar name={currentUser?.full_name || 'You'} size="sm" />
                <div className="flex-1 flex items-center gap-2 bg-white/6 rounded-full px-4 py-2">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                    placeholder="Write a comment..." className="flex-1 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none" />
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

function Composer({ group, currentUser, onPost, communities = [], isGlobalFeed = false, userRole = null }) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const canPost = !isGlobalFeed;

  const handlePost = async () => {
    if (!content.trim() || posting || !canPost) return;
    setPosting(true);
    const post = await base44.entities.Post.create({
      community_id: group.id,
      content,
      author_name: currentUser?.full_name || 'User',
      author_id: currentUser?.id,
      type: 'post',
      in_school_feed: false,
    });
    onPost(post);
    setContent('');
    setExpanded(false);
    setPosting(false);
  };

  if (!canPost) {
    return (
      <div className="rounded-xl overflow-hidden p-4 text-center text-white/40 text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        The School Feed is read-only
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {!expanded ? (
        <div className="flex items-center gap-3 px-4 py-3 cursor-text" onClick={() => setExpanded(true)}>
          <Avatar name={currentUser?.full_name || 'You'} />
          <div className="flex-1 bg-white/6 rounded-full px-4 py-2.5 text-sm text-white/30 select-none">
            Write something to the group...
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/8">
            <Avatar name={currentUser?.full_name || 'You'} />
            <div>
              <p className="text-sm font-semibold text-white">{currentUser?.full_name || 'You'}</p>
              <p className="text-xs text-white/35">Posting in <span className="text-emerald-400">{group.name}</span></p>
            </div>
          </div>
          
          <textarea value={content} onChange={e => setContent(e.target.value)} autoFocus
            className="w-full bg-transparent px-4 py-3 text-sm text-white/80 placeholder-white/25 focus:outline-none resize-none min-h-[100px] leading-relaxed"
            placeholder={`Write something to ${group.name}...`} />
          
          <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-1 text-white/25">
              <button className="p-2 rounded-lg hover:bg-white/6 hover:text-white/50 transition-all"><Image className="w-4 h-4" /></button>
              <button className="p-2 rounded-lg hover:bg-white/6 hover:text-white/50 transition-all"><Smile className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setExpanded(false); setContent(''); }} className="text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
              <button onClick={handlePost} disabled={posting || !content.trim()}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20">
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupSidebar({ group, memberCount, postCount }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Mini cover */}
        <div className="h-20 relative"
          style={{ background: group.cover_url ? `url(${group.cover_url}) center/cover` : 'linear-gradient(135deg, rgba(52,211,153,0.4), rgba(6,182,212,0.2))' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white">{group.name}</h3>
            <p className="text-xs text-white/40 leading-relaxed mt-1">{group.description || 'No description.'}</p>
          </div>
          <div className="space-y-1.5 pt-1 border-t border-white/6">
            <div className="flex items-center gap-2 text-xs text-white/45">
              {group.is_private ? <Lock className="w-3.5 h-3.5 text-white/30" /> : <Globe className="w-3.5 h-3.5 text-white/30" />}
              <span>{group.is_private ? 'Private group' : 'Public group'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/45">
              <Users className="w-3.5 h-3.5 text-white/30" />
              <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-white/6">
            <div>
              <p className="text-base font-bold text-white">{postCount}</p>
              <p className="text-[10px] text-white/30">Posts</p>
            </div>
            <div>
              <p className="text-base font-bold text-white">{memberCount}</p>
              <p className="text-[10px] text-white/30">Members</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateGroupModal({ onClose, onCreated, schoolMembers }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleMember = (id) => {
    setSelectedMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const group = await base44.entities.Community.create({
      name: name.trim(),
      description: description.trim(),
      is_private: isPrivate,
      is_paid: false,
      price: 0,
      billing_type: 'one_time',
      member_count: selectedMemberIds.length,
      status: 'active',
    });
    // Add selected members to the new group
    await Promise.all(selectedMemberIds.map(uid => {
      const m = schoolMembers.find(sm => sm.user_id === uid);
      return base44.entities.CommunityMember.create({
        community_id: group.id,
        user_id: uid,
        user_name: m?.user_name || '',
        user_email: m?.user_email || '',
        role: 'member',
        payment_status: 'free',
      });
    }));
    onCreated(group);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h3 className="text-base font-bold text-white font-heading">Create New Group</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Group Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
              placeholder="e.g. Study Circle" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 resize-none h-20"
              placeholder="What is this group about?" />
          </div>

          {/* Privacy toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/60">
              {isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              <span>{isPrivate ? 'Private group' : 'Public group'}</span>
            </div>
            <button onClick={() => setIsPrivate(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-all duration-200 ${isPrivate ? 'bg-emerald-500' : 'bg-white/10'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${isPrivate ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Member picker */}
          {schoolMembers.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Add Members ({selectedMemberIds.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto scrollbar-thin space-y-1 rounded-xl border border-white/8 p-2"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                {schoolMembers.map(m => (
                  <button key={m.user_id} onClick={() => toggleMember(m.user_id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${selectedMemberIds.includes(m.user_id) ? 'bg-emerald-500/12 text-emerald-300' : 'text-white/60 hover:bg-white/5'}`}>
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                      {(m.user_name || '?')[0].toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm truncate">{m.user_name || m.user_email}</span>
                    {selectedMemberIds.includes(m.user_id) && (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] text-black font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/8 flex items-center justify-end gap-3">
          <button onClick={onClose} className="text-xs text-white/40 hover:text-white/70 px-4 py-2 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !name.trim()}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20">
            {saving ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function GroupDropdown({ groups, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0">
          {selected?.name?.[0] || 'G'}
        </div>
        <span className="max-w-[160px] truncate">{selected?.name || 'Select group'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
            className="absolute top-full left-0 mt-2 w-64 rounded-xl overflow-hidden z-50 shadow-2xl"
            style={{ background: 'rgba(18,22,44,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="p-2">
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider px-2 py-1.5">Your Groups</p>
              {groups.map(g => (
                <button key={g.id} onClick={() => { onSelect(g); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${selected?.id === g.id ? 'bg-emerald-500/12 text-emerald-400' : 'text-white/65 hover:bg-white/6 hover:text-white'}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/40 to-cyan-500/30 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {g.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.name}</p>
                    <p className="text-[10px] text-white/30">{g.is_private ? '🔒 Private' : '🌐 Public'}</p>
                  </div>
                  {selected?.id === g.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                </button>
              ))}
              {groups.length === 0 && <p className="text-xs text-white/25 text-center py-3">No groups available</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function SchoolGroups() {
  const [communities, setCommunities] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [schoolMembers, setSchoolMembers] = useState([]);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    Promise.all([
      base44.entities.Community.list(),
      base44.auth.me(),
      base44.entities.CommunityMember.list(),
    ]).then(([comms, user, allMembers]) => {
      setCurrentUser(user);
      const schoolFeedComms = comms.filter(c => c.name.toLowerCase().includes('school feed'));
      setCommunities(schoolFeedComms);
      if (schoolFeedComms.length > 0) setSelectedGroup(schoolFeedComms[0]);
      // Deduplicate school members by user_id
      const seen = new Set();
      const unique = allMembers.filter(m => { if (seen.has(m.user_id)) return false; seen.add(m.user_id); return true; });
      setSchoolMembers(unique);
    });
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;
    setLoading(true);
    setPosts([]);
    Promise.all([
      base44.entities.Post.filter({ community_id: selectedGroup.id }),
      base44.entities.CommunityMember.filter({ community_id: selectedGroup.id }),
    ]).then(([p, m]) => {
      setPosts(p.sort((a, b) => {
        if (b.is_pinned !== a.is_pinned) return b.is_pinned ? 1 : -1;
        return new Date(b.created_date) - new Date(a.created_date);
      }));
      setMembers(m);
      setLoading(false);
    });
  }, [selectedGroup]);

  const handleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    const newCount = (post?.like_count || 0) + 1;
    await base44.entities.Post.update(postId, { like_count: newCount });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: newCount } : p));
  };

  const handleNewPost = (post) => {
    setPosts(prev => [post, ...prev]);
  };

  const handleGroupCreated = (group) => {
    setCommunities(prev => [...prev, group]);
    setSelectedGroup(group);
  };

  return (
    <div className="min-h-screen">
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleGroupCreated}
          schoolMembers={schoolMembers}
        />
      )}

      {/* Top bar with group switcher */}
      <div className="sticky top-0 z-30 px-6 py-3 flex items-center gap-4 border-b border-white/6"
        style={{ background: 'rgba(8,12,28,0.95)', backdropFilter: 'blur(12px)' }}>
        <GroupDropdown groups={communities} selected={selectedGroup} onSelect={setSelectedGroup} />
        {selectedGroup && (
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{members.length} members</span>
            <span className="flex items-center gap-1.5">📝 {posts.length} posts</span>
          </div>
        )}
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/20">
            <Plus className="w-3.5 h-3.5" /> Create Group
          </button>
        )}
      </div>

      {/* Group cover banner */}
      {selectedGroup && (
        <div className="relative h-36 overflow-hidden"
          style={{ background: selectedGroup.cover_url ? `url(${selectedGroup.cover_url}) center/cover` : 'linear-gradient(135deg, rgba(52,211,153,0.25) 0%, rgba(16,30,60,0.8) 50%, rgba(6,182,212,0.15) 100%)' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-4 flex items-end gap-4">
            <div className="w-14 h-14 rounded-2xl border-2 border-background flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.5), rgba(6,182,212,0.3))' }}>
              {selectedGroup.logo_url ? <img src={selectedGroup.logo_url} className="w-full h-full rounded-2xl object-cover" alt="" /> : selectedGroup.name[0]}
            </div>
            <div className="pb-1">
              <h2 className="text-lg font-bold font-heading text-white">{selectedGroup.name}</h2>
              <p className="text-xs text-white/40">{selectedGroup.is_private ? '🔒 Private group' : '🌐 Public group'} · {members.length} members</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-5 max-w-5xl mx-auto">
        {!selectedGroup ? (
          <div className="text-center py-20 text-white/30">Select a group to get started</div>
        ) : (
          <div className="flex gap-5 items-start">
            {/* Main feed */}
             <div className="flex-1 min-w-0 space-y-3">
               <Composer group={selectedGroup} currentUser={currentUser} onPost={handleNewPost} communities={communities} isGlobalFeed={selectedGroup?.name.toLowerCase().includes('school feed')} userRole={currentUser?.role} />

              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-white/4 animate-pulse" />)}</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">No posts yet</p>
                  <p className="text-white/20 text-xs mt-1">Be the first to post something!</p>
                </div>
              ) : (
                posts.map(post => <PostCard key={post.id} post={post} onLike={handleLike} currentUser={currentUser} />)
              )}
            </div>

            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 hidden lg:block">
              <GroupSidebar group={selectedGroup} memberCount={members.length} postCount={posts.length} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}