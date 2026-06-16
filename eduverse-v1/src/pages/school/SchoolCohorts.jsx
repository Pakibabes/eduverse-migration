import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { format, parse } from 'date-fns';
import { Search, X, Plus, Trash, Users, ArrowRight, BookmarkPlus, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import PageHeader from '@/components/ui/PageHeader';
import GlassButton from '@/components/ui/GlassButton';
import { toast } from 'sonner';

const DEFAULT_FORM = {
  title: '',
  category_id: '',
  community_id: '',
  description: '',
  num_openings: 1,
  location_type: 'remote',
  total_hours: '',
  start_date: '',
  end_date: '',
  application_deadline: '',
  responsible_members: [],
  current_member_type: 'existing',
  current_member_id: '',
  current_member_name: '',
  current_member_email: '',
};

export default function SchoolCohorts() {
  const [cohorts, setCohorts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [schoolMembers, setSchoolMembers] = useState([]);
  const [careers, setCareers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [milestones, setMilestones] = useState([]);
  const [newMilestone, setNewMilestone] = useState({ name: '', description: '', due_date: '', role: 'intern' });

  useEffect(() => {
    Promise.all([
      base44.entities.Cohort.list(),
      base44.entities.Community.list(),
      base44.auth.me(),
      base44.entities.CareerCategory.list(),
      base44.entities.SchoolMember.list(),
    ]).then(([cohortList, comms, user, careerList, members]) => {
      setCohorts(cohortList);
      setCommunities(comms);
      setCurrentUser(user);
      setCareers(careerList);
      setSchoolMembers(members);
      setLoading(false);
    });
  }, []);

  // Use selected community directly — no fragile chain derivation
  const selectedCommunity = communities.find(c => c.id === form.community_id);
  const schoolId = selectedCommunity?.school_id;
  const schoolMembersFiltered = schoolMembers.filter(m => m.school_id === schoolId && m.status === 'approved');

  const filteredCohorts = cohorts.filter(c => {
    const matchesSearch = (c.title || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddMilestone = () => {
    if (!newMilestone.name.trim()) return;
    setMilestones(prev => [...prev, { ...newMilestone, id: Date.now() }]);
    setNewMilestone({ name: '', description: '', due_date: '', role: 'intern' });
  };

  const handleCreate = async (status) => {
    if (!currentUser) { toast.error('Not logged in'); return; }

    const titleTrimmed = form.title?.trim();
    const hoursNum = parseInt(form.total_hours || 0, 10);
    const comm = communities.find(c => c.id === form.community_id);

    if (!form.community_id || !comm) { toast.error('Please select a school/community'); return; }
    if (!titleTrimmed || !form.category_id || !form.start_date || !form.end_date || !form.application_deadline || hoursNum < 1) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const milestoneIds = [];
      for (const m of milestones) {
        const created = await base44.entities.InternshipMilestone.create({
          internship_id: '',
          name: m.name,
          description: m.description,
          due_date: m.due_date || form.end_date,
          required_signatures: [{ role: m.role, status: 'pending' }],
          status: 'pending',
        });
        milestoneIds.push(created.id);
      }

      const newCohort = await base44.entities.Cohort.create({
        title: titleTrimmed,
        description: form.description || '',
        career_category_id: form.category_id,
        community_id: comm.id,
        school_id: comm.school_id || '',
        start_date: form.start_date,
        end_date: form.end_date,
        application_deadline: form.application_deadline,
        total_hours: hoursNum,
        num_openings: parseInt(form.num_openings || 1, 10),
        location_type: form.location_type,
        responsible_members: form.responsible_members,
        milestone_ids: milestoneIds,
        status,
        created_by_id: currentUser.id,
      });

      for (const mid of milestoneIds) {
        await base44.entities.InternshipMilestone.update(mid, { internship_id: newCohort.id });
      }

      setCohorts(prev => [...prev, newCohort]);
      toast.success(`Cohort ${status === 'active' ? 'launched' : 'saved as draft'}`);
      setShowCreateModal(false);
      setForm(DEFAULT_FORM);
      setMilestones([]);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Failed to create cohort');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const map = { active: 'bg-emerald-500/15 text-emerald-400', draft: 'bg-white/10 text-white/50', closed: 'bg-rose-500/15 text-rose-400' };
    return map[status] || map.draft;
  };

  const canLaunch = form.title.trim() && form.community_id && form.category_id && form.start_date && form.end_date && form.application_deadline && parseInt(form.total_hours || 0, 10) >= 1;

  return (
    <div className="p-8">
      <PageHeader
        title="Cohorts"
        subtitle="Manage and launch student cohort programs"
      />

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cohorts..."
            className="w-full bg-black/30 border border-emerald-500/20 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/35 focus:outline-none focus:border-emerald-500/60 transition-all" />
        </div>
        <div className="flex gap-2 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {['active', 'draft', 'closed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === s ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-white/50 hover:text-white/70'}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap">
          Start a Cohort
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
              <h3 className="text-lg font-bold text-white">Create Cohort</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-white/30 hover:text-white/70"><X className="w-4 h-4" /></button>
            </div>

            <div className="overflow-y-auto scrollbar-thin flex-1 p-6 space-y-6">

              {/* Basics */}
              <section className="space-y-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Basics</h4>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Cohort Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Summer Software Engineering Cohort"
                    className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/60" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">School / Community *</label>
                  <select value={form.community_id} onChange={e => setForm({ ...form, community_id: e.target.value })}
                    className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60">
                    <option value="">Select school...</option>
                    {communities.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Career Category *</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60">
                    <option value="">Select category...</option>
                    {careers.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="What will participants learn and do?"
                    className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/60 resize-none h-20" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Max Participants</label>
                  <input type="number" min="1" value={form.num_openings} onChange={e => setForm({ ...form, num_openings: e.target.value })}
                    placeholder="e.g. 20"
                    className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/60" />
                </div>
              </section>

              {/* Logistics */}
              <section className="space-y-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Logistics</h4>

                {[
                  { label: 'Start Date *', key: 'start_date' },
                  { label: 'End Date *', key: 'end_date' },
                  { label: 'Application Deadline *', key: 'application_deadline' },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs text-white/50">{label}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none hover:border-emerald-500/40 flex items-center justify-between">
                          <span>{form[key] ? format(parse(form[key], 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : 'Pick a date'}</span>
                          <CalendarIcon className="w-4 h-4 text-white/40" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single"
                          selected={form[key] ? parse(form[key], 'yyyy-MM-dd', new Date()) : undefined}
                          onSelect={date => setForm({ ...form, [key]: date ? format(date, 'yyyy-MM-dd') : '' })} />
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Total Hours *</label>
                  <input type="number" min="1" value={form.total_hours} onChange={e => setForm({ ...form, total_hours: e.target.value })}
                    placeholder="e.g. 200"
                    className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/60" />
                </div>
              </section>

              {/* Point of Contact */}
              <section className="space-y-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Point of Contact</h4>
                <div className="flex gap-2">
                  {['existing', 'email'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, current_member_type: t })}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${form.current_member_type === t ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-white/50'}`}>
                      {t === 'existing' ? 'Existing Member' : 'Invite by Email'}
                    </button>
                  ))}
                </div>

                {form.current_member_type === 'existing' ? (
                  <div className="flex gap-2">
                    <select value={form.current_member_id} onChange={e => setForm({ ...form, current_member_id: e.target.value })}
                      className="flex-1 bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60">
                      <option value="">Choose a member...</option>
                      {schoolMembersFiltered.map(m => <option key={m.user_id} value={m.user_id}>{m.user_name || m.user_email}</option>)}
                    </select>
                    <button type="button" disabled={!form.current_member_id}
                      onClick={() => {
                        const m = schoolMembersFiltered.find(m => m.user_id === form.current_member_id);
                        if (m) setForm({ ...form, responsible_members: [...form.responsible_members, { name: m.user_name || m.user_email, email: m.user_email }], current_member_id: '' });
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold disabled:opacity-40">Add</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={form.current_member_name} onChange={e => setForm({ ...form, current_member_name: e.target.value })} placeholder="Name"
                      className="flex-1 bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/60" />
                    <input type="email" value={form.current_member_email} onChange={e => setForm({ ...form, current_member_email: e.target.value })} placeholder="Email"
                      className="flex-1 bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/60" />
                    <button type="button" disabled={!form.current_member_name.trim() || !form.current_member_email.trim()}
                      onClick={() => {
                        if (form.current_member_name.trim() && form.current_member_email.trim())
                          setForm({ ...form, responsible_members: [...form.responsible_members, { name: form.current_member_name, email: form.current_member_email }], current_member_name: '', current_member_email: '' });
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold disabled:opacity-40">Add</button>
                  </div>
                )}

                {form.responsible_members.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/8">
                    {form.responsible_members.map((m, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-xs font-medium text-white">{m.name}</p>
                          <p className="text-[10px] text-white/40">{m.email}</p>
                        </div>
                        <button onClick={() => setForm({ ...form, responsible_members: form.responsible_members.filter((_, idx) => idx !== i) })}
                          className="text-white/30 hover:text-rose-400 transition-colors"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Milestones */}
              <section className="space-y-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Milestones</h4>

                {milestones.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/8">
                    <div>
                      <p className="text-sm font-medium text-white">{m.name}</p>
                      <p className="text-xs text-white/40">{m.due_date ? format(parse(m.due_date, 'yyyy-MM-dd', new Date()), 'MMM dd') : 'No due date'} · {m.role}</p>
                    </div>
                    <button onClick={() => setMilestones(milestones.filter(ms => ms.id !== m.id))} className="text-white/30 hover:text-rose-400 transition-colors"><Trash className="w-3.5 h-3.5" /></button>
                  </div>
                ))}

                <div className="space-y-2 border-t border-white/8 pt-3">
                  <input value={newMilestone.name} onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })} placeholder="Milestone name"
                    className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/60" />
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-white">
                          {newMilestone.due_date ? format(parse(newMilestone.due_date, 'yyyy-MM-dd', new Date()), 'MMM dd') : 'Pick due date'}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={newMilestone.due_date ? parse(newMilestone.due_date, 'yyyy-MM-dd', new Date()) : undefined}
                          onSelect={d => setNewMilestone({ ...newMilestone, due_date: d ? format(d, 'yyyy-MM-dd') : '' })} />
                      </PopoverContent>
                    </Popover>
                    <select value={newMilestone.role} onChange={e => setNewMilestone({ ...newMilestone, role: e.target.value })}
                      className="bg-black/30 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60">
                      <option value="intern">Intern</option>
                      <option value="staff">Staff</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <button onClick={handleAddMilestone} disabled={!newMilestone.name.trim()}
                    className="w-full py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-medium disabled:opacity-40 transition-all">
                    <Plus className="w-3 h-3 inline mr-1" /> Add Milestone
                  </button>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end gap-3 flex-shrink-0">
              <button onClick={() => { setShowCreateModal(false); setForm(DEFAULT_FORM); setMilestones([]); }}
                className="text-xs text-white/40 hover:text-white/70 px-4 py-2 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => handleCreate('draft')} disabled={submitting}
                className="px-4 py-2 rounded-xl border border-white/20 hover:border-white/40 text-white text-xs font-bold transition-all disabled:opacity-40">
                Save Draft
              </button>
              <button onClick={() => handleCreate('active')} disabled={submitting || !canLaunch}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20">
                {submitting ? 'Launching...' : 'Launch'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cohorts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : filteredCohorts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <BookmarkPlus className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-base">No cohorts found</p>
          <p className="text-white/20 text-sm mt-1">Launch a cohort to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredCohorts.map((cohort, i) => (
              <motion.div key={cohort.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl border border-white/8 p-6 hover:border-emerald-500/20 transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white font-heading">{cohort.title}</h3>
                    {cohort.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{cohort.description}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge(cohort.status)}`}>{cohort.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{cohort.enrolled_count || 0} enrolled</span>
                  {cohort.start_date && <span>Starts {format(parse(cohort.start_date, 'yyyy-MM-dd', new Date()), 'MMM d')}</span>}
                  {cohort.total_hours && <span>{cohort.total_hours}h</span>}
                </div>
                <GlassButton variant="secondary" size="sm" className="w-full justify-center">
                  View Cohort <ArrowRight className="w-3 h-3" />
                </GlassButton>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}