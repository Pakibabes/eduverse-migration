import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Star, Award, Trophy, Gift, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function StudentAchievements() {
  const [rewards, setRewards] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const [rw, cert] = await Promise.all([
        base44.entities.Reward.filter({ user_id: user.id }),
        base44.entities.Certificate.filter({ user_id: user.id }),
      ]);
      setRewards(rw);
      setCertificates(cert);
      setLoading(false);
    };
    load();
  }, []);

  const displayed =
    activeTab === 'rewards' ? rewards
    : activeTab === 'certificates' ? certificates
    : [...rewards, ...certificates];

  return (
    <div className="p-8">
      <PageHeader
        title="My Achievements"
        subtitle="Your earned rewards and certificates"
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { label: 'All', value: 'all', count: rewards.length + certificates.length },
          { label: 'Rewards', value: 'rewards', count: rewards.length },
          { label: 'Certificates', value: 'certificates', count: certificates.length },
        ].map(tab => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.value
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'bg-white/5 text-white/60 hover:bg-white/8 border border-white/10'}`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Trophy className="w-12 h-12 text-violet-500/15 mx-auto mb-4" />
          <p className="text-white/40 text-sm">No achievements yet</p>
          <p className="text-white/20 text-xs mt-1">Complete internships and milestones to earn rewards</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((item, i) => {
            const isCert = !!item.certificate_url || !!item.credential_id || !!item.issue_date;
            const Icon = isCert ? Award : Gift;
            const color = isCert ? { bg: 'bg-emerald-500/15', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' }
              : { bg: 'bg-amber-500/15', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' };

            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl border border-white/8 p-5 hover:border-violet-500/20 transition-all flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${color.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${color.badge}`}>
                        {isCert ? 'Certificate' : 'Reward'}
                      </span>
                    </div>
                    {item.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{item.description}</p>}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-white/40">
                  {item.points > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-400 font-semibold">{item.points} pts</span>
                    </div>
                  )}
                  {(item.issue_date || item.earned_date) && (
                    <p>Earned {format(new Date(item.issue_date || item.earned_date), 'MMM dd, yyyy')}</p>
                  )}
                  {item.credential_id && <p className="font-mono text-[10px]">ID: {item.credential_id}</p>}
                </div>

                {item.certificate_url && (
                  <a href={item.certificate_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all">
                    <ExternalLink className="w-3 h-3" /> View Certificate
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}