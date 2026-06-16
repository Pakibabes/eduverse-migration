import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Trophy, Star, Medal, Crown, Building2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SchoolLeaderboard() {
  const [members, setMembers] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [schools, setSchools] = useState([]);
  const [posts, setPosts] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSchoolId, setCurrentSchoolId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (user) => {
      setCurrentUser(user);
      const schoolMembers = await base44.entities.SchoolMember.filter({
        user_id: user?.id,
        status: 'approved',
      });
      if (schoolMembers.length > 0) {
        setCurrentSchoolId(schoolMembers[0].school_id);
      }

      Promise.all([
        base44.entities.CommunityMember.list(),
        base44.entities.Community.list(),
        base44.entities.School.list(),
        base44.entities.Post.list(),
        base44.entities.Internship.list(),
      ]).then(([m, c, s, p, i]) => {
        setMembers(m);
        setCommunities(c);
        setSchools(s);
        setPosts(p);
        setInternships(i);
        setLoading(false);
      });
    });
  }, []);

  // Get students: if we know the school, filter to it; otherwise show all, deduplicated by user_id
  const schoolStudents = members
    .filter(m => {
      if (!currentSchoolId) return true;
      const community = communities.find(c => c.id === m.community_id);
      return community?.school_id === currentSchoolId;
    })
    .reduce((acc, m) => {
      const existing = acc.find(a => a.user_id === m.user_id);
      if (!existing) acc.push(m);
      else if ((m.points || 0) > (existing.points || 0)) {
        const idx = acc.indexOf(existing);
        acc[idx] = m;
      }
      return acc;
    }, [])
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  // Calculate school scores based on activity
  const schoolScores = schools.map(school => {
    const schoolCommunities = communities.filter(c => c.school_id === school.id);
    const schoolPostCount = posts.filter(p => schoolCommunities.some(c => c.id === p.community_id)).length;
    const schoolInternships = internships.filter(i => i.community_id === schoolCommunities[0]?.id);
    const internshipCreationPoints = schoolInternships.length * 50;
    const applicationsPoints = schoolInternships.reduce((sum, i) => sum + (i.applicant_count || 0) * 10, 0);
    const completionPoints = schoolInternships.reduce((sum, i) => sum + (i.enrolled_count || 0) * 25, 0);
    const postingPoints = schoolPostCount * 5;
    const totalScore = internshipCreationPoints + applicationsPoints + completionPoints + postingPoints;

    return {
      id: school.id,
      name: school.name,
      score: totalScore,
      details: { postingPoints, internshipCreationPoints, applicationsPoints, completionPoints },
    };
  }).sort((a, b) => b.score - a.score);

  const rankIcon = (i) => {
    if (i === 0) return <Crown className="w-5 h-5 text-amber-400" />;
    if (i === 1) return <Medal className="w-5 h-5 text-slate-300" />;
    if (i === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-white/30">#{i + 1}</span>;
  };

  const rankBg = (i) => {
    if (i === 0) return 'border-amber-500/30 bg-amber-500/6';
    if (i === 1) return 'border-slate-400/20 bg-white/4';
    if (i === 2) return 'border-amber-700/20 bg-amber-700/4';
    return 'border-white/5';
  };

  const getDisplayData = () => {
    if (tab === 'students') return schoolStudents;
    if (tab === 'schools') return schoolScores;
    // All tab combines both
    return { students: schoolStudents, schools: schoolScores };
  };

  return (
    <div className="p-8">
      <PageHeader title="Leaderboard" subtitle="Top students and schools in your network" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/8">
        {['all', 'students', 'schools'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === t
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            {t === 'all' ? 'All' : t === 'students' ? 'Students' : 'Schools'}
          </button>
        ))}
      </div>

      {/* Content based on tab */}
      {tab === 'students' && (
        <>
          {/* Podium for top 3 students */}
          {schoolStudents.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-8">
              {[schoolStudents[1], schoolStudents[0], schoolStudents[2]].map((member, podiumIdx) => {
                const heights = ['h-24', 'h-32', 'h-20'];
                const idx = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
                return (
                  <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: podiumIdx * 0.1 }}
                    className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg font-bold text-emerald-400">
                      {(member.user_name || '?')[0]?.toUpperCase()}
                    </div>
                    <p className="text-xs font-medium text-white/70">{member.user_name || 'Unknown'}</p>
                    <p className="text-xs text-amber-400 flex items-center gap-0.5"><Star className="w-3 h-3" />{member.points || 0}</p>
                    <div className={`w-20 ${heights[podiumIdx]} rounded-t-xl flex items-start justify-center pt-2 ${idx === 0 ? 'bg-amber-500/20 border border-amber-500/30' : idx === 1 ? 'bg-slate-500/15 border border-slate-500/20' : 'bg-amber-700/15 border border-amber-700/20'}`}>
                      {rankIcon(idx)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="divide-y divide-white/4">
              {loading ? (
                <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />)}</div>
              ) : schoolStudents.map((member, i) => (
                <motion.div key={member.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 px-5 py-4 border ${rankBg(i)} transition-all`}>
                  <div className="w-8 flex items-center justify-center">{rankIcon(i)}</div>
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-sm font-bold text-emerald-400">
                    {(member.user_name || '?')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{member.user_name || 'Unknown'}</p>
                    <p className="text-xs text-white/30">{communities.find(c => c.id === member.community_id)?.name || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-bold">{(member.points || 0).toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
              {!loading && schoolStudents.length === 0 && (
                <div className="py-16 text-center"><Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No students yet</p></div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'schools' && (
        <>
          {schoolScores.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-8">
              {[schoolScores[1], schoolScores[0], schoolScores[2]].map((school, podiumIdx) => {
                const heights = ['h-24', 'h-32', 'h-20'];
                const idx = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
                return (
                  <motion.div key={school.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: podiumIdx * 0.1 }}
                    className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-lg font-bold text-cyan-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-white/70 text-center max-w-[80px]">{school.name}</p>
                    <p className="text-xs text-amber-400 flex items-center gap-0.5"><Zap className="w-3 h-3" />{school.score}</p>
                    <div className={`w-20 ${heights[podiumIdx]} rounded-t-xl flex items-start justify-center pt-2 ${idx === 0 ? 'bg-amber-500/20 border border-amber-500/30' : idx === 1 ? 'bg-slate-500/15 border border-slate-500/20' : 'bg-amber-700/15 border border-amber-700/20'}`}>
                      {rankIcon(idx)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="divide-y divide-white/4">
              {loading ? (
                <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />)}</div>
              ) : schoolScores.map((school, i) => (
                <motion.div key={school.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 px-5 py-4 border ${rankBg(i)} transition-all`}>
                  <div className="w-8 flex items-center justify-center">{rankIcon(i)}</div>
                  <div className="w-9 h-9 rounded-full bg-cyan-500/15 flex items-center justify-center text-sm font-bold text-cyan-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{school.name}</p>
                    <p className="text-xs text-white/30">🔥 {school.details.postingPoints} posts • 📋 {school.details.internshipCreationPoints} internships • 👥 {school.details.applicationsPoints} applicants • ✅ {school.details.completionPoints} completions</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-bold">{school.score.toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
              {!loading && schoolScores.length === 0 && (
                <div className="py-16 text-center"><Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No schools with activity yet</p></div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'all' && (
        <>
          {/* Students Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white font-heading mb-4">Top Students</h2>
            <div className="glass rounded-2xl border border-white/8 overflow-hidden">
              <div className="divide-y divide-white/4">
                {loading ? (
                  <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />)}</div>
                ) : schoolStudents.length === 0 ? (
                  <div className="py-12 text-center"><Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No students yet</p></div>
                ) : schoolStudents.slice(0, 5).map((member, i) => (
                  <motion.div key={member.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-4 px-5 py-4 border ${rankBg(i)} transition-all`}>
                    <div className="w-8 flex items-center justify-center">{rankIcon(i)}</div>
                    <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-sm font-bold text-emerald-400">
                      {(member.user_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{member.user_name || 'Unknown'}</p>
                      <p className="text-xs text-white/30">{communities.find(c => c.id === member.community_id)?.name || '—'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-bold">{(member.points || 0).toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Schools Section */}
          <div>
            <h2 className="text-lg font-bold text-white font-heading mb-4">Top Schools</h2>
            <div className="glass rounded-2xl border border-white/8 overflow-hidden">
              <div className="divide-y divide-white/4">
                {loading ? (
                  <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />)}</div>
                ) : schoolScores.length === 0 ? (
                  <div className="py-12 text-center"><Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No schools yet</p></div>
                ) : schoolScores.slice(0, 5).map((school, i) => (
                  <motion.div key={school.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-4 px-5 py-4 border ${rankBg(i)} transition-all`}>
                    <div className="w-8 flex items-center justify-center">{rankIcon(i)}</div>
                    <div className="w-9 h-9 rounded-full bg-cyan-500/15 flex items-center justify-center text-sm font-bold text-cyan-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{school.name}</p>
                      <p className="text-xs text-white/30">🔥 {school.details.postingPoints} • 📋 {school.details.internshipCreationPoints} • 👥 {school.details.applicationsPoints} • ✅ {school.details.completionPoints}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-bold">{school.score.toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}