import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, Trophy, Star, ArrowRight, Zap, CheckCircle2, Clock, Briefcase, Award, Target, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlassButton from '@/components/ui/GlassButton';

function ScoreRing({ score }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width="128" height="128" className="rotate-[-90deg]">
      <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle cx="64" cy="64" r={r} fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      <defs>
        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function StudentOverview() {
  const [communities, setCommunities] = useState([]);
  const [progress, setProgress] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [internships, setInternships] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (user) => {
      const schoolMembers = await base44.entities.SchoolMember.filter({
        user_id: user?.id,
        status: 'approved',
      });
      const schoolIds = schoolMembers.map(sm => sm.school_id);

      Promise.all([
        base44.entities.Community.list(),
        base44.entities.CourseProgress.list(),
        base44.entities.Notification.filter({ is_read: false }, '-created_date', 5),
        base44.entities.Internship.filter({ is_active: true }),
        base44.entities.Challenge.filter({ status: 'active' }),
      ]).then(([c, p, n, i, ch]) => {
        const filteredComms = schoolIds.length > 0 ? c.filter(comm => schoolIds.includes(comm.school_id)) : [];
        const filteredInterns = schoolIds.length > 0 ? i.filter(intern => schoolIds.includes(intern.community_id)) : [];
        // Show challenges targeting education or all dashboards
        const filteredChallenges = ch.filter(challenge =>
          challenge.target_dashboard === 'education' || challenge.target_dashboard === 'all' || !challenge.target_dashboard
        );
        setCommunities(filteredComms);
        setProgress(p);
        setNotifications(n);
        setInternships(filteredInterns);
        setChallenges(filteredChallenges);
        setLoading(false);
      });
    });
  }, []);

  const inProgress = progress.filter(p => !p.is_completed);
  const completed = progress.filter(p => p.is_completed);
  const overallScore = inProgress.length ? Math.round(inProgress.reduce((a, p) => a + (p.completion_percentage || 0), 0) / inProgress.length) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-white">Education Dashboard</h1>
        <p className="text-sm text-white/40 mt-1">Learn, grow, and earn your way to the top</p>
      </div>

      {/* Hero score card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 mb-6 border border-violet-500/20"
        style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(34,211,238,0.06) 100%)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-cyan-600/5" />
        <div className="relative flex items-center gap-8">
          <div className="relative flex-shrink-0">
            <ScoreRing score={overallScore || 72} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold font-heading text-white">{overallScore || 72}</span>
              <span className="text-[10px] text-white/40">/100</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold font-heading text-white">Overall Score</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">Excellent</span>
            </div>
            <p className="text-xs text-white/40 mb-4">↑ +2 from last period</p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Courses in Progress', value: inProgress.length || 2 },
                { label: 'Completed', value: completed.length || 3 },
                { label: 'Communities', value: communities.length || 4 },
              ].map(s => (
                <div key={s.label} className="px-3 py-1.5 rounded-xl bg-white/6 border border-white/8">
                  <p className="text-[10px] text-white/30 mb-0.5">{s.label}</p>
                  <p className="text-lg font-bold font-heading text-white">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2 glass rounded-2xl border border-white/8 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white font-heading">Continue Learning 🚀</h2>
            <Link to="/student/courses" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">All courses <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-white/4 animate-pulse" />)}</div>
          ) : inProgress.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-violet-500/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm mb-3">No courses in progress</p>
              <Link to="/student/courses"><GlassButton variant="primary-violet" size="sm">Browse Courses</GlassButton></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgress.slice(0, 3).map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/4 border border-white/5 hover:border-violet-500/20 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">Course #{p.course_id?.slice(-6)}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-white/8">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${p.completion_percentage || 0}%` }} />
                      </div>
                      <span className="text-[10px] text-white/30">{p.completion_percentage || 0}%</span>
                    </div>
                  </div>
                  <Link to="/student/courses"><GlassButton size="sm" variant="ghost">Continue <ArrowRight className="w-3 h-3" /></GlassButton></Link>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-4 p-4 rounded-xl border border-violet-500/15 bg-violet-500/6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Keep growing 🚀</p>
              <p className="text-xs text-white/40">Pick up where you left off, or join a new community</p>
            </div>
            <Link to="/student/communities"><GlassButton variant="primary-violet" size="sm">Browse Communities</GlassButton></Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Sidebar title */}
          <div className="px-1 py-2">
            <h2 className="text-base font-bold font-heading text-white">Quick Access</h2>
          </div>

          {/* Notifications */}
          <div className="glass rounded-2xl border border-white/8 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white font-heading">Recent Activity</h3>
              {notifications.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400">{notifications.length}</span>}
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-3">All caught up!</p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 4).map(n => (
                  <div key={n.id} className="flex gap-2.5 py-2 border-b border-white/4 last:border-0">
                    <span className="text-base">{n.type === 'reply' ? '💬' : n.type === 'new_course' ? '📚' : '🔔'}</span>
                    <div><p className="text-xs text-white/70">{n.title}</p><p className="text-[10px] text-white/25 mt-0.5">{n.message}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="glass rounded-2xl border border-white/8 p-5">
            <h3 className="text-sm font-semibold text-white font-heading mb-3">Your Stats</h3>
            {[
              { label: 'Points Earned', value: '1,240', icon: Star, color: 'text-amber-400' },
              { label: 'Lessons Done', value: '34', icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'Time Invested', value: '48h', icon: Clock, color: 'text-cyan-400' },
              { label: 'Rank', value: '#12', icon: Trophy, color: 'text-violet-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                <div className="flex items-center gap-2">
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                  <span className="text-xs text-white/40">{s.label}</span>
                </div>
                <span className="text-sm font-bold text-white">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Achievements */}
          <div className="glass rounded-2xl border border-white/8 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white font-heading">Achievements</h3>
              <Link to="/student/achievements" className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors">View all</Link>
            </div>

            {/* Summary counts */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2.5 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)' }}>
                <p className="text-sm font-bold text-amber-400">3</p>
                <p className="text-[10px] text-white/50 mt-0.5">Rewards</p>
              </div>
              <div className="text-center p-2.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <p className="text-sm font-bold text-emerald-400">2</p>
                <p className="text-[10px] text-white/50 mt-0.5">Certs</p>
              </div>
              <div className="text-center p-2.5 rounded-lg" style={{ background: 'rgba(167,139,250,0.1)' }}>
                <p className="text-sm font-bold text-violet-400">5</p>
                <p className="text-[10px] text-white/50 mt-0.5">Milestones</p>
              </div>
            </div>

            {/* Recent achievements */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-white/4 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">Community Champion</p>
                  <p className="text-[10px] text-white/40">500 community points</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-white/4 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">Python Fundamentals</p>
                  <p className="text-[10px] text-white/40">May 28, 2026</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-white/4 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">Course Completionist</p>
                  <p className="text-[10px] text-white/40">5 courses done</p>
                </div>
              </div>
            </div>
          </div>

          {/* Challenges */}
          {challenges.length > 0 && (
            <div className="glass rounded-2xl border border-amber-500/15 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white font-heading flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Active Challenges
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{challenges.length}</span>
              </div>
              <div className="space-y-3">
                {challenges.slice(0, 3).map(ch => (
                  <div key={ch.id} className="p-3 rounded-xl border border-amber-500/15 bg-amber-500/5">
                    <p className="text-xs font-semibold text-white truncate mb-1">{ch.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-300/70">
                      <Gift className="w-3 h-3" />
                      <span>{ch.reward_value}</span>
                    </div>
                    {ch.deadline && (
                      <div className="flex items-center gap-1.5 text-[10px] text-white/30 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>Due {new Date(ch.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internships */}
          <div className="glass rounded-2xl border border-white/8 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white font-heading flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                Internships
              </h3>
              {internships.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">{internships.length}</span>}
            </div>
            {internships.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-3">No internships available</p>
            ) : (
              <div className="space-y-2">
                {internships.slice(0, 4).map(i => (
                  <div key={i.id} className="p-2.5 rounded-lg border border-white/6 hover:border-cyan-500/20 transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-xs font-semibold text-white/80 truncate">{i.company_name}</p>
                    <p className="text-[10px] text-white/40 truncate">{i.position_title}</p>
                    {i.stipend > 0 && <p className="text-[10px] text-cyan-400 mt-1">💰 ${i.stipend.toLocaleString()}</p>}
                  </div>
                ))}
              </div>
            )}
            <Link to="/student/internships" className="block mt-3 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 justify-center py-1.5 rounded-lg hover:bg-cyan-500/10 transition-all">
              View All Internships <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          </div>
          </div>
          </div>
          );
          }