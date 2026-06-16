import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Trophy, Gift, Calendar, CheckCircle, Crown, Medal, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parse } from 'date-fns';

const REWARD_COLORS = {
  donation: { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/25' },
  scholarship: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25' },
  recognition: { text: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/25' },
  grant: { text: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/25' },
};

const METRIC_LABELS = {
  internship_launches: 'Internship Launches',
  top_students: 'Top Student Points',
  student_participation: 'Student Participation',
  community_engagement: 'Community Engagement',
  course_completions: 'Course Completions',
};

export default function SchoolAchievements() {
  const [won, setWon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mySchool, setMySchool] = useState(null);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const [schoolMembers, schools, challenges] = await Promise.all([
        base44.entities.SchoolMember.filter({ user_id: user.id, status: 'approved' }),
        base44.entities.School.list(),
        base44.entities.Challenge.filter({ status: 'completed' }),
      ]);

      if (schoolMembers.length === 0) {
        setLoading(false);
        return;
      }

      const school = schools.find(s => s.id === schoolMembers[0].school_id);
      setMySchool(school || null);

      if (school) {
        setWon(challenges.filter(c => c.winner_school_id === school.id));
      }

      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="p-8">
      <PageHeader
        title="School Achievements"
        subtitle="Challenges won and rewards earned by your school"
      />

      {/* Summary banner */}
      {!loading && mySchool && won.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-amber-500/30 p-6 flex items-center gap-5"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(16,185,129,0.04) 100%)' }}>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white font-heading">{mySchool.name}</p>
            <p className="text-sm text-amber-400 font-medium mt-0.5">🏆 {won.length} challenge{won.length !== 1 ? 's' : ''} won</p>
            <p className="text-xs text-white/40 mt-1">Keep up the great work — more challenges are on the way!</p>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-52 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : won.length === 0 ? (
        <div className="text-center py-24 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Trophy className="w-14 h-14 text-amber-500/10 mx-auto mb-4" />
          <p className="text-white/40 text-base font-medium">No achievements yet</p>
          <p className="text-white/20 text-xs mt-2">Win challenges to see them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {won.map((ch, i) => {
            const colors = REWARD_COLORS[ch.reward_type] || REWARD_COLORS.recognition;
            const rankIcon = i === 0 ? <Crown className="w-4 h-4 text-amber-400" />
              : i === 1 ? <Medal className="w-4 h-4 text-slate-300" />
              : i === 2 ? <Medal className="w-4 h-4 text-amber-600" />
              : <Star className="w-4 h-4 text-white/30" />;

            return (
              <motion.div key={ch.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="glass rounded-2xl border border-amber-500/25 p-6 flex flex-col gap-4"
                style={{ background: 'rgba(245,158,11,0.04)' }}>
                {/* Badge + title */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    {rankIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white font-heading">{ch.title}</h3>
                    {ch.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{ch.description}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>
                    {ch.reward_type}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Gift className={`w-3.5 h-3.5 flex-shrink-0 ${colors.text}`} />
                    <span className="text-white/50">Reward:</span>
                    <span className="text-white font-semibold">{ch.reward_value}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-white/50">Metric:</span>
                    <span className="text-white">{METRIC_LABELS[ch.target_metric]}</span>
                  </div>
                  {ch.deadline && (
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <span className="text-white/50">Completed by:</span>
                      <span className="text-white">{format(parse(ch.deadline, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </div>

                {/* Won banner */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium">
                  <Trophy className="w-3.5 h-3.5" /> Your school won this challenge!
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}