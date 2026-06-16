import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import GlassButton from '@/components/ui/GlassButton';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const typeIcon = { reply: '💬', new_course: '📚', community_added: '🌐', quiz_passed: '🏆', points_earned: '⭐' };
const typeColor = {
  reply: 'border-cyan-500/20 bg-cyan-500/5',
  new_course: 'border-violet-500/20 bg-violet-500/5',
  community_added: 'border-emerald-500/20 bg-emerald-500/5',
  quiz_passed: 'border-amber-500/20 bg-amber-500/5',
  points_earned: 'border-amber-500/20 bg-amber-500/5',
};

export default function SchoolNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Notification.list('-created_date', 50).then(n => { setNotifications(n); setLoading(false); });
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-8">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notifications`}
        action={unreadCount > 0 && <GlassButton variant="secondary" onClick={markAllRead}><CheckCheck className="w-4 h-4" />Mark all read</GlassButton>}
      />

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-white/4 animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/30">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => (
            <motion.div key={notif.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${typeColor[notif.type] || 'border-white/6 bg-white/3'} ${!notif.is_read ? 'ring-1 ring-white/10' : 'opacity-60'}`}>
              <span className="text-2xl">{typeIcon[notif.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{notif.title}</p>
                <p className="text-xs text-white/40 mt-0.5">{notif.message}</p>
                <p className="text-[10px] text-white/20 mt-1.5">{new Date(notif.created_date).toLocaleString()}</p>
              </div>
              {!notif.is_read && (
                <button onClick={() => markRead(notif.id)} className="flex-shrink-0 text-white/30 hover:text-white transition-colors">
                  <Check className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}