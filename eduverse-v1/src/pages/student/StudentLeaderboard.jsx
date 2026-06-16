import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Trophy, Star, Crown, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentLeaderboard() {
  const [communities, setCommunities] = useState([]);
  const [selected, setSelected] = useState('global');
  const [timeframe, setTimeframe] = useState('all');
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Community.list(),
      base44.entities.CommunityMember.list(),
      base44.auth.me(),
    ]).then(([comms, allMembers, user]) => {
      setCommunities(comms);
      setCurrentUser(user);
      const sorted = allMembers.sort((a, b) => (b.points || 0) - (a.points || 0));
      setMembers(sorted);
      setLoading(false);
    });
  }, []);

  // Filter by selected community
  const filteredMembers = selected === 'global'
    ? members
    : members.filter(m => m.community_id === selected);

  const myRank = currentUser
    ? filteredMembers.findIndex(m => m.user_id === currentUser.id) + 1
    : 0;
  const myMember = currentUser
    ? filteredMembers.find(m => m.user_id === currentUser.id)
    : null;

  return (
    <div className="p-8">
      <PageHeader title="Leaderboard" subtitle="Compete and earn your rank" />

      {/* My rank highlight */}
      {currentUser && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 rounded-2xl border border-violet-500/20 flex items-center gap-5"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,238,0.05))' }}>
          <div className="w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center text-2xl font-bold text-violet-400">
            {currentUser.full_name?.[0] || 'Y'}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold font-heading">Your Position</p>
            <p className="text-xs text-white/40">Keep earning points to climb the ranks</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-heading text-white">#{myRank || '—'}</p>
            <p className="text-xs text-amber-400 flex items-center gap-1 justify-end">
              <Star className="w-3 h-3" />{myMember?.points?.toLocaleString() || 0} pts
            </p>
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8">
          <button onClick={() => setSelected('global')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selected === 'global' ? 'bg-violet-500/20 text-violet-400' : 'text-white/40 hover:text-white/60'}`}>All</button>
          {communities.slice(0, 3).map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selected === c.id ? 'bg-violet-500/20 text-violet-400' : 'text-white/40 hover:text-white/60'}`}>{c.name}</button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8">
          {['all', 'weekly', 'monthly'].map(t => (
            <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${timeframe === t ? 'bg-violet-500/20 text-violet-400' : 'text-white/40 hover:text-white/60'}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      {filteredMembers.length > 0 && (
        <div className="flex items-end justify-center gap-6 mb-8">
          {[filteredMembers[1], filteredMembers[0], filteredMembers[2]].filter(Boolean).map((m, pi) => {
            const isMe = currentUser && m.user_id === currentUser.id;
            // pi: 0=2nd place, 1=1st place, 2=3rd place
            const rank = pi === 0 ? 2 : pi === 1 ? 1 : 3;
            const heights = ['h-24', 'h-32', 'h-20'];
            const colors = [
              'bg-slate-400/20 border-slate-400/20',
              'bg-amber-500/20 border-amber-500/30',
              'bg-amber-700/15 border-amber-700/20',
            ];
            const icons = [
              <Medal className="w-5 h-5 text-slate-300" key="s" />,
              <Crown className="w-5 h-5 text-amber-400" key="c" />,
              <Medal className="w-5 h-5 text-amber-600" key="b" />,
            ];
            const name = m.user_name || 'Unknown';
            const initial = name[0] || '?';
            return (
              <motion.div key={m.id || name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.1 }}
                className="flex flex-col items-center gap-2">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${isMe ? 'bg-violet-500/20 text-violet-400' : 'bg-white/8 text-white/60'}`}>
                  {initial}
                </div>
                <p className="text-xs font-medium text-white/70 text-center max-w-[80px] truncate">{name}</p>
                <p className="text-[10px] text-amber-400 flex items-center gap-0.5">
                  <Star className="w-3 h-3" />{(m.points || 0).toLocaleString()}
                </p>
                <div className={`w-20 ${heights[pi]} rounded-t-xl border flex items-start justify-center pt-2 ${colors[pi]}`}>
                  {icons[pi]}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-lg bg-white/4 animate-pulse" />)}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No members yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {filteredMembers.map((m, i) => {
              const isMe = currentUser && m.user_id === currentUser.id;
              const name = m.user_name || 'Unknown';
              const initial = name[0] || '?';
              return (
                <motion.div key={m.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 px-5 py-4 transition-all ${isMe ? 'bg-violet-500/8 border-l-2 border-violet-500' : 'hover:bg-white/3'}`}>
                  <div className="w-8 text-center">
                    {i < 3 ? ['🥇','🥈','🥉'][i] : <span className="text-sm font-bold text-white/20">#{i+1}</span>}
                  </div>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${isMe ? 'bg-violet-500/20 text-violet-400' : 'bg-white/8 text-white/50'}`}>
                    {initial}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isMe ? 'text-violet-300' : 'text-white'}`}>{name}</p>
                    <p className="text-[10px] text-white/25">Community Member</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
                    <Star className="w-3.5 h-3.5" />{(m.points || 0).toLocaleString()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}