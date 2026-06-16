import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Trophy, Plus, X, Calendar, Target, Gift, CheckCircle, Clock, School, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parse } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { toast } from 'sonner';

const METRIC_LABELS = {
  internship_launches: 'Internship Launches',
  top_students: 'Top Students (Points)',
  student_participation: 'Student Participation',
  community_engagement: 'Community Engagement',
  course_completions: 'Course Completions',
  event_creations: 'Events Created',
};

const REWARD_COLORS = {
  donation: 'text-amber-400 bg-amber-500/15 border-amber-500/25',
  scholarship: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25',
  recognition: 'text-violet-400 bg-violet-500/15 border-violet-500/25',
  grant: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/25',
};

const defaultForm = {
  title: '',
  description: '',
  reward_type: 'recognition',
  reward_value: '',
  target_metric: 'internship_launches',
  target_value: '',
  deadline: '',
  target_dashboard: 'school',
  community_ids: [],
};

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [schools, setSchools] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState('active');
  const [awardModal, setAwardModal] = useState(null); // challenge to award
  const [selectedWinner, setSelectedWinner] = useState('');

  useEffect(() => {
    const load = async () => {
      const [ch, sc, comms, user] = await Promise.all([
        base44.entities.Challenge.list(),
        base44.entities.School.list(),
        base44.entities.Community.list(),
        base44.auth.me(),
      ]);
      setChallenges(ch);
      setSchools(sc);
      setCommunities(comms.filter(c => c.status === 'active'));
      setCurrentUser(user);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = challenges.filter(c => c.status === filter);

  const handleCreate = async () => {
    if (!form.title || !form.reward_value || !form.target_value) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    const created = await base44.entities.Challenge.create({
      ...form,
      target_value: Number(form.target_value),
      created_by_id: currentUser?.id,
    });
    setChallenges(prev => [...prev, created]);
    setForm(defaultForm);
    setShowModal(false);
    setSubmitting(false);
    toast.success('Challenge created!');
  };

  const handleAward = async () => {
    if (!selectedWinner || !awardModal) return;
    await base44.entities.Challenge.update(awardModal.id, {
      status: 'completed',
      winner_school_id: selectedWinner,
    });
    setChallenges(prev => prev.map(c => c.id === awardModal.id ? { ...c, status: 'completed', winner_school_id: selectedWinner } : c));
    toast.success('Challenge awarded!');
    setAwardModal(null);
    setSelectedWinner('');
  };

  const handleExpire = async (id) => {
    await base44.entities.Challenge.update(id, { status: 'expired' });
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, status: 'expired' } : c));
    toast.success('Challenge expired');
  };

  return (
    <div className="p-8">
      <PageHeader
        title="School Challenges"
        subtitle="Create and manage incentive challenges for schools"
        action={
          <button onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Challenge
          </button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['active', 'completed', 'expired'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filter === s ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-white/50 hover:bg-white/8 border border-white/10'}`}>
            {s} ({challenges.filter(c => c.status === s).length})
          </button>
        ))}
      </div>

      {/* Challenges grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Trophy className="w-12 h-12 text-amber-500/15 mx-auto mb-4" />
          <p className="text-white/40">No {filter} challenges</p>
          {filter === 'active' && <p className="text-white/20 text-xs mt-1">Create one to motivate schools</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((ch, i) => {
              const winner = schools.find(s => s.id === ch.winner_school_id);
              return (
                <motion.div key={ch.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl border border-white/8 p-5 flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white font-heading">{ch.title}</h3>
                      {ch.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{ch.description}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${REWARD_COLORS[ch.reward_type]}`}>
                      {ch.reward_type}
                    </span>
                  </div>

                  {/* Reward & Target */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Gift className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-white/60">Reward:</span>
                      <span className="text-white font-medium">{ch.reward_value}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Target className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span className="text-white/60">Goal:</span>
                      <span className="text-white font-medium">{METRIC_LABELS[ch.target_metric]} ≥ {ch.target_value}</span>
                    </div>
                    {ch.deadline && (
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        <span className="text-white/60">Deadline:</span>
                        <span className="text-white font-medium">{format(parse(ch.deadline, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {winner && (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-white/60">Won by:</span>
                        <span className="text-emerald-400 font-medium">{winner.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {ch.status === 'active' && (
                    <div className="flex gap-2 pt-2 border-t border-white/6">
                      <button onClick={() => { setAwardModal(ch); setSelectedWinner(''); }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium transition-all flex items-center justify-center gap-1">
                        <Trophy className="w-3 h-3" /> Award Winner
                      </button>
                      <button onClick={() => handleExpire(ch.id)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 text-white/40 text-xs font-medium transition-all flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Expire
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
                <h3 className="text-lg font-bold text-white">Create Challenge</h3>
                <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white/70"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto scrollbar-thin flex-1 p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-white/50">Title *</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="e.g. Launch 3 Internships This Month"
                    className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-amber-500/60" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/50">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Describe the challenge..."
                    className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-amber-500/60 resize-none h-16" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-white/50">Reward Type *</label>
                    <select value={form.reward_type} onChange={e => setForm({...form, reward_type: e.target.value})}
                      className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60">
                      <option value="donation">Donation</option>
                      <option value="scholarship">Scholarship</option>
                      <option value="recognition">Recognition</option>
                      <option value="grant">Grant</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-white/50">Reward Value *</label>
                    <input value={form.reward_value} onChange={e => setForm({...form, reward_value: e.target.value})}
                      placeholder="e.g. $500 donation"
                      className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-amber-500/60" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-white/50">Target Metric *</label>
                    <select value={form.target_metric} onChange={e => setForm({...form, target_metric: e.target.value})}
                      className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60">
                      {Object.entries(METRIC_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-white/50">Target Value *</label>
                    <input type="number" value={form.target_value} onChange={e => setForm({...form, target_value: e.target.value})}
                      placeholder="e.g. 3"
                      className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-amber-500/60" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/50">Target Dashboard *</label>
                  <select value={form.target_dashboard} onChange={e => setForm({...form, target_dashboard: e.target.value})}
                    className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60">
                    <option value="school">School Dashboard</option>
                    <option value="education">Education Dashboard</option>
                    <option value="all">Both Dashboards</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/50 flex items-center gap-1"><Users className="w-3 h-3" /> Post to Communities (optional — empty = all)</label>
                  <div className="max-h-36 overflow-y-auto scrollbar-thin rounded-xl border border-amber-500/20 bg-black/30 divide-y divide-white/4">
                    {communities.map(comm => (
                      <label key={comm.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/4 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={(form.community_ids || []).includes(comm.id)}
                          onChange={e => {
                            const ids = form.community_ids || [];
                            setForm({ ...form, community_ids: e.target.checked ? [...ids, comm.id] : ids.filter(id => id !== comm.id) });
                          }}
                          className="w-3.5 h-3.5 rounded"
                        />
                        <span className="text-xs text-white/70">{comm.name}</span>
                      </label>
                    ))}
                    {communities.length === 0 && <p className="text-xs text-white/30 text-center py-3">No communities found</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/50">Deadline (optional)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60 flex items-center justify-between">
                        <span className={form.deadline ? 'text-white' : 'text-white/35'}>
                          {form.deadline ? format(parse(form.deadline, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : 'Pick a deadline'}
                        </span>
                        <Calendar className="w-4 h-4 text-white/40" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarPicker mode="single"
                        selected={form.deadline ? parse(form.deadline, 'yyyy-MM-dd', new Date()) : undefined}
                        onSelect={date => setForm({...form, deadline: date ? format(date, 'yyyy-MM-dd') : ''})} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end gap-3 flex-shrink-0">
                <button onClick={() => setShowModal(false)} className="text-xs text-white/40 hover:text-white/70 px-4 py-2 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-40 transition-all">
                  {submitting ? 'Creating...' : 'Create Challenge'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Award Winner Modal */}
      <AnimatePresence>
        {awardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
              style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-base font-bold text-white mb-1">Award Winner</h3>
              <p className="text-xs text-white/40 mb-4">Select the winning school for <span className="text-white">{awardModal.title}</span></p>
              <select value={selectedWinner} onChange={e => setSelectedWinner(e.target.value)}
                className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60 mb-4">
                <option value="">Select school...</option>
                {schools.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={() => setAwardModal(null)} className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 text-xs font-medium transition-colors hover:bg-white/5">Cancel</button>
                <button onClick={handleAward} disabled={!selectedWinner}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold disabled:opacity-40 transition-all">
                  Award 🏆
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}