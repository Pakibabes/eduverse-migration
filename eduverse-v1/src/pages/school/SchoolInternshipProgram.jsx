import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MilestoneManager from '@/components/internship/MilestoneManager';
import BrochurePreviewModal from '@/components/internship/BrochurePreviewModal';
import {
  ArrowLeft, UserPlus, UserCheck, Activity, Target, FileText, Shield,
  Copy, CheckCircle, Link as LinkIcon, Flag, Calendar, Clock, Users,
  Video, Plus, Trash, Globe, QrCode, Loader2, ChevronDown, Download, X
} from 'lucide-react';
import { FileText as FileTextIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';
import QRCode from 'qrcode.react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function safeDate(dateStr, fmt = 'MMM dd, yyyy') {
  if (!dateStr) return null;
  return format(parse(dateStr, 'yyyy-MM-dd', new Date()), fmt);
}

function StudentSection({ title, students, color, emptyMsg, visibleCount = 7, onShowMore }) {
  const colorMap = {
    blue: { badge: 'text-blue-400 bg-blue-500/10', border: 'border-blue-500/15' },
    emerald: { badge: 'text-emerald-400 bg-emerald-500/10', border: 'border-emerald-500/15' },
    violet: { badge: 'text-violet-400 bg-violet-500/10', border: 'border-violet-500/15' },
    amber: { badge: 'text-amber-400 bg-amber-500/10', border: 'border-amber-500/15' },
  };
  const c = colorMap[color] || colorMap.blue;
  const visibleStudents = students.slice(0, visibleCount);
  const hasMore = students.length > visibleCount;

  return (
    <div className={`glass rounded-2xl border p-5 ${c.border}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${c.badge}`}>{students.length}</span>
        <h3 className="text-sm font-semibold text-white font-heading">{title}</h3>
      </div>
      {students.length === 0 ? (
        <p className="text-xs text-white/25 text-center py-5">{emptyMsg}</p>
      ) : (
        <>
          <div className="space-y-2 mb-3">
            {visibleStudents.map((s, i) => (
              <motion.div key={s.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4 hover:bg-white/6 transition-all">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.badge}`}>
                  {(s.user_name || '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.student_name || s.user_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown'}</p>
                  <p className="text-xs text-white/30 truncate">{s.student_email || s.user_email || ''}</p>
                </div>
                {(s.applied_date || s.joined_date) && (
                  <span className="text-[10px] text-white/25 flex-shrink-0">
                    {format(new Date(s.applied_date || s.joined_date), 'MMM dd')}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
          {hasMore && (
            <button onClick={onShowMore} className="w-full px-3 py-2 rounded-lg bg-white/8 hover:bg-white/12 text-white/60 hover:text-white text-xs font-medium transition-all">
              Show More ({students.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function SchoolInternshipProgram() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [inviteLinks, setInviteLinks] = useState([]);
  const [schoolMembers, setSchoolMembers] = useState([]);
  const [school, setSchool] = useState(null);
  const [career, setCareer] = useState(null);
  const [cohort, setCohort] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [copiedId, setCopiedId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [internshipInviteLinks, setInternshipInviteLinks] = useState([]);
  const [expandedQRId, setExpandedQRId] = useState(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [brochureTemplates, setBrochureTemplates] = useState([]);
  const [showBrochureModal, setShowBrochureModal] = useState(false);
  const [selectedBrochure, setSelectedBrochure] = useState(null);
  const [selectedLinkForBrochure, setSelectedLinkForBrochure] = useState(null);
  const [pendingVisible, setPendingVisible] = useState(7);
  const [approvedVisible, setApprovedVisible] = useState(7);
  const [activeVisible, setActiveVisible] = useState(7);
  const qrRefs = useRef({});


  useEffect(() => {
    const load = async () => {
      try {
        // First batch: internship-specific data
        const [internships, apps] = await Promise.all([
          base44.entities.Internship.list(),
          base44.entities.InternshipApplication.filter({ internship_id: id }),
        ]);
        setApplications(apps);

        const intern = internships.find(i => i.id === id);
        setInternship(intern);

        if (intern) {
          // Second batch: reference data for the internship
          const [allMilestones, allInviteLinks, allSchools, allMembers, allCategories, allCohorts, allBrochures] = await Promise.all([
            base44.entities.InternshipMilestone.list(),
            base44.entities.InviteLink.list(),
            base44.entities.School.list(),
            base44.entities.SchoolMember.list(),
            base44.entities.CareerCategory.list(),
            base44.entities.InternshipCohort.list(),
            base44.entities.BrochureTemplate.filter({ is_active: true }),
          ]);

          const schoolId = intern.community_id;
          setMilestones(allMilestones.filter(m => m.internship_id === id));
          setInviteLinks(allInviteLinks.filter(l => l.school_id === schoolId && l.is_active !== false));
          setInternshipInviteLinks(allInviteLinks.filter(l => l.internship_id === id && l.is_active !== false));
          setSchoolMembers(allMembers.filter(m => m.school_id === schoolId));
          setSchool(allSchools.find(s => s.id === schoolId) || null);
          setCareer(allCategories.find(c => c.id === intern.career_category_id) || null);
          setCohort(allCohorts.find(ch => ch.id === intern.cohort_id) || null);
          setBrochureTemplates(allBrochures.filter(b => !b.category_ids || b.category_ids.length === 0 || b.category_ids.includes(intern.career_category_id)));
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to load internship data:', error);
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const pendingStudents = applications.filter(a => a.status === 'applied' || a.status === 'pending_interview' || a.status === 'interview_completed' || a.status === 'under_review');
  const approvedStudents = applications.filter(a => a.status === 'accepted');
  const activeStudents = applications.filter(a => a.status === 'accepted' && a.applied_date);

  // Documents collected across all milestones
  const allDocuments = milestones.flatMap(m =>
    (m.documents || []).map(d => ({ ...d, milestoneName: m.name }))
  );

  const handleCopy = (link) => {
    const url = `${window.location.origin}/register?invite=${link.code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    toast.success('Invite link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQR = (link) => {
    const qr = qrRefs.current[link.id];
    if (qr) {
      const canvas = qr.querySelector('canvas');
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `internship-signup-${link.code}.png`;
      a.click();
      toast.success('QR code downloaded!');
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!internship?.cohort_id) {
      toast.error('Cohort not assigned to this internship');
      return;
    }
    setGenerating(true);
    const result = await base44.functions.invoke('generateInternshipInviteLink', {
      internship_id: internship.id,
      school_id: internship.community_id,
      category_id: internship.career_category_id,
      cohort_id: internship.cohort_id,
      description: linkTitle || undefined,
    });
    if (result.data) {
      setInternshipInviteLinks(prev => [...prev, result.data]);
      toast.success('Invite link created!');
      setShowLinkForm(false);
      setLinkTitle('');
    } else {
      toast.error('Failed to create invite link');
    }
    setGenerating(false);
  };

  const handleDeleteLink = async (linkId) => {
    if (!confirm('Delete this invite link?')) return;
    try {
      await base44.entities.InviteLink.delete(linkId);
      setInternshipInviteLinks(prev => prev.filter(l => l.id !== linkId));
      toast.success('Link deleted');
    } catch (err) {
      toast.error('Failed to delete link');
    }
  };

  const handleOpenBrochure = (brochure, link) => {
    setSelectedBrochure(brochure);
    setSelectedLinkForBrochure(link);
    setShowBrochureModal(true);
  };

  const STATUS_STYLE = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    draft: 'bg-white/8 text-white/40 border-white/10',
    closed: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    pending_signature: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    full: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  };



  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: `Students (${applications.length})` },
    { id: 'milestones', label: `Milestones (${milestones.length})` },
    { id: 'documents', label: `Documents (${allDocuments.length})` },
  ];

  if (loading) return (
    <div className="p-8 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/4 animate-pulse" />)}
    </div>
  );

  if (!internship) return (
    <div className="p-8 text-center">
      <p className="text-white/40 mb-4">Internship not found</p>
      <button onClick={() => navigate('/school/internships')} className="text-sm text-emerald-400 hover:text-emerald-300">← Back</button>
    </div>
  );

  return (
    <div className="p-8">
      <BrochurePreviewModal
        isOpen={showBrochureModal}
        onClose={() => setShowBrochureModal(false)}
        brochure={selectedBrochure}
        qrUrl={selectedLinkForBrochure ? `${window.location.origin}/register?invite=${selectedLinkForBrochure.code}` : ''}
        linkCode={selectedLinkForBrochure?.code || ''}
      />
      {/* Back + Header */}
      <button onClick={() => navigate('/school/internships')}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Internships
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">{internship.title}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {school && <span className="text-sm text-white/40">{school.name}</span>}
            {career && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                {career.name}
              </span>
            )}
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border capitalize flex-shrink-0 ${STATUS_STYLE[internship.status] || STATUS_STYLE.draft}`}>
          {internship.status}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: 'Applied', value: pendingStudents.length, Icon: UserPlus, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Approved', value: approvedStudents.length, Icon: UserCheck, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Active', value: activeStudents.length, Icon: Activity, color: 'text-violet-400 bg-violet-500/10' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl border border-white/8 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-white font-heading leading-none">{s.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-white/8 overflow-x-auto scrollbar-thin">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
              tab === t.id ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-white/40 hover:text-white/60'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {/* ─── OVERVIEW ─── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {internship.description && (
                <div className="glass rounded-2xl border border-white/8 p-6">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Description</h3>
                  <p className="text-sm text-white/80 leading-relaxed">{internship.description}</p>
                </div>
              )}

              <div className="glass rounded-2xl border border-white/8 p-6">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Program Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {[
                    { label: 'School', value: school?.name },
                    { label: 'Category', value: career?.name },
                    { label: 'Cohort ID', value: internship.cohort_id || 'Not assigned' },
                    { label: 'Start Date', value: safeDate(internship.start_date) },
                    { label: 'End Date', value: safeDate(internship.end_date) },
                    { label: 'Application Deadline', value: safeDate(internship.application_deadline) },
                    { label: 'Total Hours', value: internship.total_hours ? `${internship.total_hours}h` : null },
                    { label: 'Location Type', value: internship.location_type },
                    { label: 'Openings', value: internship.num_openings },
                  ].filter(d => d.value && d.value !== 'Not assigned' || (d.label === 'Cohort ID')).map(d => (
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
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
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

              {/* Internship-Specific Invite Links Section */}
              <div className="glass rounded-2xl border border-white/8 p-6">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Student Signup Links</h3>
                   <button onClick={() => setShowLinkForm(!showLinkForm)} disabled={!internship?.cohort_id}
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium transition-all disabled:opacity-40">
                     <Plus className="w-3 h-3" />
                     Generate Link
                   </button>
                 </div>
                 <AnimatePresence>
                   {showLinkForm && (
                     <motion.div
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       transition={{ duration: 0.2 }}
                       className="mb-4 pb-4 border-b border-white/6 flex gap-2">
                       <input
                         type="text"
                         placeholder="Link title (e.g., 'Q3 Recruiting')"
                         value={linkTitle}
                         onChange={(e) => setLinkTitle(e.target.value)}
                         className="flex-1 px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground placeholder-white/30 text-xs focus:outline-none focus:border-emerald-500/50"
                       />
                       <button onClick={handleGenerateInviteLink} disabled={generating}
                         className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-all disabled:opacity-40">
                         {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
                       </button>
                       <button onClick={() => { setShowLinkForm(false); setLinkTitle(''); }}
                         className="px-2 py-2 text-white/40 hover:text-white/70 transition-all">
                         <X className="w-4 h-4" />
                       </button>
                     </motion.div>
                   )}
                 </AnimatePresence>
                 {internshipInviteLinks.length === 0 ? (
                   <p className="text-xs text-white/25 py-4">No signup links created yet. Click "Generate Link" to create one.</p>
                 ) : (
                   <div className="space-y-3">
                     {internshipInviteLinks.map((link, i) => {
                       const url = `${window.location.origin}/register?invite=${link.code}`;
                       const isExpanded = expandedQRId === link.id;
                       return (
                         <motion.div key={link.id}
                           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                           className="border border-white/6 rounded-lg p-3 bg-white/3">
                           <div className="flex items-start justify-between gap-3 mb-2">
                             <div className="flex-1 min-w-0">
                               {link.description && <p className="text-xs font-medium text-emerald-400 mb-1">{link.description}</p>}
                               <p className="text-xs text-white/25 font-mono break-all mb-1">{url}</p>
                               <div className="flex flex-wrap gap-3 text-[10px] text-white/25">
                                 <span>Signups: {link.use_count || 0}{link.max_uses ? ` / ${link.max_uses}` : ''}</span>
                                 {link.expires_at && <span>Expires: {safeDate(link.expires_at)}</span>}
                               </div>
                             </div>
                             <div className="flex gap-2 flex-shrink-0">
                               <button onClick={() => setExpandedQRId(isExpanded ? null : link.id)}
                                 className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 text-xs font-medium transition-all">
                                 <QrCode className="w-3 h-3" />
                                 <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                               </button>
                               <button onClick={() => handleCopy(link)}
                                 className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium transition-all">
                                 {copiedId === link.id ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                               </button>
                               <button onClick={() => handleDeleteLink(link.id)}
                                 className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-medium transition-all">
                                 <Trash className="w-3 h-3" />
                               </button>
                             </div>
                           </div>
                           <AnimatePresence>
                             {isExpanded && (
                               <motion.div
                                 initial={{ opacity: 0, height: 0 }}
                                 animate={{ opacity: 1, height: 'auto' }}
                                 exit={{ opacity: 0, height: 0 }}
                                 transition={{ duration: 0.2 }}
                                 className="pt-3 border-t border-white/6 flex flex-col items-center gap-3">
                                 <div ref={el => qrRefs.current[link.id] = el}>
                                   <QRCode value={url} size={150} level="H" includeMargin bgColor="rgba(255,255,255,0.05)" fgColor="rgba(52,211,153,0.8)" />
                                 </div>
                                 <div className="flex gap-2 w-full">
                                   <button onClick={() => handleDownloadQR(link)}
                                     className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium transition-all">
                                     <Download className="w-3 h-3" />
                                     QR Only
                                   </button>
                                   {brochureTemplates.length > 0 && (
                                     <Popover>
                                       <PopoverTrigger asChild>
                                         <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 text-xs font-medium transition-all">
                                           <FileText className="w-3 h-3" />
                                           Brochure
                                         </button>
                                       </PopoverTrigger>
                                       <PopoverContent className="w-56 p-2" align="end">
                                         <div className="max-h-48 overflow-y-auto space-y-1">
                                           {brochureTemplates.map(brochure => (
                                             <button
                                               key={brochure.id}
                                               onClick={() => handleOpenBrochure(brochure, link)}
                                               className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/6 transition-all text-xs text-white/70 hover:text-white">
                                               {brochure.name}
                                             </button>
                                           ))}
                                         </div>
                                       </PopoverContent>
                                     </Popover>
                                   )}
                                 </div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                         </motion.div>
                       );
                     })}
                   </div>
                 )}
               </div>
              </div>
              )}

              {/* ─── STUDENTS ─── */}
          {tab === 'students' && (
            <div className="space-y-5">
              <StudentSection title="Applied" students={pendingStudents} color="blue" emptyMsg="No pending applications" visibleCount={pendingVisible} onShowMore={() => setPendingVisible(prev => prev + 7)} />
              <StudentSection title="Approved" students={approvedStudents} color="emerald" emptyMsg="No approved students yet" visibleCount={approvedVisible} onShowMore={() => setApprovedVisible(prev => prev + 7)} />
              <StudentSection title="Active in Program" students={activeStudents} color="violet" emptyMsg="No active students yet" visibleCount={activeVisible} onShowMore={() => setActiveVisible(prev => prev + 7)} />
            </div>
          )}

          {/* ─── MILESTONES ─── */}
          {tab === 'milestones' && (
            <div className="space-y-4">
              <div className="glass rounded-2xl border border-white/8 p-6">
                <MilestoneManager
                  internshipId={id}
                  activeStudents={activeStudents}
                  schoolMembers={schoolMembers}
                  onMilestoneAdded={(newMilestone) => {
                    setMilestones(prev => [...prev, newMilestone]);
                  }}
                />
              </div>

              {milestones.length === 0 ? (
                <div className="text-center py-16 glass rounded-2xl border border-white/8">
                  <Target className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">No milestones for this program</p>
                </div>
              ) : milestones.map((m, i) => (
                <motion.div key={m.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl border border-white/8 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
                        ${m.status === 'completed' ? 'bg-emerald-500/20' : m.status === 'in_progress' ? 'bg-amber-500/20' : 'bg-white/8'}`}>
                        {m.status === 'completed'
                          ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                          : <Target className="w-4 h-4 text-white/30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white">{m.name}</h4>
                        {m.description && <p className="text-xs text-white/40 mt-0.5">{m.description}</p>}
                        {m.due_date && <p className="text-xs text-white/25 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {safeDate(m.due_date)}</p>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize flex-shrink-0
                      ${m.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                        : m.status === 'in_progress' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                        : 'bg-white/8 text-white/40 border-white/10'}`}>
                      {m.status}
                    </span>
                  </div>

                  {(m.assigned_student_ids?.length > 0 || m.assigned_staff_ids?.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-white/6">
                      <p className="text-xs text-white/35 mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Assigned To</p>
                      <div className="flex flex-wrap gap-2">
                        {m.assigned_student_ids?.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                            {m.assigned_student_ids.length} student{m.assigned_student_ids.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {m.assigned_staff_ids?.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                            {m.assigned_staff_ids.length} staff
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {m.required_signatures?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/6">
                      <p className="text-xs text-white/35 mb-2 flex items-center gap-1"><Shield className="w-3 h-3" /> Required Signatures</p>
                      <div className="flex flex-wrap gap-2">
                        {m.required_signatures.map((sig, si) => (
                          <span key={si} className={`text-[10px] px-2 py-0.5 rounded-full border capitalize
                            ${sig.status === 'signed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                            {sig.role} — {sig.status}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* ─── DOCUMENTS ─── */}
          {tab === 'documents' && (
            <div className="space-y-3">
              {allDocuments.length === 0 ? (
                <div className="text-center py-16 glass rounded-2xl border border-white/8">
                  <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">No documents uploaded yet</p>
                </div>
              ) : allDocuments.map((doc, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass rounded-2xl border border-white/8 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{doc.file_name || 'Untitled'}</p>
                    <p className="text-xs text-white/35">From milestone: {doc.milestoneName}</p>
                    {doc.uploaded_date && <p className="text-xs text-white/25 mt-0.5">Uploaded {safeDate(doc.uploaded_date)}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize
                      ${doc.signature_status === 'signed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border-amber-500/20'}`}>
                      {doc.signature_status || 'pending'}
                    </span>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/60 hover:text-white text-xs transition-all">
                        View
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}



        </motion.div>
      </AnimatePresence>
    </div>
  );
}