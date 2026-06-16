import { Link, useLocation } from 'react-router-dom';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { motion } from 'framer-motion';

const adminNav = [
  { label: 'Overview', icon: '⬡', path: '/admin' },
  { label: 'Communities', icon: '◈', path: '/admin/communities' },
  { label: 'Courses', icon: '◫', path: '/admin/courses' },
  { label: 'Templates', icon: '◧', path: '/admin/templates' },
  { label: 'Schools', icon: '◎', path: '/admin/schools' },
  { label: 'Invite Links', icon: '🔗', path: '/admin/invite-links' },
  { label: 'Users', icon: '👥', path: '/admin/users' },
  { label: 'Internships', icon: '◉', path: '/admin/internships' },
  { label: 'Revenue', icon: '◈', path: '/admin/revenue' },
  { label: 'Challenges', icon: '🏆', path: '/admin/challenges' },
  { label: 'Events', icon: '📅', path: '/admin/events' },
  { label: 'Settings', icon: '◌', path: '/admin/settings' },
];

const schoolNav = [
  { label: 'Overview', icon: '⬡', path: '/school' },
  { label: 'Internships', icon: '◎', path: '/school/internships' },
  { label: 'Challenges', icon: '🏆', path: '/school/challenges' },
  { label: 'Events', icon: '📅', path: '/school/events' },
  { label: 'Achievements', icon: '🥇', path: '/school/achievements' },
  { label: 'Leaderboard', icon: '◆', path: '/school/leaderboard' },
  { label: 'Notifications', icon: '◉', path: '/school/notifications' },
];

const studentNav = [
  { label: 'Overview', icon: '⬡', path: '/student' },
  { label: 'My Communities', icon: '◈', path: '/student/communities' },
  { label: 'Courses', icon: '◫', path: '/student/courses' },
  { label: 'Internships', icon: '◉', path: '/student/internships' },
  { label: 'Challenges', icon: '🏆', path: '/student/challenges' },
  { label: 'Leaderboard', icon: '◆', path: '/student/leaderboard' },
  { label: 'Achievements', icon: '★', path: '/student/achievements' },
  { label: 'Notifications', icon: '◉', path: '/student/notifications', badge: 3 },
  { label: 'Profile', icon: '◎', path: '/student/profile' },
];

export default function Sidebar({ workspace, onWorkspaceChange }) {
  const location = useLocation();
  const isSchool = workspace === 'school';
  const isAdmin = workspace === 'admin';
  const navItems = isAdmin ? adminNav : isSchool ? schoolNav : studentNav;
  const activeColor = isAdmin ? 'amber' : isSchool ? 'emerald' : 'violet';

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-56 flex flex-col z-40 border-r border-white/5"
      style={{ background: 'rgba(8, 12, 28, 0.98)' }}>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${isAdmin ? 'bg-amber-500 text-black' : isSchool ? 'bg-emerald-500 text-black' : 'bg-violet-500 text-white'}`}>
          {isAdmin ? 'A' : isSchool ? 'S' : 'E'}
        </div>
        <div>
          <p className="text-sm font-bold text-white font-heading">EduVerse</p>
          <p className="text-[10px] text-white/30">{isAdmin ? 'Admin workspace' : isSchool ? 'School workspace' : 'Education workspace'}</p>
        </div>
      </div>

      {/* Workspace Switcher */}
      <WorkspaceSwitcher current={workspace} onChange={onWorkspaceChange} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                ${active
                  ? isAdmin
                    ? 'bg-amber-500/12 text-amber-400'
                    : isSchool
                      ? 'bg-emerald-500/12 text-emerald-400'
                      : 'bg-violet-500/12 text-violet-400'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/4'
                }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full ${isAdmin ? 'bg-amber-400' : isSchool ? 'bg-emerald-400' : 'bg-violet-400'}`}
                />
              )}
              <span className="text-base leading-none">{item.icon}</span>
              <span className="flex-1 font-body text-[13px]">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isAdmin ? 'bg-amber-500/20 text-amber-400' : isSchool ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-500/20 text-violet-400'}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user area */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isAdmin ? 'bg-amber-500/20 text-amber-400' : isSchool ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-500/20 text-violet-400'}`}>
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/70 truncate">You</p>
            <p className="text-[10px] text-white/30 truncate">{isAdmin ? 'Platform Admin' : isSchool ? 'Instructor' : 'Learner'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}