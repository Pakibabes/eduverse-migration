import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Trophy, Target, Gift, Calendar, CheckCircle, Lock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parse, isPast } from 'date-fns';

const METRIC_LABELS_EXTRA = {
  event_creations: 'Events Created',
};

const METRIC_LABELS = {
  internship_launches: 'Internship Launches',
  top_students: 'Top Student Points',
  student_participation: 'Student Participation',
  community_engagement: 'Community Engagement',
  course_completions: 'Course Completions',
  event_creations: 'Events Created',
};

const REWARD_COLORS = {
  donation: { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/25' },
  scholarship: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25' },
  recognition: { text: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/25' },
  grant: { text: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/25' },
};

export default function SchoolChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [schools, setSchools] = useState([]);
  const [internships, setInternships] = useState([]);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [mySchool, setMySchool] = useState(null);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const schoolMembers = await base44.entities.SchoolMember.filter({ user_id: user.id, status: 'approved' });
      
      const [ch, sc] = await Promise.all([
        base44.entities.Challenge.list(),
        base44.entities.School.list(),
      ]);
      
      const [ints, communityMembers] = await Promise.all([
        base44.entities.Internship.list(),
        base44.entities.CommunityMember.list(),
      ]);
      
      const ev = await base44.entities.Event.list();
      
      setChallenges(ch);
      setSchools(sc);
      setCurrentUser(user);
      setInternships(ints);
      setMembers(communityMembers);
      setEvents(ev);

      if (schoolMembers.length > 0) {
        const school = sc.find(s => s.id === schoolMembers[0].school_id);
        setMySchool(school || null);
      }
      setLoading(false);
    };
    load().catch(err => console.error('Failed to load data:', err));
  }, []);

  // Calculate school's current progress for a metric
  const getProgress = (challenge) => {
    if (!mySchool) return { current: 0, target: challenge.target_value };
    const schoolId = mySchool.id;

    let current = 0;
    switch (challenge.target_metric) {
      case 'internship_launches':
        current = internships.filter(i => i.community_id === schoolId && i.status === 'active').length;
        break;
      case 'student_participation':
        current = members.filter(m => m.community_id === schoolId).length;
        break;
      case 'community_engagement':
        current = members.filter(m => m.community_id === schoolId && (m.points || 0) > 0).length;
        break;
      case 'event_creations':
        current = events.filter(e => e.school_id === schoolId).length;
        break;
      default:
        current = 0;
    }
    return { current, target: challenge.target_value };
  };

  const filtered = challenges.filter(c => c.status === filter);

  return (
    <div className="p-8">
      <PageHeader
        title="School Challenges"
        subtitle="Compete for rewards, scholarships, and recognition"
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-52 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Trophy className="w-12 h-12 text-amber-500/15 mx-auto mb-4" />
          <p className="text-white/40">No {filter} challenges right now</p>
          <p className="text-white/20 text-xs mt-1">Check back soon for new opportunities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ch, i) => {
            const colors = REWARD_COLORS[ch.reward_type] || REWARD_COLORS.recognition;
            const { current, target } = getProgress(ch);
            const pct = Math.min(100, Math.round((current / (target || 1)) * 100));
            const isWinner = ch.winner_school_id === mySchool?.id;
            const winnerSchool = schools.find(s => s.id === ch.winner_school_id);
            const isExpired = ch.deadline && isPast(parse(ch.deadline, 'yyyy-MM-dd', new Date()));

            return (
              <motion.div key={ch.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`glass rounded-2xl border p-6 flex flex-col gap-4 ${isWinner ? 'border-amber-500/40' : 'border-white/8'}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isWinner && <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                      <h3 className="text-sm font-bold text-white font-heading">{ch.title}</h3>
                    </div>
                    {ch.description && <p className="text-xs text-white/40 line-clamp-2">{ch.description}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>
                    {ch.reward_type}
                  </span>
                </div>

                {/* Reward & Deadline */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Gift className={`w-3.5 h-3.5 flex-shrink-0 ${colors.text}`} />
                    <span className="text-white/50">Prize:</span>
                    <span className="text-white font-semibold">{ch.reward_value}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Target className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-white/50">Goal:</span>
                    <span className="text-white">{METRIC_LABELS[ch.target_metric]} ≥ {target}</span>
                  </div>
                  {ch.deadline && (
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${isExpired ? 'text-rose-400' : 'text-white/40'}`} />
                      <span className="text-white/50">Deadline:</span>
                      <span className={isExpired ? 'text-rose-400' : 'text-white'}>
                        {format(parse(ch.deadline, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress (active only, and only for calculable metrics) */}
                {ch.status === 'active' && mySchool && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-white/40">Your school's progress</span>
                      <span className="text-white font-medium">{current} / {target}</span>
                    </div>
                    <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06 + 0.2 }}
                        className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      />
                    </div>
                    {pct >= 100 && (
                      <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Goal met! Waiting for admin review.
                      </p>
                    )}
                  </div>
                )}

                {/* Winner banner */}
                {ch.status === 'completed' && (
                  <div className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${isWinner ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' : 'bg-white/5 text-white/40'}`}>
                    {isWinner ? (
                      <><Trophy className="w-3.5 h-3.5" /> 🎉 Your school won this challenge!</>
                    ) : (
                      <><Lock className="w-3.5 h-3.5" /> Won by {winnerSchool?.name || 'another school'}</>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}