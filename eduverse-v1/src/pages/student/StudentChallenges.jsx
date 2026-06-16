import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, Gift, Target, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parse } from 'date-fns';

const METRIC_LABELS = {
  internship_launches: 'Internship Launches',
  top_students: 'Top Students (Points)',
  student_participation: 'Student Participation',
  community_engagement: 'Community Engagement',
  course_completions: 'Course Completions',
};

const REWARD_COLORS = {
  donation: 'text-amber-400 bg-amber-500/15 border-amber-500/25',
  scholarship: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25',
  recognition: 'text-violet-400 bg-violet-500/15 border-violet-500/25',
  grant: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/25',
};

export default function StudentChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    base44.entities.Challenge.list().then(all => {
      const visible = all.filter(ch =>
        ch.target_dashboard === 'education' || ch.target_dashboard === 'all' || !ch.target_dashboard
      );
      setChallenges(visible);
      setLoading(false);
    });
  }, []);

  const filtered = challenges.filter(c => c.status === filter);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-white flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-400" /> Challenges
        </h1>
        <p className="text-sm text-white/40 mt-1">Complete challenges and earn rewards</p>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Trophy className="w-12 h-12 text-amber-500/15 mx-auto mb-4" />
          <p className="text-white/40">No {filter} challenges</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ch, i) => (
            <motion.div key={ch.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl border border-white/8 p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white font-heading">{ch.title}</h3>
                  {ch.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{ch.description}</p>}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${REWARD_COLORS[ch.reward_type]}`}>
                  {ch.reward_type}
                </span>
              </div>

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
                    <Clock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    <span className="text-white/60">Deadline:</span>
                    <span className="text-white font-medium">{format(parse(ch.deadline, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>

              {ch.status === 'active' && (
                <div className="pt-2 border-t border-white/6">
                  <div className="w-full h-1.5 rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400" style={{ width: '35%' }} />
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">In progress</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}