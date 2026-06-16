import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Calendar, MapPin, Users, DollarSign, CheckCircle2, Building2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';

const statusColors = {
  planned: 'bg-blue-500/15 text-blue-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  completed: 'bg-white/10 text-white/40',
  cancelled: 'bg-red-500/15 text-red-400',
};

const locationTypeColors = {
  'in-person': 'bg-violet-500/15 text-violet-400',
  virtual: 'bg-cyan-500/15 text-cyan-400',
  hybrid: 'bg-amber-500/15 text-amber-400',
};

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const [evts, schoolList] = await Promise.all([
        base44.entities.Event.list(),
        base44.entities.School.list(),
      ]);
      setEvents(evts.sort((a, b) => new Date(a.date) - new Date(b.date)));
      setSchools(schoolList);
      setLoading(false);
    };
    load();
  }, []);

  const handleAttend = async (event) => {
    const attending = (event.attendee_ids || []).includes(currentUser.id);
    const updatedIds = attending
      ? event.attendee_ids.filter(id => id !== currentUser.id)
      : [...(event.attendee_ids || []), currentUser.id];
    const updated = await base44.entities.Event.update(event.id, { attendee_ids: updatedIds });
    setEvents(prev => prev.map(e => e.id === event.id ? updated : e));
    toast.success(attending ? 'Removed attendance' : 'Marked as attending!');
  };

  const handleStatusChange = async (event, status) => {
    const updated = await base44.entities.Event.update(event.id, { status });
    setEvents(prev => prev.map(e => e.id === event.id ? updated : e));
    toast.success('Status updated');
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter);

  return (
    <div className="p-8">
      <PageHeader title="School Events" subtitle="All events scheduled by schools across the platform" />

      {/* Filters */}
      <div className="flex gap-2 mb-6 p-1 rounded-lg w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {['all', 'planned', 'active', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${filter === f ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-white/50 hover:text-white/70'}`}>
            {f === 'all' ? 'All Events' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-56 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Calendar className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-base">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((event, i) => {
            const school = schools.find(s => s.id === event.school_id);
            const isAttending = (event.attendee_ids || []).includes(currentUser?.id);
            return (
              <motion.div key={event.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl border border-white/8 p-6 hover:border-amber-500/20 transition-all">

                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white font-heading truncate">{event.title}</h3>
                    {school && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3 h-3 text-white/30" />
                        <p className="text-xs text-white/40">{school.name}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[event.status]}`}>{event.status}</span>
                    {event.location_type && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${locationTypeColors[event.location_type]}`}>{event.location_type}</span>
                    )}
                  </div>
                </div>

                {event.description && <p className="text-xs text-white/40 mb-4 line-clamp-2">{event.description}</p>}

                {/* Details */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Calendar className="w-3.5 h-3.5 text-amber-400/60" />
                    <span>{event.date ? format(parse(event.date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : '—'}{event.time ? ` at ${event.time}` : ''}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <MapPin className="w-3.5 h-3.5 text-amber-400/60" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Users className="w-3.5 h-3.5 text-amber-400/60" />
                    <span>{(event.attendee_ids || []).length} attending{event.max_attendees ? ` / ${event.max_attendees} max` : ''}</span>
                  </div>
                  {event.sponsor_amount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>${event.sponsor_amount.toLocaleString()} sponsorship{event.sponsor_name ? ` — ${event.sponsor_name}` : ''}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-white/6">
                  <button onClick={() => handleAttend(event)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all flex-1 justify-center ${isAttending ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/50 hover:bg-white/8 border border-white/10'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isAttending ? 'Attending' : 'Mark as Attending'}
                  </button>
                  <select value={event.status} onChange={e => handleStatusChange(event, e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-white/20">
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}