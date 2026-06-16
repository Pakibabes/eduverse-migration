import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Clock, Users, ArrowRight, BookmarkPlus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '@/components/ui/GlassButton';
import { ApplicationStatusBadge } from '@/components/internship/ApplyWizard';
import { useNavigate } from 'react-router-dom';

export default function StudentInternships() {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('available');
  const [currentUser, setCurrentUser] = useState(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

      const [allInternships, schoolMembers, apps, allCohorts, allApps] = await Promise.all([
        base44.entities.Internship.list(),
        isAdmin ? Promise.resolve([]) : base44.entities.SchoolMember.filter({ user_id: user?.id, status: 'approved' }),
        base44.entities.InternshipApplication.filter({ student_id: user?.id }),
        base44.entities.InternshipCohort.list(),
        base44.entities.InternshipApplication.list(),
      ]);

      // Build a live applicant count map
      const applicantCountMap = {};
      allApps.forEach(a => {
        applicantCountMap[a.internship_id] = (applicantCountMap[a.internship_id] || 0) + 1;
      });
      // Patch internships with live counts
      allInternships.forEach(i => {
        if (applicantCountMap[i.id] !== undefined) {
          i.applicant_count = applicantCountMap[i.id];
        }
      });

      setApplications(apps);

      let filteredInternships = allInternships;

      if (!isAdmin) {
        const schoolIds = schoolMembers.map(sm => sm.school_id);
        if (schoolIds.length > 0) {
          // De-duplication logic: For each cohort, prioritize school-specific over global
          const deduplicatedBySchool = new Map();
          
          // First pass: collect all cohort-linked internships
          const cohortMap = new Map(allCohorts.map(c => [c.id, c]));
          
          // Group internships by cohort
          allInternships.forEach(intern => {
            if (intern.cohort_id) {
              const key = intern.cohort_id;
              if (!deduplicatedBySchool.has(key)) {
                deduplicatedBySchool.set(key, []);
              }
              deduplicatedBySchool.get(key).push(intern);
            }
          });

          // For each cohort, pick school-specific or fallback to global
          const selectedInternships = [];
          deduplicatedBySchool.forEach((cohortInternships) => {
            const schoolSpecific = cohortInternships.find(i => schoolIds.includes(i.community_id));
            if (schoolSpecific) {
              selectedInternships.push(schoolSpecific);
            } else {
              // Show global if no school-specific exists
              selectedInternships.push(cohortInternships[0]);
            }
          });

          // Also include non-cohort internships in user's schools
          const nonCohortInternships = allInternships.filter(
            i => !i.cohort_id && schoolIds.includes(i.community_id)
          );

          filteredInternships = [...selectedInternships, ...nonCohortInternships];
        } else {
          filteredInternships = [];
        }
      }

      setInternships(filteredInternships);
      setLoading(false);
    };
    load();
  }, []);

  const getApplication = (internshipId) => applications.find(a => a.internship_id === internshipId);

  const filteredInternships = internships
    .filter(i => {
      if (filter === 'available') return i.status === 'active' || i.status === 'draft';
      if (filter === 'active') return i.status === 'full';
      if (filter === 'closed') return i.status === 'closed';
      return true;
    })
    .filter(i =>
      i.title?.toLowerCase().includes(search.toLowerCase()) ||
      i.position_title?.toLowerCase().includes(search.toLowerCase())
    );

  const myApplications = applications.filter(a => a.status !== 'rejected');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-white">Internship Opportunities</h1>
        <p className="text-sm text-white/40 mt-1">Browse and apply for available internship programs</p>
      </div>

      {/* My Applications summary */}
      {myApplications.length > 0 && (
        <div className="mb-6 glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">My Applications</h2>
          <div className="space-y-2">
            {myApplications.map(app => {
              const intern = internships.find(i => i.id === app.internship_id);
              if (!intern) return null;
              return (
                <div key={app.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/4 hover:bg-white/6 transition-all cursor-pointer"
                  onClick={() => navigate(`/student/internships/${intern.id}`)}>
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{intern.title || intern.position_title}</p>
                    <p className="text-xs text-white/30">{app.applied_date}</p>
                  </div>
                  <ApplicationStatusBadge status={app.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search internships..."
          className="w-full bg-black/30 border border-violet-500/20 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60 transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-0 mb-6 border-b border-white/8">
        {['available', 'active', 'closed'].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-3 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${filter === t ? 'border-violet-400 text-violet-300' : 'border-transparent text-white/40 hover:text-white/70'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : filteredInternships.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <BookmarkPlus className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-base">No internships found</p>
          <p className="text-white/20 text-sm mt-1">Check back later for more opportunities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredInternships.map((intern, i) => {
              const app = getApplication(intern.id);
              return (
                <motion.div
                  key={intern.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass rounded-2xl border border-white/8 p-6 hover:border-violet-500/20 transition-all group flex flex-col cursor-pointer"
                  onClick={() => navigate(`/student/internships/${intern.id}`)}
                >
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">{intern.company_name}</p>
                        <h3 className="text-lg font-bold text-white mt-1 font-heading">{intern.title || intern.position_title}</h3>
                      </div>
                      {app && <ApplicationStatusBadge status={app.status} />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-white/6">
                    {intern.total_hours && (
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Clock className="w-3.5 h-3.5 text-white/30" />
                        <span>{intern.total_hours}h</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Users className="w-3.5 h-3.5 text-white/30" />
                      <span>{intern.applicant_count || 0} applied</span>
                    </div>
                  </div>

                  {intern.description && (
                    <p className="text-xs text-white/60 mb-4 line-clamp-2">{intern.description}</p>
                  )}

                  <div className="mt-auto">
                    <div className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all
                      ${app
                        ? 'border border-violet-500/30 text-violet-300 hover:bg-violet-500/10'
                        : 'bg-violet-500/15 border border-violet-500/25 text-violet-300 hover:bg-violet-500/25'}`}>
                      {app ? 'View Application' : 'View & Apply'} <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}