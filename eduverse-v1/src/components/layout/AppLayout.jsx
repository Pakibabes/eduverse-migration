import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout({ onWorkspaceChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive workspace from URL so it's always in sync
  const workspace = location.pathname === '/admin' || location.pathname.startsWith('/admin/')
    ? 'admin'
    : location.pathname.startsWith('/student')
    ? 'student'
    : 'school';

  const handleWorkspaceChange = (ws) => {
    if (onWorkspaceChange) onWorkspaceChange(ws);
    if (ws === 'admin') navigate('/admin');
    else if (ws === 'school') navigate('/school');
    else navigate('/student');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar workspace={workspace} onWorkspaceChange={handleWorkspaceChange} />
      <main className="flex-1 ml-56 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}