import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useState } from 'react';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminInternships from '@/pages/admin/AdminInternships';
import AdminSchools from '@/pages/admin/AdminSchools';
import AdminInviteLinks from '@/pages/admin/AdminInviteLinks';
import AdminUsers from '@/pages/admin/AdminUsers';
import SchoolInternshipDetail from '@/pages/admin/SchoolInternshipDetail';

// School pages
import SchoolOverview from '@/pages/school/SchoolOverview';
import SchoolCommunities from '@/pages/school/SchoolCommunities';
import SchoolCourses from '@/pages/school/SchoolCourses';
import SchoolMembers from '@/pages/school/SchoolMembers';
import SchoolInternships from '@/pages/school/SchoolInternships';
import SchoolInternshipProgram from '@/pages/school/SchoolInternshipProgram';
import SchoolChallenges from '@/pages/school/SchoolChallenges';
import SchoolAchievements from '@/pages/school/SchoolAchievements';
import AdminChallenges from '@/pages/admin/AdminChallenges';
import AdminEvents from '@/pages/admin/AdminEvents';
import SchoolEvents from '@/pages/school/SchoolEvents';
import SchoolLeaderboard from '@/pages/school/SchoolLeaderboard';
import SchoolRevenue from '@/pages/school/SchoolRevenue';
import SchoolNotifications from '@/pages/school/SchoolNotifications';
import SchoolSettings from '@/pages/school/SchoolSettings';
import CourseBuilder from '@/pages/school/CourseBuilder';
import CourseTemplates from '@/pages/school/CourseTemplates';
import CommunityEditor from '@/pages/school/CommunityEditor';

// Auth & Public pages
import InternshipSignup from '@/pages/InternshipSignup';

// Student pages
import StudentOverview from '@/pages/student/StudentOverview';
import StudentCommunities from '@/pages/student/StudentCommunities';
import StudentCourses from '@/pages/student/StudentCourses';
import StudentInternships from '@/pages/student/StudentInternships';
import StudentLeaderboard from '@/pages/student/StudentLeaderboard';
import StudentNotifications from '@/pages/student/StudentNotifications';
import StudentProfile from '@/pages/student/StudentProfile';
import StudentAchievements from '@/pages/student/StudentAchievements';
import StudentChallenges from '@/pages/student/StudentChallenges.jsx';
import StudentCourseDetail from '@/pages/student/StudentCourseDetail';
import EducationInternshipDetail from '@/pages/student/EducationInternshipDetail';
import StudentInternshipDetail from '@/pages/student/StudentInternshipDetail';

function WorkspaceRouter() {
  const [workspace, setWorkspace] = useState('school');

  const handleWorkspaceChange = (ws) => {
    setWorkspace(ws);
  };

  return (
    <Routes>
      {/* Public signup page */}
      <Route path="/internship-signup" element={<InternshipSignup />} />

      <Route element={<AppLayout workspace={workspace} onWorkspaceChange={handleWorkspaceChange} />}>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/internships" element={<AdminInternships />} />
        <Route path="/admin/internships/:id" element={<SchoolInternshipDetail />} />
        <Route path="/admin/schools" element={<AdminSchools />} />
        <Route path="/admin/invite-links" element={<AdminInviteLinks />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/communities" element={<SchoolCommunities />} />
        <Route path="/admin/communities/:id" element={<CommunityEditor />} />
        <Route path="/admin/courses" element={<SchoolCourses />} />
        <Route path="/admin/courses/builder" element={<CourseBuilder />} />
        <Route path="/admin/courses/builder/:id" element={<CourseBuilder />} />
        <Route path="/admin/templates" element={<CourseTemplates />} />
        <Route path="/admin/members" element={<SchoolMembers />} />
        <Route path="/admin/revenue" element={<SchoolRevenue />} />
        <Route path="/admin/challenges" element={<AdminChallenges />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/settings" element={<SchoolSettings />} />

        {/* School routes */}
        <Route path="/school" element={<SchoolOverview />} />
        <Route path="/school/internships" element={<SchoolInternships />} />
        <Route path="/school/internships/:id" element={<SchoolInternshipProgram />} />
        <Route path="/school/challenges" element={<SchoolChallenges />} />
        <Route path="/school/events" element={<SchoolEvents />} />
        <Route path="/school/achievements" element={<SchoolAchievements />} />
        <Route path="/school/leaderboard" element={<SchoolLeaderboard />} />
        <Route path="/school/revenue" element={<SchoolRevenue />} />
        <Route path="/school/notifications" element={<SchoolNotifications />} />
        <Route path="/school/settings" element={<SchoolSettings />} />

        {/* Student routes */}
        <Route path="/student" element={<StudentOverview />} />
        <Route path="/student/communities" element={<StudentCommunities />} />
        <Route path="/student/courses" element={<StudentCourses />} />
        <Route path="/student/internships" element={<StudentInternships />} />
        <Route path="/student/internships/:id" element={<StudentInternshipDetail />} />
        <Route path="/student/courses/:id" element={<StudentCourseDetail />} />
        <Route path="/student/challenges" element={<StudentChallenges />} />
        <Route path="/student/leaderboard" element={<StudentLeaderboard />} />
        <Route path="/student/notifications" element={<StudentNotifications />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/achievements" element={<StudentAchievements />} />

        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-white/30 text-sm">Loading EduVerse...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return <WorkspaceRouter />;
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;