import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import GlassButton from '@/components/ui/GlassButton';
import { Plus, Search, Users, Lock, Globe, DollarSign, ArrowRight, X, Upload, ChevronDown, Settings, Trash2, Edit2, MessageSquare, Star, BookOpen, Trophy, Paperclip, Link2, Youtube, Smile, Mail, Flame, Tag, ArrowUp, Heart, Share2, MoreHorizontal, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

function CreateCommunityModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', is_private: true, is_paid: false, price: 0, billing_type: 'monthly' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const comm = await base44.entities.Community.create({ ...form, status: 'active', member_count: 0 });
    // Seed default "Contributions" upvote topic
    await base44.entities.CommunityTopic.create({
      community_id: comm.id,
      name: 'Contributions',
      type: 'general',
      style: 'upvote',
      order: 1,
    });
    setLoading(false);
    onCreated(comm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg rounded-2xl border border-white/10 p-6 z-10"
        style={{ background: 'rgba(12, 16, 36, 0.98)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white font-heading">Create Community</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Community Name</label>
            <input
              required
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
              placeholder="e.g. AI Developers Hub"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 resize-none h-20"
              placeholder="What's this community about?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setForm({...form, is_private: true})}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${form.is_private ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
              <Lock className="w-4 h-4" /> Private
            </button>
            <button type="button" onClick={() => setForm({...form, is_private: false})}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${!form.is_private ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
              <Globe className="w-4 h-4" /> Public
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/70">Paid Community</span>
            </div>
            <button type="button" onClick={() => setForm({...form, is_paid: !form.is_paid})}
              className={`w-10 h-5 rounded-full transition-all duration-200 relative ${form.is_paid ? 'bg-emerald-500' : 'bg-white/15'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${form.is_paid ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          {form.is_paid && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Price ($)</label>
                <input type="number" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Billing</label>
                <select value={form.billing_type} onChange={e => setForm({...form, billing_type: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                  <option value="one_time">One-time</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <GlassButton type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancel</GlassButton>
            <GlassButton type="submit" className="flex-1 justify-center" disabled={loading}>
              {loading ? 'Creating...' : 'Create Community'}
            </GlassButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const topicIcons = {
  general: <Tag className="w-3.5 h-3.5" />,
  upvote: <ArrowUp className="w-3.5 h-3.5 text-orange-400" />,
};

function CategoryDropdown({ topics, selectedTopic, onSelect }) {
  const [open, setOpen] = useState(false);
  const categoryTopics = [
    { id: null, name: 'General', type: 'general', style: 'regular' },
    ...topics.filter(t => t.type !== 'hot_topic'),
  ];
  const current = categoryTopics.find(t => t.id === selectedTopic) || categoryTopics[0];
  
  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/12 text-sm font-medium text-white/70 hover:border-emerald-500/40 transition-all"
        style={{ background: 'rgba(255,255,255,0.05)' }}>
        <span className="text-white/50">{topicIcons.general}</span>
        <span>{current.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="absolute top-full left-0 mt-2 min-w-[180px] rounded-xl overflow-hidden z-50 shadow-2xl"
              style={{ background: 'rgba(18,22,44,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="p-1.5">
                {categoryTopics.map(t => (
                  <button key={String(t.id)} type="button" onClick={() => { onSelect(t.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                      current.id === t.id ? 'bg-emerald-500/15 text-emerald-300' : 'text-white/60 hover:bg-white/6 hover:text-white'
                    }`}>
                    <span className="flex-shrink-0">{topicIcons.general}</span>
                    <span className="flex-1">{t.name}</span>
                    {t.style === 'upvote' && <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full font-semibold">Upvote</span>}
                    {current.id === t.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
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

function HotTopicDropdown({ topics, selectedHotTopic, onSelect }) {
  const [open, setOpen] = useState(false);
  const hotTopics = topics.filter(t => t.type === 'hot_topic');
  const current = hotTopics.find(t => t.id === selectedHotTopic);
  
  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
          current ? 'bg-orange-500/20 border-orange-500/40 text-orange-300' : 'border-white/12 text-white/50 hover:border-orange-500/30 hover:text-orange-300'
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
            <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="absolute top-full left-0 mt-2 min-w-[180px] rounded-xl overflow-hidden z-50 shadow-2xl"
              style={{ background: 'rgba(18,22,44,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="p-1.5">
                <button type="button" onClick={() => { onSelect(null); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                    !current ? 'bg-orange-500/10 text-orange-300' : 'text-white/50 hover:bg-white/6 hover:text-white'
                  }`}>
                  <span className="flex-1 text-white/40 italic">None</span>
                  {!current && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
                </button>
                {hotTopics.length === 0 && <p className="text-xs text-white/25 text-center py-3">No hot topics</p>}
                {hotTopics.map(t => (
                  <button key={t.id} type="button" onClick={() => { onSelect(t.id); setOpen(false); }}
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

function CommunityDropdown({ communities, selectedComm, onSelect, onSelectAll, viewMode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
          {viewMode === 'all' ? '◆' : selectedComm?.name?.[0] || 'C'}
        </div>
        <span className="max-w-[140px] truncate">{viewMode === 'all' ? 'All Communities' : (selectedComm?.name || 'Select community')}</span>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
            className="absolute top-full left-0 mt-2 w-64 rounded-xl overflow-hidden z-50 shadow-2xl"
            style={{ background: 'rgba(18,22,44,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="p-2">
              <button onClick={() => { onSelectAll(); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all mb-1 ${viewMode === 'all' ? 'bg-emerald-500/12 text-emerald-400' : 'text-white/65 hover:bg-white/6 hover:text-white'}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/40 to-cyan-500/30 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  ◆
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">All Communities</p>
                  <p className="text-[10px] text-white/30">Master feed</p>
                </div>
                {viewMode === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
              </button>
              <div className="border-t border-white/8 my-1" />
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider px-2 py-1.5">Communities</p>
              {communities.map(c => (
                <button key={c.id} onClick={() => { onSelect(c); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${selectedComm?.id === c.id ? 'bg-emerald-500/12 text-emerald-400' : 'text-white/65 hover:bg-white/6 hover:text-white'}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/40 to-cyan-500/30 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-white/30">{c.is_private ? '🔒 Private' : '🌐 Public'}</p>
                  </div>
                  {selectedComm?.id === c.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                </button>
              ))}
              {communities.length === 0 && <p className="text-xs text-white/25 text-center py-3">No communities</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function SchoolCommunities() {
  const [communities, setCommunities] = useState([]);
  const [selectedComm, setSelectedComm] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('Community');
  const [searchQuery, setSearchQuery] = useState('');
  const [writeExpanded, setWriteExpanded] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [posting, setPosting] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedHotTopic, setSelectedHotTopic] = useState(null);
  const [sendEmail, setSendEmail] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      Promise.all([
        base44.entities.Community.list(),
        base44.entities.CommunityMember.list(),
        base44.entities.CommunityTopic.list(),
        base44.entities.Post.list(),
      ]).then(([c, m, t, p]) => {
        setCommunities(c);
        setMembers(m);
        setTopics(t);
        setPosts(p);
        if (c.length > 0) {
          setSelectedComm(c[0]);
          setViewMode('single');
        }
        setLoading(false);
        c.forEach(comm => {
          const hasContributions = t.some(tt => tt.community_id === comm.id && tt.name === 'Contributions');
          if (!hasContributions) {
            base44.entities.CommunityTopic.create({
              community_id: comm.id,
              name: 'Contributions',
              type: 'general',
              style: 'upvote',
              order: 1,
            });
          }
        });
      });
    });
  }, []);

  useEffect(() => {
    if (!selectedComm) return;
    base44.entities.CommunityTopic.filter({ community_id: selectedComm.id }).then(fetchedTopics => {
      const hasContributions = fetchedTopics.some(t => t.name === 'Contributions');
      if (!hasContributions) {
        base44.entities.CommunityTopic.create({
          community_id: selectedComm.id,
          name: 'Contributions',
          type: 'general',
          style: 'upvote',
          order: 1,
        }).then(contributions => {
          setTopics(prev => [...prev.filter(t => t.community_id !== selectedComm.id), ...fetchedTopics, contributions]);
        });
      } else {
        setTopics(prev => [...prev.filter(t => t.community_id !== selectedComm.id), ...fetchedTopics]);
      }
    });
  }, [selectedComm]);

  const commMembers = viewMode === 'all' ? [] : (selectedComm ? members.filter(m => m.community_id === selectedComm.id) : []);
  const commTopics = viewMode === 'all' ? topics : (selectedComm ? topics.filter(t => t.community_id === selectedComm.id) : []);
  const commPosts = (viewMode === 'all' || selectedComm) ? posts
    .filter(p => viewMode === 'all' ? true : p.community_id === selectedComm.id)
    .filter(p => {
      if (selectedTopic === 'all' || !selectedTopic) return true;
      if (selectedTopic === null) return !p.topic_id;
      return p.topic_id === selectedTopic;
    })
    .filter(p => !searchQuery.trim() || p.content?.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  const handlePost = async () => {
    if (!postContent.trim() || !selectedComm) return;
    setPosting(true);
    const fullContent = postTitle.trim() ? `**${postTitle.trim()}**\n\n${postContent}` : postContent;
    const topic = selectedTopic ? commTopics.find(t => t.id === selectedTopic) : null;
    const post = await base44.entities.Post.create({
      community_id: selectedComm.id,
      content: fullContent,
      author_name: currentUser?.full_name || 'Admin',
      author_id: currentUser?.id || 'admin',
      like_count: 0,
      comment_count: 0,
      topic_id: topic?.id || null,
      topic_name: topic?.name || 'General discussion',
      is_hot_topic: !!selectedHotTopic,
      hot_topic_name: selectedHotTopic ? commTopics.find(t => t.id === selectedHotTopic)?.name || null : null,
    });
    setPosts(prev => [post, ...prev]);
    
    if (sendEmail) {
      const emailTargets = commMembers.filter(m => m.user_email);
      await Promise.allSettled(emailTargets.map(m =>
        base44.integrations.Core.SendEmail({
          to: m.user_email,
          subject: postTitle.trim() || `New post in ${selectedComm?.name}`,
          body: `<h2>${postTitle.trim() || 'New Post'}</h2><p>${postContent.replace(/\n/g, '<br/>')}</p><hr/><p style="color:#888;font-size:12px">Posted in <strong>${selectedComm?.name}</strong></p>`,
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-white/8" style={{ background: 'rgba(10,14,32,0.95)' }}>
        <div className="flex items-center gap-3 px-6 py-3 border-b border-white/6">
          <CommunityDropdown 
          communities={communities} 
          selectedComm={selectedComm} 
          onSelect={(comm) => { setSelectedComm(comm); setViewMode('single'); }} 
          onSelectAll={() => setViewMode('all')} 
          viewMode={viewMode} 
        />

          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm text-white placeholder-white/25 border border-white/8 focus:outline-none focus:border-emerald-500/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          </div>
          <button onClick={() => setShowCreate(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/20">
            <Plus className="w-3.5 h-3.5" /> New Community
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-0 px-6 border-b border-white/6">
          {['Community', 'Classroom', 'Leaderboards'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-white/40 hover:text-white/70'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main scrollable area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!selectedComm && viewMode === 'single' ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-12 h-12 text-emerald-500/20 mx-auto mb-3" />
              <p className="text-white/40">Select or create a community</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 p-6 max-w-5xl">
            {/* Main feed */}
            <div className="flex-1 min-w-0 space-y-3">
              {tab === 'Community' && (
                <>
                  {/* Composer — only show in single mode */}
                  {viewMode === 'single' && selectedComm && (
                  <div className="rounded-2xl border border-white/10 mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {!writeExpanded ? (
                      <div className="flex items-center gap-3 px-4 py-3 cursor-text" onClick={() => setWriteExpanded(true)}>
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-300 flex-shrink-0">
                          {(currentUser?.full_name || 'A')[0]}
                        </div>
                        <span className="flex-1 text-sm text-white/30 select-none">Write something...</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/8">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-300 flex-shrink-0">
                            {(currentUser?.full_name || 'A')[0]}
                          </div>
                          <p className="text-sm text-white/50">
                            <span className="font-semibold text-white">You</span>
                            <span className="mx-1">posting in</span>
                            <span className="font-bold text-emerald-300">{selectedComm?.name}</span>
                          </p>
                          <button onClick={() => { setWriteExpanded(false); setPostContent(''); setPostTitle(''); setSelectedHotTopic(null); setSelectedTopic(null); }} className="ml-auto text-white/30 hover:text-white/70">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="px-4 pt-4">
                          <input value={postTitle} onChange={e => setPostTitle(e.target.value)}
                            className="w-full bg-transparent text-lg font-semibold text-white placeholder-white/20 focus:outline-none mb-3"
                            placeholder="Title" />
                          <textarea value={postContent} onChange={e => setPostContent(e.target.value)}
                            className="w-full bg-transparent text-sm text-white/70 placeholder-white/25 focus:outline-none resize-none min-h-[100px]"
                            placeholder="Write something..." autoFocus />
                        </div>
                        <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap">
                          <CategoryDropdown topics={commTopics} selectedTopic={selectedTopic} onSelect={setSelectedTopic} />
                          <HotTopicDropdown topics={commTopics} selectedHotTopic={selectedHotTopic} onSelect={setSelectedHotTopic} />
                        </div>
                        <div className="px-4 py-2.5 border-t border-white/8 flex items-center gap-1">
                          {[Paperclip, Link2, Youtube, Smile].map((Icon, i) => (
                            <button key={i} className="p-2 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10">
                              <Icon className="w-4 h-4" />
                            </button>
                          ))}
                          <button className="px-2 py-1.5 rounded-lg text-white/30 hover:text-emerald-400 text-xs font-bold">GIF</button>
                          <div className="ml-auto flex items-center gap-2">
                            <button onClick={() => { setWriteExpanded(false); setPostContent(''); setPostTitle(''); setSelectedHotTopic(null); setSendEmail(false); }}
                              className="text-xs font-semibold text-white/40 hover:text-white/70 px-3 py-1.5">Cancel</button>
                            <button onClick={handlePost} disabled={posting || !postContent.trim()}
                              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold disabled:opacity-40">
                              {posting ? 'Posting...' : 'Post'}
                            </button>
                          </div>
                        </div>
                        <div className="px-4 py-2.5 border-t border-white/8 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-white/40">
                            <Mail className="w-3.5 h-3.5" />
                            <span>Send email to all members</span>
                          </div>
                          <button type="button" onClick={() => setSendEmail(v => !v)}
                            className={`relative w-10 h-5 rounded-full transition-all ${sendEmail ? 'bg-emerald-500' : 'bg-white/10'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${sendEmail ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Topic filter bar */}
                  <div className="flex items-center gap-2 mb-5 flex-wrap">
                    <button onClick={() => setSelectedTopic('all')}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${selectedTopic === 'all' || !selectedTopic ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                      All
                    </button>
                    <button onClick={() => setSelectedTopic(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${!selectedTopic || selectedTopic === null ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                      General
                    </button>
                    {commTopics.filter(t => t.type !== 'hot_topic').map(t => {
                      const topicComm = communities.find(c => c.id === t.community_id);
                      return (
                      <button key={t.id} onClick={() => setSelectedTopic(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${selectedTopic === t.id ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'border-white/10 text-white/40 hover:border-white/20'}`}
                        title={topicComm ? `${t.name} in ${topicComm.name}` : t.name}>
                        {t.style === 'upvote' && <ArrowUp className="w-3 h-3 text-orange-400" />}
                        {t.name}
                        {viewMode === 'all' && topicComm && <span className="text-[10px] text-white/40 ml-1">({topicComm.name})</span>}
                      </button>
                    );
                    })}
                  </div>

                  {loading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-white/4 animate-pulse" />)}</div>
                  ) : commPosts.length === 0 ? (
                    <div className="text-center py-16 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">No posts yet</p>
                    </div>
                  ) : (
                    commPosts.map((post, i) => {
                      const titleMatch = post.content?.match(/^\*\*(.+?)\*\*\n\n([\s\S]*)$/);
                      const title = titleMatch ? titleMatch[1] : null;
                      const body = titleMatch ? titleMatch[2] : post.content;
                      return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl p-5 border border-white/8 hover:border-emerald-500/20 transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            {(post.author_name || '?')[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{post.author_name}</p>
                            <p className="text-xs text-white/35 mt-0.5">
                              10h ago <span className="mx-1.5 text-white/20">·</span> 
                              {post.topic_name || 'General discussion'}
                              {viewMode === 'all' && communities.find(c => c.id === post.community_id) && <span className="mx-1.5 text-white/20">·</span>}
                              {viewMode === 'all' && communities.find(c => c.id === post.community_id) && <span className="text-emerald-400">{communities.find(c => c.id === post.community_id).name}</span>}
                              {post.is_hot_topic && <span className="mx-1.5 text-white/20">·</span>}
                              {post.is_hot_topic && <span className="text-orange-400">🔥 Hot Topic</span>}
                            </p>
                          </div>
                          <button className="text-white/20 hover:text-white/50 transition-colors p-1 rounded-lg hover:bg-white/5">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {(post.is_pinned || post.type === 'announcement') && (
                          <div className="flex gap-2 mb-3">
                            {post.is_pinned && <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"><Pin className="w-2.5 h-2.5" /> PINNED</span>}
                            {post.type === 'announcement' && <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 font-semibold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">📢 ANNOUNCEMENT</span>}
                          </div>
                        )}
                        
                        {title && <p className="text-sm font-bold text-white mb-1.5 leading-snug">{title}</p>}
                        <p className="text-sm text-white/65 leading-relaxed">{body}</p>
                        
                        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-white/6">
                          <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-emerald-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                            <Heart className="w-3.5 h-3.5" />
                            <span className="font-medium">{post.like_count || 0}</span>
                          </button>
                          <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-emerald-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="font-medium">{post.comment_count || 0}</span>
                          </button>
                          <button className="ml-auto flex items-center gap-1.5 text-xs text-white/40 hover:text-emerald-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                            <Share2 className="w-3.5 h-3.5" /> Share
                          </button>
                        </div>
                      </motion.div>
                    );
                    })
                  )}
                </>
              )}

              {tab === 'Classroom' && (
                <div className="text-center py-16">
                  <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-3" />
                  <p className="text-white/40">Courses coming soon</p>
                </div>
              )}

              {tab === 'Leaderboards' && (
                <div className="text-center py-16">
                  <Trophy className="w-12 h-12 text-white/10 mx-auto mb-3" />
                  <p className="text-white/40">Leaderboard coming soon</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            {tab === 'Community' && viewMode === 'single' && (
              <div className="w-64 flex-shrink-0 space-y-4">
                {/* Community card */}
                <div className="rounded-2xl overflow-hidden border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="h-20 relative overflow-hidden"
                    style={{ background: selectedComm.cover_url ? `url(${selectedComm.cover_url}) center/cover` : 'linear-gradient(135deg, rgba(52,211,153,0.3), rgba(6,182,212,0.15))' }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-white mb-1">{selectedComm.name}</h3>
                    <p className="text-xs text-white/40 mb-4">{selectedComm.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-center mb-4 py-2 border-y border-white/6">
                      <div>
                        <p className="text-sm font-bold text-white">{commMembers.length}</p>
                        <p className="text-[10px] text-white/30">Members</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">0</p>
                        <p className="text-[10px] text-white/30">Online</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">1</p>
                        <p className="text-[10px] text-white/30">Admins</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                      {selectedComm.is_private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      <span>{selectedComm.is_private ? 'Private' : 'Public'} community</span>
                    </div>
                    <Link to={`/admin/communities/${selectedComm.id}`}>
                      <button className="w-full px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold transition-all">
                        Full Settings
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Top members */}
                {commMembers.length > 0 && (
                  <div className="rounded-2xl border border-white/8 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Top Members</p>
                    <div className="space-y-2">
                      {commMembers.slice(0, 3).map((m, i) => (
                        <div key={m.id} className="flex items-center gap-2">
                          <span className="text-xs w-4 text-white/20">{i + 1}</span>
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                            {(m.user_name || '?')[0]}
                          </div>
                          <span className="flex-1 text-xs text-white/60 truncate">{m.user_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && <CreateCommunityModal onClose={() => setShowCreate(false)} onCreated={c => setCommunities(prev => [c, ...prev])} />}
      </AnimatePresence>
    </div>
  );
}