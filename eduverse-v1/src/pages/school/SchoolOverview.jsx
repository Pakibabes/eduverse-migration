import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Users, ArrowRight, Star, Trophy, Medal, Crown, Building2, Zap, Target, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function SchoolOverview() {
  const [members, setMembers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mySchool, setMySchool] = useState(null);
  const [schoolRank, setSchoolRank] = useState(null);
  const [schoolScore, setSchoolScore] = useState(0);
  const [totalSchools, setTotalSchools] = useState(0);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const [m, p, schools, internships, communities, schoolMembers, ch] = await Promise.all([
        base44.entities.CommunityMember.list(),
        base44.entities.Post.filter({ in_school_feed: true }),
        base44.entities.School.list(),
        base44.entities.Internship.list(),
        base44.entities.Community.list(),
        base44.entities.SchoolMember.filter({ user_id: user.id, status: 'approved' }),
        base44.entities.Challenge.filter({ status: 'active' }),
      ]);
      setMembers(m);
      setChallenges(ch);
      setTotalSchools(schools.length);

      if (schoolMembers.length > 0) {
        const school = schools.find(s => s.id === schoolMembers[0].school_id);
        setMySchool(school || null);

        // Calculate scores for all schools (same logic as leaderboard)
        const scores = schools.map(sc => {
          const schoolCommunities = communities.filter(c => c.school_id === sc.id);
          const schoolPosts = p.filter(post => schoolCommunities.some(c => c.id === post.community_id)).length;
          const schoolInternships = internships.filter(i => schoolCommunities.some(c => c.id === i.community_id));
          const score =
            schoolInternships.length * 50 +
            schoolInternships.reduce((s, i) => s + (i.applicant_count || 0) * 10, 0) +
            schoolInternships.reduce((s, i) => s + (i.enrolled_count || 0) * 25, 0) +
            schoolPosts * 5;
          return { id: sc.id, score };
        }).sort((a, b) => b.score - a.score);

        const rank = scores.findIndex(s => s.id === schoolMembers[0].school_id) + 1;
        const myScore = scores.find(s => s.id === schoolMembers[0].school_id)?.score || 0;
        setSchoolRank(rank > 0 ? rank : null);
        setSchoolScore(myScore);
      }

      setLoading(false);
    };
    load();
  }, []);

  const rankIcon = schoolRank === 1 ? <Crown className="w-5 h-5 text-amber-400" />
    : schoolRank === 2 ? <Medal className="w-5 h-5 text-slate-300" />
    : schoolRank === 3 ? <Medal className="w-5 h-5 text-amber-600" />
    : null;

  return (
    <div className="p-8">
      <PageHeader
        title="School Dashboard"
        subtitle="View your courses and school activity"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="Total Members & Students" value={loading ? '—' : members.length} icon={Users} color="emerald" trend={{ up: true, value: '+12 this week' }} />
        <StatCard label="School Rank" value={loading ? '—' : schoolRank ? `#${schoolRank}` : '—'} icon={Trophy} color="amber" sub={schoolRank ? `of ${totalSchools} schools` : 'Not ranked yet'} />
      </div>

      {/* School Ranking Banner */}
      {!loading && mySchool && schoolRank && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border p-5 flex items-center gap-5"
          style={{
            background: schoolRank <= 3
              ? 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(16,185,129,0.04) 100%)'
              : 'rgba(255,255,255,0.04)',
            borderColor: schoolRank === 1 ? 'rgba(245,158,11,0.35)' : schoolRank <= 3 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)',
          }}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl font-bold font-heading
            ${schoolRank === 1 ? 'bg-amber-500/20 text-amber-400' : schoolRank <= 3 ? 'bg-amber-700/15 text-amber-600' : 'bg-white/8 text-white/50'}`}>
            {rankIcon || `#${schoolRank}`}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40 mb-0.5">Your school's ranking</p>
            <p className="text-lg font-bold text-white font-heading truncate">{mySchool.name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-sm font-bold ${schoolRank === 1 ? 'text-amber-400' : 'text-white/60'}`}>
                #{schoolRank} of {totalSchools} schools
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <Zap className="w-3.5 h-3.5" /> {schoolScore.toLocaleString()} pts
              </span>
            </div>
          </div>
          <Link to="/school/leaderboard" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0">
            Full Leaderboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}

      {/* Leaderboard Preview */}
      <div className="rounded-2xl border border-white/8 p-6 mb-6" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-white font-heading">Leaderboard</h2>
            <p className="text-xs text-white/40 mt-1">Top performers & schools</p>
          </div>
          <Link to="/school/leaderboard" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            View full <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Students */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Top Students</h3>
            <div className="space-y-3">
              {[
                { name: 'Sarah Johnson', points: 2450, rank: 0 },
                { name: 'Alex Chen', points: 2180, rank: 1 },
                { name: 'Maria Rodriguez', points: 1950, rank: 2 },
                { name: 'James Wilson', points: 1820, rank: 3 },
                { name: 'Emma Davis', points: 1650, rank: 4 },
              ].map((student, i) => {
                const rankBg = i === 0 ? 'border-amber-500/30 bg-amber-500/6' : i === 1 ? 'border-slate-400/20 bg-white/4' : i === 2 ? 'border-amber-700/20 bg-amber-700/4' : 'border-white/5';
                const rankIcon = i === 0 ? <Crown className="w-4 h-4 text-amber-400" /> : i === 1 ? <Medal className="w-4 h-4 text-slate-300" /> : i === 2 ? <Medal className="w-4 h-4 text-amber-600" /> : <span className="text-xs font-bold text-white/30">#{i + 1}</span>;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${rankBg} transition-all`}>
                    <div className="w-5 flex items-center justify-center">{rankIcon}</div>
                    <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                      {student.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{student.name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
                      <Star className="w-3 h-3" />
                      <span className="text-xs font-bold">{student.points}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Top Schools */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-cyan-400" /> Top Schools</h3>
            <div className="space-y-3">
              {[
                { name: 'MIT Innovation Hub', score: 8450, posts: 45, internships: 12, apps: 320, complete: 89 },
                { name: 'Stanford Academy', score: 7820, posts: 38, internships: 10, apps: 280, complete: 75 },
                { name: 'Harvard Institute', score: 7100, posts: 35, internships: 9, apps: 250, complete: 68 },
                { name: 'Yale Center', score: 6450, posts: 28, internships: 7, apps: 210, complete: 58 },
                { name: 'Princeton School', score: 5890, posts: 24, internships: 6, apps: 180, complete: 48 },
              ].map((school, i) => {
                const rankBg = i === 0 ? 'border-amber-500/30 bg-amber-500/6' : i === 1 ? 'border-slate-400/20 bg-white/4' : i === 2 ? 'border-amber-700/20 bg-amber-700/4' : 'border-white/5';
                const rankIcon = i === 0 ? <Crown className="w-4 h-4 text-amber-400" /> : i === 1 ? <Medal className="w-4 h-4 text-slate-300" /> : i === 2 ? <Medal className="w-4 h-4 text-amber-600" /> : <span className="text-xs font-bold text-white/30">#{i + 1}</span>;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${rankBg} transition-all`}>
                    <div className="w-5 flex items-center justify-center">{rankIcon}</div>
                    <div className="w-7 h-7 rounded-full bg-cyan-500/15 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{school.name}</p>
                      <p className="text-[10px] text-white/30">🔥 {school.posts} • 📋 {school.internships * 50} • 👥 {school.apps * 10} • ✅ {school.complete * 25}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
                      <Zap className="w-3 h-3" />
                      <span className="text-xs font-bold">{school.score}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Challenges */}
        <div className="lg:col-span-2 glass rounded-2xl border border-white/8 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white font-heading">Active Challenges</h2>
            <Link to="/school/challenges" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-white/4 animate-pulse" />)}
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-amber-400/40" />
              </div>
              <p className="text-white/40 text-sm">No active challenges</p>
              <p className="text-white/20 text-xs mt-1">Check back later for new incentive challenges</p>
            </div>
          ) : (
            <div className="space-y-3">
              {challenges.slice(0, 4).map((challenge, i) => (
                <motion.div key={challenge.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/4 border border-white/5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{challenge.title}</p>
                    {challenge.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{challenge.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      {challenge.deadline && <span className="text-[10px] text-white/30">Due {challenge.deadline}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{challenge.reward_type}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: quick actions + top courses */}
        <div className="space-y-4">
        <div className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-base font-semibold text-white font-heading mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Leaderboard', to: '/school/leaderboard', icon: '◆' },
            ].map(item => (
              <Link key={item.to} to={item.to} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white group">
                <span className="text-emerald-400">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}