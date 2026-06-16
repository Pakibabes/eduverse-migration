import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Plus, X, Calendar, MapPin, Users, DollarSign, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parse } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { toast } from 'sonner';

const statusColors = {
  planned: 'bg-blue-500/15 text-blue-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  completed: 'bg-white/10 text-white/40',
  cancelled: 'bg-red-500/15 text-red-400',
};

const defaultForm = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  location_type: 'in-person',
  sponsor_amount: '',
  sponsor_name: '',
  max_attendees: '',
  status: 'planned',
};

export default function SchoolEvents() {
  const [events, setEvents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [mySchool, setMySchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const [schoolMembers, allSchools] = await Promise.all([
        base44.entities.SchoolMember.filter({ user_id: user.id, status: 'approved' }),
        base44.entities.School.list(),
      ]);
      setSchools(allSchools);
      const school = allSchools.find(s => s.id === schoolMembers[0]?.school_id);
      setMySchool(school || null);

      const evts = school
        ? await base44.entities.Event.filter({ school_id: school.id })
        : [];
      setEvents(evts.sort((a, b) => new Date(a.date) - new Date(b.date)));
      setLoading(false);
    };
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.date || !mySchool) {
      toast.error('Please fill in required fields');
      return;
    }
    setSubmitting(true);
    const created = await base44.entities.Event.create({
      ...form,
      sponsor_amount: form.sponsor_amount ? parseFloat(form.sponsor_amount) : 0,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : undefined,
      school_id: mySchool.id,
      attendee_ids: [],
      created_by_id: currentUser.id,
    });
    setEvents(prev => [...prev, created].sort((a, b) => new Date(a.date) - new Date(b.date)));
    toast.success('Event created!');
    setForm(defaultForm);
    setShowModal(false);
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Event.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success('Event deleted');
  };

  return (
    <div className="p-8">
      <PageHeader
        title="School Events"
        subtitle="Schedule and manage your school's events"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Calendar className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-base">No events yet</p>
          <p className="text-white/20 text-sm mt-1">Create your first event to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl border border-white/8 p-6 hover:border-emerald-500/20 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white font-heading truncate">{event.title}</h3>
                    {event.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{event.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[event.status]}`}>{event.status}</span>
                    <button onClick={() => handleDelete(event.id)} className="p-1 text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400/60" />
                    <span>{event.date ? format(parse(event.date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : '—'}{event.time ? ` at ${event.time}` : ''}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400/60" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.max_attendees && (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Users className="w-3.5 h-3.5 text-emerald-400/60" />
                      <span>{(event.attendee_ids || []).length} / {event.max_attendees} attendees</span>
                    </div>
                  )}
                  {event.sponsor_amount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>${event.sponsor_amount.toLocaleString()} sponsorship{event.sponsor_name ? ` by ${event.sponsor_name}` : ''}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Event Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
                <h3 className="text-lg font-bold text-white">Create Event</h3>
                <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white/70"><X className="w-4 h-4" /></button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-4 scrollbar-thin">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 font-medium">Event Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Career Fair 2026"
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/60" />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 font-medium">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="What is this event about?"
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/60 resize-none h-20" />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-medium">Date *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none hover:border-violet-500/40 flex items-center justify-between">
                          <span>{form.date ? format(parse(form.date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : 'Pick a date'}</span>
                          <Calendar className="w-4 h-4 text-white/30" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarPicker mode="single"
                          selected={form.date ? parse(form.date, 'yyyy-MM-dd', new Date()) : undefined}
                          onSelect={date => setForm({ ...form, date: date ? format(date, 'yyyy-MM-dd') : '' })} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-medium">Time</label>
                    <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                      className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60" />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-medium">Location</label>
                    <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Main Hall or Zoom link"
                      className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/60" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-medium">Type</label>
                    <select value={form.location_type} onChange={e => setForm({ ...form, location_type: e.target.value })}
                      className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60">
                      <option value="in-person">In-Person</option>
                      <option value="virtual">Virtual</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                {/* Max Attendees */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 font-medium">Max Attendees</label>
                  <input type="number" min="1" value={form.max_attendees} onChange={e => setForm({ ...form, max_attendees: e.target.value })}
                    placeholder="Leave blank for unlimited"
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/60" />
                </div>

                {/* Sponsorship */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Sponsorship (Optional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/40 font-medium">Sponsor Name</label>
                      <input value={form.sponsor_name} onChange={e => setForm({ ...form, sponsor_name: e.target.value })}
                        placeholder="e.g. Acme Corp"
                        className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/40" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/40 font-medium">Amount (USD)</label>
                      <input type="number" min="0" value={form.sponsor_amount} onChange={e => setForm({ ...form, sponsor_amount: e.target.value })}
                        placeholder="e.g. 5000"
                        className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/40" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end gap-3 flex-shrink-0">
                <button onClick={() => setShowModal(false)} className="text-xs text-white/40 hover:text-white/70 px-4 py-2 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={submitting || !form.title.trim() || !form.date}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20">
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}