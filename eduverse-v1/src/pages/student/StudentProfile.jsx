import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import GlassButton from '@/components/ui/GlassButton';
import SkillsSection from '@/components/profile/SkillsSection';
import { Star, BookOpen, Trophy, Zap, CheckCircle2, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentProfile() {
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [progress, setProgress] = useState([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.Community.list(),
      base44.entities.CourseProgress.list()
    ]).then(([u, c, p]) => {
      setUser(u);
      setCommunities(c);
      setProgress(p);
    });
  }, []);

  const completed = progress.filter(p => p.is_completed).length;
  const totalPoints = 1240;

  const badges = [
    { emoji: '🚀', label: 'Early Adopter', earned: true },
    { emoji: '📚', label: 'Course Finisher', earned: completed > 0 },
    { emoji: '⭐', label: 'Top Scorer', earned: totalPoints > 1000 },
    { emoji: '🔥', label: '7-Day Streak', earned: false },
    { emoji: '🏆', label: 'Top 10', earned: false },
    { emoji: '💡', label: 'Quiz Master', earned: false },
  ];

  return (
    <div className="p-8">
      <PageHeader title="Profile" subtitle="Your learning identity" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="glass rounded-2xl border border-white/8 p-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-3xl font-bold text-white mx-auto">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
          <h2 className="text-lg font-bold font-heading text-white mb-0.5">{user?.full_name || 'User'}</h2>
          <p className="text-xs text-white/40 mb-4">{user?.email || 'No email'}</p>
          <GlassButton variant="secondary" size="sm" onClick={() => setEditing(!editing)} className="mx-auto">
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </GlassButton>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: 'Points', value: totalPoints.toLocaleString(), icon: Star, color: 'text-amber-400' },
              { label: 'Rank', value: '#12', icon: Trophy, color: 'text-violet-400' },
              { label: 'Courses', value: progress.length, icon: BookOpen, color: 'text-cyan-400' },
              { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-white/4 border border-white/6">
                <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                <p className="text-base font-bold text-white font-heading">{s.value}</p>
                <p className="text-[10px] text-white/30">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Badges + activity */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass rounded-2xl border border-white/8 p-6">
            <h3 className="text-sm font-semibold text-white font-heading mb-4">Badges & Achievements</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {badges.map(b => (
                <motion.div key={b.label} whileHover={b.earned ? { scale: 1.05 } : {}}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${b.earned ? 'border-violet-500/20 bg-violet-500/8' : 'border-white/5 opacity-35'}`}>
                  <span className="text-2xl">{b.emoji}</span>
                  <p className="text-[10px] text-white/50 text-center leading-tight">{b.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <SkillsSection />

          <div className="glass rounded-2xl border border-white/8 p-6">
            <h3 className="text-sm font-semibold text-white font-heading mb-4">My Communities</h3>
            {communities.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">Not in any communities yet</p>
            ) : (
              <div className="space-y-2">
                {communities.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-sm">◈</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{c.name}</p>
                      <p className="text-xs text-white/30">{c.member_count || 0} members</p>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl border border-white/8 p-6">
            <h3 className="text-sm font-semibold text-white font-heading mb-4">Points Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Course Completions', pts: 500, pct: 40 },
                { label: 'Quiz Passes', pts: 350, pct: 28 },
                { label: 'Posts & Comments', pts: 250, pct: 20 },
                { label: 'Streaks', pts: 140, pct: 12 },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/50">{item.label}</span>
                    <span className="text-amber-400 font-medium">+{item.pts}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/6">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}