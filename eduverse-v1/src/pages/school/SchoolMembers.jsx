import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import GlassButton from '@/components/ui/GlassButton';
import { Search, Users, Plus, Star, Shield, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function AddMemberModal({ communities, onClose, onAdded }) {
  const [form, setForm] = useState({ user_name: '', user_email: '', community_id: '', role: 'member', payment_status: 'free' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const m = await base44.entities.CommunityMember.create({ ...form, user_id: form.user_email, joined_date: new Date().toISOString().split('T')[0] });
    setLoading(false);
    onAdded(m);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 p-6 z-10" style={{ background: 'rgba(12, 16, 36, 0.98)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white font-heading">Add Member</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name', key: 'user_name', placeholder: 'Jane Doe', type: 'text' },
            { label: 'Email', key: 'user_email', placeholder: 'jane@example.com', type: 'email' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-white/40 mb-1.5 block">{f.label}</label>
              <input required type={f.type} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
                placeholder={f.placeholder} />
            </div>
          ))}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Community</label>
            <select required value={form.community_id} onChange={e => setForm({...form, community_id: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
              <option value="">Select community...</option>
              {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Role</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Access</label>
              <select value={form.payment_status} onChange={e => setForm({...form, payment_status: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <GlassButton type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancel</GlassButton>
            <GlassButton type="submit" className="flex-1 justify-center" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </GlassButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function SchoolMembers() {
  const [members, setMembers] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterComm, setFilterComm] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    Promise.all([base44.entities.CommunityMember.list(), base44.entities.Community.list()]).then(([m, c]) => {
      setMembers(m);
      setCommunities(c);
      setLoading(false);
    });
  }, []);

  const filtered = members.filter(m => {
    const matchSearch = m.user_name?.toLowerCase().includes(search.toLowerCase()) || m.user_email?.toLowerCase().includes(search.toLowerCase());
    const matchComm = filterComm === 'all' || m.community_id === filterComm;
    return matchSearch && matchComm;
  });

  const roleColor = { admin: 'text-amber-400 bg-amber-500/10', moderator: 'text-cyan-400 bg-cyan-500/10', member: 'text-white/40 bg-white/5' };
  const paymentColor = { paid: 'text-emerald-400 bg-emerald-500/10', pending: 'text-amber-400 bg-amber-500/10', free: 'text-white/30 bg-white/5' };

  const getCommunityName = (id) => communities.find(c => c.id === id)?.name || '—';

  return (
    <div className="p-8">
      <PageHeader
        title="Members"
        subtitle="Manage community members and access"
        action={<GlassButton onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />Add Member</GlassButton>}
      />

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/4 border border-white/8 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/40"
            placeholder="Search members..." />
        </div>
        <select value={filterComm} onChange={e => setFilterComm(e.target.value)}
          className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/40">
          <option value="all">All Communities</option>
          {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-white/6 text-xs text-white/30 uppercase tracking-wider font-medium">
          <span>Member</span><span>Community</span><span>Role</span><span>Access</span><span>Points</span>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-xl bg-white/4 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No members found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {filtered.map((member, i) => (
              <motion.div key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center hover:bg-white/3 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-sm font-bold text-emerald-400 flex-shrink-0">
                    {(member.user_name || member.user_email || '?')[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{member.user_name || 'Unknown'}</p>
                    <p className="text-xs text-white/30 truncate">{member.user_email}</p>
                  </div>
                </div>
                <span className="text-xs text-white/50 truncate">{getCommunityName(member.community_id)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium w-fit capitalize ${roleColor[member.role] || roleColor.member}`}>{member.role}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium w-fit capitalize ${paymentColor[member.payment_status] || paymentColor.free}`}>{member.payment_status}</span>
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <Star className="w-3 h-3" />{member.points || 0}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && <AddMemberModal communities={communities} onClose={() => setShowAdd(false)} onAdded={m => setMembers(prev => [m, ...prev])} />}
      </AnimatePresence>
    </div>
  );
}