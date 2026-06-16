import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Calendar, Clock, Users, Target, FileText, CheckCircle,
  Video, ExternalLink, Upload, Loader2, ArrowRight, Shield, Flag,
  User, Briefcase, MapPin, ChevronRight, Lock, BookOpen, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';
import { ApplicationStatusBadge, ApplicationStatusTimeline } from '@/components/internship/ApplyWizard';
import ITApplicationWizard from '@/components/internship/ITApplicationWizard';
import StudentMilestonesTab from '@/components/internship/StudentMilestonesTab';
import CourseProgressCard from '@/components/student/CourseProgressCard';

function safeDate(dateStr, fmt = 'MMM dd, yyyy') {
  if (!dateStr) return null;
  try { return format(parse(dateStr, 'yyyy-MM-dd', new Date()), fmt); } catch { return dateStr; }
}

const STATUS_STYLE = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  draft: 'bg-white/8 text-white/40 border-white/10',
  closed: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  full: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
};

export default function StudentInternshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [internship, setInternship] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [career, setCareer] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [application, setApplication] = useState(null);

  // Application form state
  const [profile, setProfile] = useState({ phone: '', country: '', city: '', linkedin_url: '', resume_url: '', resume_file_name: '', bio: '' });
  const [coverNote, setCoverNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applyStep, setApplyStep] = useState('profile'); // 'profile' | 'review'

  // Enrollment & Onboarding course state
  const [enrollmentCourse, setEnrollmentCourse] = useState(null);
  const [onboardingCourse, setOnboardingCourse] = useState(null);
  const [enrollmentProgress, setEnrollmentProgress] = useState(null);
  const [onboardingProgress, setOnboardingProgress] = useState(null);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [internships, allMilestones, allSchools, allCareers, profiles, apps] = await Promise.all([
        base44.entities.Internship.list(),
        base44.entities.InternshipMilestone.filter({ internship_id: id }),
        base44.entities.School.list(),
        base44.entities.CareerCategory.list(),
        base44.entities.UserProfile.filter({ user_id: user?.id }),
        base44.entities.InternshipApplication.filter({ internship_id: id, student_id: user?.id }),
      ]);

      const intern = internships.find(i => i.id === id);
      setInternship(intern);
      setMilestones(allMilestones);

      if (intern) {
        setSchool(allSchools.find(s => s.id === intern.community_id) || null);
        setCareer(allCareers.find(c => c.id === intern.career_category_id) || null);
      }

      const savedProfile = profiles[0] || null;
      setUserProfile(savedProfile);
      if (savedProfile) {
        setProfile({
          phone: savedProfile.phone || '',
          country: savedProfile.country || '',
          city: savedProfile.city || '',
          linkedin_url: savedProfile.linkedin_url || '',
          resume_url: savedProfile.resume_url || '',
          resume_file_name: savedProfile.resume_file_name || '',
          bio: savedProfile.bio || '',
        });
      }

      if (apps.length > 0) {
        setApplication(apps[0]);
        setTab('apply');
      }

      setLoading(false);
    };
    load();
  }, [id]);

  // Load enrollment & onboarding course data
  useEffect(() => {
    if (!internship || !currentUser) return;
    const loadCourses = async () => {
      // Enrollment course
      if (internship.enrollment_course_id) {
        try {
          const [course, progressList] = await Promise.all([
            base44.entities.Course.get(internship.enrollment_course_id),
            base44.entities.CourseProgress.filter({ course_id: internship.enrollment_course_id }),
          ]);
          setEnrollmentCourse(course);
          setEnrollmentProgress(progressList.find(p => p.user_id === currentUser.id) || null);
        } catch { /* course may not exist */ }
      }

      // Onboarding course via SchoolOnboarding mapping
      if (internship.career_category_id && internship.community_id) {
        try {
          const onboardings = await base44.entities.SchoolOnboarding.filter({
            category_id: internship.career_category_id,
            school_id: internship.community_id,
          });
          if (onboardings.length > 0 && onboardings[0].course_id) {
            const [course, progressList] = await Promise.all([
              base44.entities.Course.get(onboardings[0].course_id),
              base44.entities.CourseProgress.filter({ course_id: onboardings[0].course_id }),
            ]);
            setOnboardingCourse(course);
            setOnboardingProgress(progressList.find(p => p.user_id === currentUser.id) || null);
          }
        } catch { /* course may not exist */ }
      }
    };
    loadCourses();
  }, [internship, currentUser]);

  const handleResumeUpload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfile(p => ({ ...p, resume_url: file_url, resume_file_name: file.name }));
    setUploading(false);
    toast.success('Resume uploaded');
  };

  const handleSubmitApplication = async () => {
    if (!profile.resume_url) { toast.error('Please upload your resume first'); return; }
    setSubmitting(true);

    // Save/update profile
    if (userProfile?.id) {
      await base44.entities.UserProfile.update(userProfile.id, profile);
    } else {
      await base44.entities.UserProfile.create({ ...profile, user_id: currentUser.id });
    }

    // Match interview link
    const interviewLinks = await base44.entities.InternshipInterviewLink.filter({ internship_id: id });
    const matched = interviewLinks.find(l => l.country === profile.country && l.career_category_id === internship.career_category_id)
      || interviewLinks.find(l => l.country === profile.country)
      || interviewLinks.find(l => l.career_category_id === internship.career_category_id)
      || interviewLinks[0];

    const app = await base44.entities.InternshipApplication.create({
      internship_id: id,
      student_id: currentUser.id,
      student_name: currentUser.full_name,
      student_email: currentUser.email,
      resume_url: profile.resume_url,
      resume_file_name: profile.resume_file_name,
      cover_note: coverNote,
      status: matched ? 'pending_interview' : 'applied',
      interview_url: matched?.wedge_interview_url || '',
      applied_date: format(new Date(), 'yyyy-MM-dd'),
    });

    setApplication(app);
    setSubmitting(false);
    toast.success('Application submitted!');
  };

  const handleMarkInterviewDone = async () => {
    setSubmitting(true);
    const updated = await base44.entities.InternshipApplication.update(application.id, {
      status: 'interview_completed',
      interview_completed_at: format(new Date(), 'yyyy-MM-dd'),
    });
    setApplication(updated);
    toast.success('Interview marked as complete!');
    setSubmitting(false);
  };

  const isEnrollmentUnlocked = !!application;
  const isOnboardingUnlocked = application?.status === 'accepted';

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'apply', label: application ? 'My Application' : 'Apply Now' },
    { id: 'enrollment', label: 'Enrollment', locked: !isEnrollmentUnlocked },
    { id: 'onboarding', label: 'Onboarding', locked: !isOnboardingUnlocked },
    { id: 'milestones', label: 'Milestones' },
  ];

  if (loading) return (
    <div className="p-8 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/4 animate-pulse" />)}
    </div>
  );

  if (!internship) return (
    <div className="p-8 text-center">
      <p className="text-white/40 mb-4">Internship not found</p>
      <button onClick={() => navigate('/student/internships')} className="text-sm text-violet-400 hover:text-violet-300">← Back</button>
    </div>
  );

  return (
    <div className="p-8">
      {/* Back */}
      <button onClick={() => navigate('/student/internships')}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Internships
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">{internship.title || internship.position_title}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {school && <span className="text-sm text-white/40">{school.name}</span>}
            {career && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                {career.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {application && <ApplicationStatusBadge status={application.status} />}
          <span className={`text-xs font-bold px-3 py-1 rounded-full border capitalize flex-shrink-0 ${STATUS_STYLE[internship.status] || STATUS_STYLE.draft}`}>
            {internship.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        {[
          { label: 'Total Hours', value: internship.total_hours ? `${internship.total_hours}h` : '—', Icon: Clock, color: 'text-cyan-400 bg-cyan-500/10' },
          { label: 'Start Date', value: safeDate(internship.start_date, 'MMM dd') || '—', Icon: Calendar, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Deadline', value: safeDate(internship.application_deadline, 'MMM dd') || '—', Icon: Flag, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Milestones', value: milestones.length, Icon: Target, color: 'text-violet-400 bg-violet-500/10' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl border border-white/8 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-base font-bold text-white font-heading leading-none">{s.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-white/8 overflow-x-auto scrollbar-thin">
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => !t.locked && setTab(t.id)}
            disabled={t.locked}
            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5 ${
              t.locked
                ? 'border-transparent text-white/20 cursor-not-allowed'
                : tab === t.id
                  ? 'border-violet-400 text-violet-300'
                  : 'border-transparent text-white/40 hover:text-white/60'
            }`}>
            {t.locked && <Lock className="w-3 h-3" />}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {internship.description && (
                <div className="glass rounded-2xl border border-white/8 p-6">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">About this Program</h3>
                  <p className="text-sm text-white/80 leading-relaxed">{internship.description}</p>
                </div>
              )}

              <div className="glass rounded-2xl border border-white/8 p-6">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Program Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {[
                    { label: 'Start Date', value: safeDate(internship.start_date) },
                    { label: 'End Date', value: safeDate(internship.end_date) },
                    { label: 'Application Deadline', value: safeDate(internship.application_deadline) },
                    { label: 'Total Hours', value: internship.total_hours ? `${internship.total_hours}h` : null },
                    { label: 'Location Type', value: internship.location_type },
                    { label: 'Openings', value: internship.num_openings },
                  ].filter(d => d.value).map(d => (
                    <div key={d.label}>
                      <p className="text-xs text-white/35 mb-1">{d.label}</p>
                      <p className="text-sm font-medium text-white capitalize">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {internship.responsible_members?.length > 0 && (
                <div className="glass rounded-2xl border border-white/8 p-6">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Points of Contact</h3>
                  <div className="space-y-2">
                    {internship.responsible_members.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white/4 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                          {(m.name || '?')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{m.name}</p>
                          <p className="text-xs text-white/40">{m.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Program Steps */}
              <div className="glass rounded-2xl border border-white/8 p-6">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-5">Application Journey</h3>
                <div className="space-y-0">
                  {[
                    { step: 1, title: 'Complete Your Profile', desc: 'Upload your resume and fill in your contact details so we can match you with the right interview.', icon: User, color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/20' },
                    { step: 2, title: 'Submit Your Application', desc: 'Review your info and optionally add a cover note telling us why you\'re excited about this program.', icon: FileText, color: 'text-violet-400 bg-violet-500/15 border-violet-500/20' },
                    { step: 3, title: 'Complete Enrollment Course', desc: 'Complete the required onboarding course to prepare for your internship and understand program expectations.', icon: Video, color: 'text-amber-400 bg-amber-500/15 border-amber-500/20' },
                    { step: 4, title: 'Await Decision', desc: 'Our team will review your application. You\'ll be notified of the outcome.', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20' },
                    { step: 5, title: 'Onboarding', desc: 'Once approved, complete the onboarding course to prepare for your internship.', icon: BookOpen, color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/20' },
                    { step: 6, title: 'Begin Internship!', desc: 'Congratulations! You\'re ready to start your internship journey.', icon: GraduationCap, color: 'text-rose-400 bg-rose-500/15 border-rose-500/20' },
                  ].map((s, i) => (
                    <div key={s.step} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${s.color}`}>
                          <s.icon className="w-4 h-4" />
                        </div>
                        {i < 5 && <div className="w-px flex-1 my-1 bg-white/8" style={{ minHeight: 28 }} />}
                      </div>
                      <div className="pb-6 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-white/25">STEP {s.step}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-1">{s.title}</h4>
                        <p className="text-xs text-white/45 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Program Milestones */}
              {milestones.length > 0 && (
                <div className="glass rounded-2xl border border-white/8 p-6">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Program Milestones</h3>
                  <div className="space-y-3">
                    {milestones.map((m, i) => (
                      <motion.div key={m.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-white/4 border border-white/6">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${m.status === 'completed' ? 'bg-emerald-500/20' : 'bg-white/8'}`}>
                          {m.status === 'completed' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Target className="w-4 h-4 text-white/30" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white">{m.name}</h4>
                          {m.description && <p className="text-xs text-white/40 mt-0.5">{m.description}</p>}
                          {m.due_date && <p className="text-xs text-white/25 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {safeDate(m.due_date)}</p>}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${m.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : m.status === 'in_progress' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' : 'bg-white/8 text-white/40 border-white/10'}`}>
                          {m.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              {!application && (
                <button onClick={() => setTab('apply')}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm transition-all shadow-lg shadow-violet-500/20">
                  Apply Now <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* ── ENROLLMENT ── */}
          {tab === 'enrollment' && (
            <div className="space-y-5">
              {enrollmentCourse ? (
                <CourseProgressCard
                  course={enrollmentCourse}
                  progress={enrollmentProgress}
                  iconColor="text-amber-400 bg-amber-500/15 border-amber-500/20"
                  accentColor="amber"
                />
              ) : (
                <div className="glass rounded-2xl border border-white/8 p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Enrollment</h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">
                    Your enrollment details and next steps will appear here once your application has been submitted.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── ONBOARDING ── */}
          {tab === 'onboarding' && (
            <div className="space-y-5">
              {onboardingCourse ? (
                <CourseProgressCard
                  course={onboardingCourse}
                  progress={onboardingProgress}
                  iconColor="text-violet-400 bg-violet-500/15 border-violet-500/20"
                  accentColor="violet"
                />
              ) : (
                <div className="glass rounded-2xl border border-white/8 p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Onboarding</h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">
                    Your onboarding course and materials will be available here once you've been accepted into the program.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── MILESTONES ── */}
          {tab === 'milestones' && (
            <StudentMilestonesTab
              internshipId={id}
              currentUser={currentUser}
              internship={internship}
            />
          )}

          {/* ── APPLY / MY APPLICATION ── */}
          {tab === 'apply' && (
            <div className="space-y-5">

              {/* Already applied — show submitted view */}
              {application ? (
                <>
                  {/* Submitted banner */}
                  <div className="glass rounded-2xl border border-emerald-500/25 p-6 flex items-center gap-4" style={{ background: 'rgba(52,211,153,0.05)' }}>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-emerald-400">Application Submitted</p>
                      <p className="text-xs text-white/40 mt-0.5">Your application has been received. We'll be in touch soon.</p>
                    </div>
                  </div>

                  {/* Application answers (read-only) */}
                  <div className="glass rounded-2xl border border-white/8 p-6 space-y-5">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Your Answers</h3>

                    {[
                      { label: 'Name', value: `${application.first_name || ''} ${application.last_name || ''}`.trim() || application.student_name },
                      { label: 'Email', value: application.email || application.student_email },
                      { label: 'Phone', value: application.phone },
                      { label: 'LinkedIn / Portfolio', value: application.linkedin_url },
                      { label: 'Telegram Username', value: application.telegram_username },
                      { label: 'Applicant Type', value: application.applicant_type },
                      { label: 'Current School', value: application.current_school },
                      { label: 'Years in University', value: application.years_in_university },
                      { label: 'Graduation Year', value: application.graduation_year },
                      { label: 'Major', value: application.major },
                      { label: 'Education Level', value: application.education_level },
                      { label: 'Current Employer', value: application.current_employer },
                      { label: 'Industry', value: application.industry },
                      { label: 'Developer Role', value: application.dev_role },
                      { label: 'AI Familiarity', value: application.ai_familiarity },
                      { label: 'Programming Languages', value: application.programming_languages },
                      { label: 'Used AI Tools Before', value: application.ai_tools_used },
                      { label: 'No-Code Familiarity', value: application.nocode_familiarity },
                      { label: 'No-Code Tools', value: application.nocode_tools },
                      { label: 'AI Projects', value: application.ai_projects_description },
                      { label: 'Internship Goals', value: application.internship_goals },
                      { label: 'AI Fields of Interest', value: application.ai_fields_interest },
                      { label: 'AI Career Plan', value: application.ai_career_plan },
                      { label: 'Weekly Hours Commitment', value: application.weekly_hours_commitment },
                      { label: 'Available Remote', value: application.available_remote },
                      { label: 'Scheduling Limitations', value: application.scheduling_limitations },
                      { label: 'Preferred Start Date', value: application.preferred_start_date },
                      { label: 'Anything Else', value: application.anything_else },
                      { label: 'How Did You Hear', value: application.how_did_you_hear },
                      { label: 'Submission Date', value: application.submission_date },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label} className="flex flex-col gap-1 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">{f.label}</p>
                        <p className="text-sm text-white/80 leading-relaxed">{f.value}</p>
                      </div>
                    ))}

                    {/* Resume */}
                    {application.resume_url && (
                      <div className="flex flex-col gap-1 border-b border-white/5 pb-4">
                        <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">Resume</p>
                        <a href={application.resume_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                          <FileText className="w-4 h-4" /> {application.resume_file_name || 'View Resume'}
                        </a>
                      </div>
                    )}

                    {/* Project samples */}
                    {application.project_samples_url && (
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">Project Samples</p>
                        <a href={application.project_samples_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                          <FileText className="w-4 h-4" /> {application.project_samples_file_name || 'View Samples'}
                        </a>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <ITApplicationWizard
                  internshipId={id}
                  currentUser={currentUser}
                  internship={internship}
                  onSubmitted={(app) => setApplication(app)}
                />
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}