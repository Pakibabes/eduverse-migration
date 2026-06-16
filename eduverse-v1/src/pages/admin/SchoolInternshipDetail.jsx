import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, User, Check, X, Edit3, Link as LinkIcon, BookOpen, DollarSign, Globe, MapPin, Clock, FileText, Download, MessageSquare, Upload, Loader2, ChevronDown, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { parse, format } from 'date-fns';
import { toast } from 'sonner';
import GlassButton from '@/components/ui/GlassButton';

export default function SchoolInternshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [courses, setCourses] = useState([]);
  const [interviewLinks, setInterviewLinks] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [milestoneSubTab, setMilestoneSubTab] = useState('program'); // 'program' | 'student'
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);
  const [respondingId, setRespondingId] = useState(null);
  const [responseForm, setResponseForm] = useState({ admin_notes: '', admin_documents: [] });
  const [uploadingResponse, setUploadingResponse] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newWedgeLink, setNewWedgeLink] = useState('');
  const [selectedOnboardingCourse, setSelectedOnboardingCourse] = useState(null);
  const [selectedEnrollmentCourse, setSelectedEnrollmentCourse] = useState(null);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    due_date: '',
    required_signatures: [{ role: 'intern', status: 'pending' }],
  });
  const [editData, setEditData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    Promise.all([
      base44.entities.Internship.get(id),
      base44.entities.InternshipMilestone.filter({ internship_id: id }),
      base44.entities.Course.list(),
      base44.entities.InternshipInterviewLink.filter({ internship_id: id }),
      base44.entities.Community.list(),
      base44.entities.CareerCategory.list(),
      base44.entities.InternshipCohort.list(),
      base44.entities.InternshipApplication.filter({ internship_id: id }),
      base44.entities.StudentMilestoneSubmission.filter({ internship_id: id }),
    ]).then(([interns_data, miles, all_courses, links, comms, cats, cohortList, apps, stuSubs]) => {
      if (interns_data) {
        setInternship(interns_data);
        setEditData(interns_data);
        if (interns_data.enrollment_course_id) {
          setSelectedEnrollmentCourse(interns_data.enrollment_course_id);
        }
      }
      setMilestones(miles);
      setCourses(all_courses);
      setInterviewLinks(links);
      setCommunities(comms);
      setCategories(cats);
      setCohorts(cohortList);
      setApplications(apps);
      setStudentSubmissions(stuSubs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setLoading(false);
    });
  }, [id]);

  const handleAddMilestone = async () => {
    if (!newMilestone.name.trim()) return;
    const created = await base44.entities.InternshipMilestone.create({
      internship_id: id,
      name: newMilestone.name,
      description: newMilestone.description,
      due_date: newMilestone.due_date,
      required_signatures: newMilestone.required_signatures,
      status: 'pending',
    });
    setMilestones([...milestones, created]);
    setNewMilestone({ name: '', description: '', due_date: '', required_signatures: [{ role: 'intern', status: 'pending' }] });
    setShowAddMilestone(false);
    toast.success('Milestone added');
  };

  const handleDeleteMilestone = async (milestoneId) => {
    await base44.entities.InternshipMilestone.delete(milestoneId);
    setMilestones(milestones.filter(m => m.id !== milestoneId));
    toast.success('Milestone deleted');
  };

  const handleSaveInternship = async () => {
    if (!editData.title.trim()) { toast.error('Title is required'); return; }
    await base44.entities.Internship.update(id, editData);
    setInternship(editData);
    setEditMode(false);
    toast.success('Internship updated');
  };

  const handleAddWedgeLink = async () => {
    if (!newWedgeLink.trim()) { toast.error('URL is required'); return; }
    await base44.entities.InternshipInterviewLink.create({
      internship_id: id,
      wedge_interview_url: newWedgeLink,
    });
    const updated = await base44.entities.InternshipInterviewLink.filter({ internship_id: id });
    setInterviewLinks(updated);
    setNewWedgeLink('');
    setShowAddLink(false);
    toast.success('Wedge link added');
  };

  const handleDeleteWedgeLink = async (linkId) => {
    await base44.entities.InternshipInterviewLink.delete(linkId);
    setInterviewLinks(interviewLinks.filter(l => l.id !== linkId));
    toast.success('Wedge link removed');
  };

  const handleAssignEnrollmentCourse = async (courseId) => {
    if (!courseId) return;
    const validCourse = courses.find(c => c.id === courseId && c.is_enrollment);
    if (!validCourse) { toast.error('Invalid enrollment course selected'); return; }
    await base44.entities.Internship.update(id, { enrollment_course_id: courseId });
    setSelectedEnrollmentCourse(courseId);
    toast.success('Enrollment course assigned');
  };

  const handleAssignOnboardingCourse = async (courseId) => {
    if (!courseId) { toast.error('Course is required'); return; }
    if (internship.career_category_id) {
      await base44.entities.SchoolOnboarding.create({
        school_id: internship.community_id,
        category_id: internship.career_category_id,
        course_id: courseId,
      });
      setSelectedOnboardingCourse(courseId);
      toast.success('Onboarding course assigned');
    } else {
      toast.error('Internship must have a career category');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse mb-6" />
        <div className="h-64 bg-white/4 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="p-8">
        <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white mb-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-white/40">Internship not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-heading text-white">{internship.title}</h1>
            <p className="text-sm text-white/40 mt-1">{internship.company_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button onClick={() => { setEditMode(false); setEditData(internship); }} className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm font-medium">Cancel</button>
              <GlassButton variant="primary" onClick={handleSaveInternship}>Save Changes</GlassButton>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-sm font-medium flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/8">
        {['overview', 'applicants', 'configuration', 'milestones', 'documents'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Internship Details */}
              <div className="glass rounded-2xl border border-white/8 p-6 space-y-4">
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Program Details</h2>
                
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-white/40 mb-2 block">Title</label>
                      <input value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-white/40 mb-2 block">Company</label>
                        <input value={editData.company_name || ''} onChange={e => setEditData({ ...editData, company_name: e.target.value })} className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60" />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-2 block">Position</label>
                        <input value={editData.position_title || ''} onChange={e => setEditData({ ...editData, position_title: e.target.value })} className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-2 block">Description</label>
                      <textarea value={editData.description || ''} onChange={e => setEditData({ ...editData, description: e.target.value })} className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60 resize-none h-20" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-white/40 mb-2 block">Duration (weeks)</label>
                        <input type="number" value={editData.duration_weeks || ''} onChange={e => setEditData({ ...editData, duration_weeks: parseInt(e.target.value) })} className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60" />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-2 block">Stipend ($)</label>
                        <input type="number" value={editData.stipend || ''} onChange={e => setEditData({ ...editData, stipend: parseFloat(e.target.value) })} className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60" />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-2 block">Openings</label>
                        <input type="number" value={editData.num_openings || ''} onChange={e => setEditData({ ...editData, num_openings: parseInt(e.target.value) })} className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Globe className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-white/40">Company</p>
                          <p className="text-sm text-white font-medium mt-0.5">{internship.company_name || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <User className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-white/40">Position</p>
                          <p className="text-sm text-white font-medium mt-0.5">{internship.position_title || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-white/40">Duration</p>
                          <p className="text-sm text-white font-medium mt-0.5">{internship.duration_weeks ? `${internship.duration_weeks} weeks` : '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-white/40">Stipend</p>
                          <p className="text-sm text-white font-medium mt-0.5">${internship.stipend || '0'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {internship.description && (
                      <div className="pt-4 border-t border-white/8">
                        <p className="text-xs text-white/40 mb-2">Description</p>
                        <p className="text-sm text-white/70 leading-relaxed">{internship.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'applicants' && (
            <div className="glass rounded-2xl border border-white/8 p-6">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6 flex items-center gap-2">
                <User className="w-4 h-4" /> Applicants ({applications.length})
              </h2>
              {applications.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">No applications yet</p>
              ) : (() => {
                const totalPages = Math.ceil(applications.length / 7);
                const paginated = applications.slice((currentPage - 1) * 7, currentPage * 7);
                return (
                <div className="space-y-3">
                  {paginated.map(app => (
                    <div key={app.id} className="p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{app.student_name || `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Unknown'}</p>
                          <p className="text-xs text-white/40 mt-0.5">{app.student_email}</p>
                          {app.applied_date && <p className="text-xs text-white/30 mt-1">Applied: {app.applied_date}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                            app.status === 'accepted' ? 'bg-emerald-500/15 text-emerald-400' :
                            app.status === 'rejected' ? 'bg-rose-500/15 text-rose-400' :
                            app.status === 'pending_interview' ? 'bg-amber-500/15 text-amber-400' :
                            'bg-blue-500/15 text-blue-400'
                          }`}>
                            {app.status?.replace(/_/g, ' ')}
                          </span>
                          <select
                            value={app.status}
                            onChange={async e => {
                              await base44.entities.InternshipApplication.update(app.id, { status: e.target.value });
                              setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: e.target.value } : a));
                              toast.success('Status updated');
                            }}
                            className="text-xs bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white/60 focus:outline-none focus:border-white/20"
                          >
                            <option value="applied">Applied</option>
                            <option value="pending_interview">Pending Interview</option>
                            <option value="interview_completed">Interview Completed</option>
                            <option value="under_review">Under Review</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                      {app.resume_url && (
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                          <FileText className="w-3.5 h-3.5" /> View Resume
                        </a>
                      )}
                    </div>
                  ))}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/8">
                      <button
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/8 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        ← Prev
                      </button>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <button key={p} onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${currentPage === p ? 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-400' : 'bg-white/5 border border-white/8 text-white/40 hover:bg-white/8'}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/8 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'configuration' && (
            <>
              {/* Wedge Links */}
              <div className="glass rounded-2xl border border-white/8 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Wedge Interview Links</h2>
                  <button onClick={() => setShowAddLink(true)} className="px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-xs font-medium transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {interviewLinks.length === 0 ? (
                    <p className="text-sm text-white/30 text-center py-6">No interview links yet</p>
                  ) : (
                    interviewLinks.map(link => (
                      <div key={link.id} className="flex items-center justify-between p-3 rounded-lg bg-white/4 border border-white/8 group hover:bg-white/6">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <LinkIcon className="w-4 h-4 text-violet-400 flex-shrink-0" />
                          <span className="text-sm text-white/70 truncate">{link.wedge_interview_url}</span>
                        </div>
                        <button onClick={() => handleDeleteWedgeLink(link.id)} className="p-1.5 text-white/40 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all ml-2">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Enrollment Course */}
              <div className="glass rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2 mb-4"><BookOpen className="w-4 h-4 text-amber-400" /> Enrollment Course</h2>
                <select
                  value={selectedEnrollmentCourse || ''}
                  onChange={e => handleAssignEnrollmentCourse(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20"
                >
                  <option value="">Select a course to assign...</option>
                  {courses.filter(c => c.is_enrollment).map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                  {courses.filter(c => c.is_enrollment).length === 0 && (
                    <option disabled value="">No enrollment courses found — tag a course as Enrollment first</option>
                  )}
                </select>
                {selectedEnrollmentCourse && (
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> Course assigned</p>
                )}
              </div>

              {/* Onboarding Course */}
              <div className="glass rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2 mb-4"><BookOpen className="w-4 h-4" /> Onboarding Course</h2>
                <select
                  value={selectedOnboardingCourse || ''}
                  onChange={e => handleAssignOnboardingCourse(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20"
                >
                  <option value="">Select a course to assign...</option>
                  {courses.filter(c => c.is_onboarding).map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                  {courses.filter(c => c.is_onboarding).length === 0 && (
                    <option disabled value="">No onboarding courses found — tag a course as Onboarding first</option>
                  )}
                </select>
                {selectedOnboardingCourse && (
                  <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> Course assigned</p>
                )}
              </div>
            </>
          )}

          {activeTab === 'documents' && (
            <div className="glass rounded-2xl border border-white/8 p-6">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6 flex items-center gap-2"><FileText className="w-4 h-4" /> Documents & Signatures</h2>
              
              {milestones.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">No milestones created yet</p>
              ) : (
                <div className="space-y-4">
                  {milestones.filter(m => m.documents?.length > 0 || m.required_signatures?.length > 0).length === 0 ? (
                    <p className="text-sm text-white/30 text-center py-8">No documents or signatures required yet</p>
                  ) : (
                    milestones.map(milestone => {
                      const hasDocuments = milestone.documents?.length > 0;
                      const hasSignatures = milestone.required_signatures?.length > 0;
                      
                      if (!hasDocuments && !hasSignatures) return null;
                      
                      return (
                        <div key={milestone.id} className="border border-white/8 rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-white">{milestone.name}</p>
                              <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                Due: {milestone.due_date ? format(new Date(milestone.due_date), 'MMM dd, yyyy') : 'No due date'}
                              </p>
                            </div>
                          </div>

                          {hasSignatures && (
                            <div className="pt-2 border-t border-white/8">
                              <p className="text-xs text-white/50 mb-2 font-medium">Signatures Required</p>
                              <div className="space-y-1.5">
                                {milestone.required_signatures.map((sig, idx) => (
                                  <div key={idx} className="flex items-center gap-3 text-sm p-2 rounded bg-white/4">
                                    <div className={`w-2 h-2 rounded-full ${sig.status === 'signed' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                                    <span className="text-white/70 capitalize flex-1">{sig.role} signature</span>
                                    <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${
                                      sig.status === 'signed'
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'bg-orange-500/15 text-orange-400'
                                    }`}>
                                      {sig.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {hasDocuments && (
                            <div className={`${hasSignatures ? 'pt-2 border-t border-white/8' : ''}`}>
                              <p className="text-xs text-white/50 mb-2 font-medium">Uploaded Documents</p>
                              <div className="space-y-2">
                                {milestone.documents.map((doc, idx) => (
                                  <a
                                    key={idx}
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-2 rounded bg-white/4 hover:bg-white/6 transition-colors group"
                                  >
                                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-white/70 truncate">{doc.file_name}</p>
                                      <p className="text-xs text-white/40">
                                        {doc.uploaded_by && `Uploaded by ${doc.uploaded_by}`}
                                      </p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium flex-shrink-0 ${
                                      doc.signature_status === 'signed'
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'bg-orange-500/15 text-orange-400'
                                    }`}>
                                      {doc.signature_status || 'pending'}
                                    </span>
                                    <Download className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-4">
              {/* Sub-tabs */}
              <div className="flex gap-2">
                <button onClick={() => setMilestoneSubTab('program')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${milestoneSubTab === 'program' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25' : 'bg-white/5 text-white/50 hover:bg-white/8 border border-white/10'}`}>
                  Program Milestones ({milestones.length})
                </button>
                <button onClick={() => setMilestoneSubTab('student')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${milestoneSubTab === 'student' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/25' : 'bg-white/5 text-white/50 hover:bg-white/8 border border-white/10'}`}>
                  Student Submissions ({studentSubmissions.length})
                  {studentSubmissions.filter(s => s.status === 'submitted').length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-bold">
                      {studentSubmissions.filter(s => s.status === 'submitted').length}
                    </span>
                  )}
                </button>
              </div>

              {/* Program milestones */}
              {milestoneSubTab === 'program' && (
                <div className="glass rounded-2xl border border-white/8 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Program Milestones</h2>
                    <button onClick={() => setShowAddMilestone(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-3">
                    {milestones.length === 0 ? (
                      <p className="text-sm text-white/30 text-center py-8">No milestones yet</p>
                    ) : (
                      milestones.map(milestone => (
                        <motion.div key={milestone.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg bg-white/5 border border-white/8 hover:bg-white/8 transition-colors group">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-white">{milestone.name}</p>
                              {milestone.description && <p className="text-xs text-white/50 mt-1">{milestone.description}</p>}
                            </div>
                            <button onClick={() => handleDeleteMilestone(milestone.id)}
                              className="p-1.5 rounded text-white/40 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-white/40 flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {milestone.due_date ? format(new Date(milestone.due_date), 'MMM dd, yyyy') : 'No due date'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium">
                              {milestone.required_signatures?.[0]?.role || 'intern'}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-medium ${milestone.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400'}`}>
                              {milestone.status || 'pending'}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Student submissions */}
              {milestoneSubTab === 'student' && (
                <div className="glass rounded-2xl border border-white/8 p-6">
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6">Student Milestone Submissions</h2>
                  {studentSubmissions.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
                      <p className="text-sm text-white/30">No student submissions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentSubmissions.map(sub => {
                        const isExpanded = expandedSubmissionId === sub.id;
                        const isResponding = respondingId === sub.id;
                        const statusColor = {
                          draft: 'bg-white/8 text-white/40',
                          submitted: 'bg-amber-500/15 text-amber-400',
                          under_review: 'bg-blue-500/15 text-blue-400',
                          approved: 'bg-emerald-500/15 text-emerald-400',
                          revision_requested: 'bg-rose-500/15 text-rose-400',
                        }[sub.status] || 'bg-white/8 text-white/40';

                        return (
                          <motion.div key={sub.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="border border-white/8 rounded-xl overflow-hidden">
                            <button
                              onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                              className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/3 transition-all"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-white">{sub.title}</p>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColor}`}>{sub.status?.replace(/_/g, ' ')}</span>
                                </div>
                                <p className="text-xs text-white/35 mt-0.5">
                                  {sub.student_name} · {sub.submitted_date ? `Submitted ${sub.submitted_date}` : `Created ${sub.created_date?.slice(0,10)}`}
                                </p>
                              </div>
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-white/6 overflow-hidden">
                                  <div className="p-4 space-y-4">
                                    {sub.description && <p className="text-sm text-white/60 leading-relaxed">{sub.description}</p>}

                                    {/* Student docs */}
                                    {sub.student_documents?.length > 0 && (
                                      <div>
                                        <p className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Student Documents</p>
                                        <div className="space-y-1.5">
                                          {sub.student_documents.map((doc, i) => (
                                            <a key={i} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/4 hover:bg-white/7 transition-all">
                                              <FileText className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                              <span className="text-xs text-white/70 flex-1 truncate">{doc.file_name}</span>
                                              <Download className="w-3.5 h-3.5 text-white/30" />
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Existing admin response */}
                                    {(sub.admin_notes || sub.admin_documents?.length > 0) && !isResponding && (
                                      <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
                                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Your Response</p>
                                        {sub.admin_notes && <p className="text-sm text-white/70">{sub.admin_notes}</p>}
                                        {sub.admin_documents?.map((doc, i) => (
                                          <a key={i} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded bg-emerald-500/10 hover:bg-emerald-500/15 text-xs text-white/70">
                                            <FileText className="w-3.5 h-3.5 text-emerald-400" />{doc.file_name}
                                          </a>
                                        ))}
                                      </div>
                                    )}

                                    {/* Respond form */}
                                    {isResponding ? (
                                      <div className="space-y-3 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Write Response</p>
                                        <textarea
                                          value={responseForm.admin_notes}
                                          onChange={e => setResponseForm(f => ({ ...f, admin_notes: e.target.value }))}
                                          placeholder="Add notes or feedback for the student..."
                                          className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-emerald-500/60 resize-none h-20"
                                        />
                                        {/* Upload response doc */}
                                        {responseForm.admin_documents.length > 0 && (
                                          <div className="space-y-1.5">
                                            {responseForm.admin_documents.map((doc, i) => (
                                              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                                                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="text-xs text-white/60 flex-1 truncate">{doc.file_name}</span>
                                                <button onClick={() => setResponseForm(f => ({ ...f, admin_documents: f.admin_documents.filter((_, j) => j !== i) }))}
                                                  className="text-white/30 hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/15 text-xs text-white/40 hover:border-emerald-500/40 hover:text-emerald-400 cursor-pointer transition-all">
                                          <input type="file" className="hidden" disabled={uploadingResponse} onChange={async (e) => {
                                            if (!e.target.files?.[0]) return;
                                            setUploadingResponse(true);
                                            const { file_url } = await base44.integrations.Core.UploadFile({ file: e.target.files[0] });
                                            setResponseForm(f => ({ ...f, admin_documents: [...f.admin_documents, { file_url, file_name: e.target.files[0].name, uploaded_by_name: 'Admin', uploaded_date: format(new Date(), 'yyyy-MM-dd') }] }));
                                            setUploadingResponse(false);
                                          }} />
                                          {uploadingResponse ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                          {uploadingResponse ? 'Uploading...' : 'Attach document'}
                                        </label>

                                        <div className="grid grid-cols-3 gap-2">
                                          {['under_review', 'approved', 'revision_requested'].map(s => (
                                            <button key={s} onClick={async () => {
                                              const updated = await base44.entities.StudentMilestoneSubmission.update(sub.id, {
                                                admin_notes: responseForm.admin_notes,
                                                admin_documents: [...(sub.admin_documents || []), ...responseForm.admin_documents],
                                                status: s,
                                              });
                                              setStudentSubmissions(prev => prev.map(ss => ss.id === sub.id ? updated : ss));
                                              setRespondingId(null);
                                              setResponseForm({ admin_notes: '', admin_documents: [] });
                                              toast.success('Response saved');
                                            }}
                                              className={`py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                                                s === 'approved' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' :
                                                s === 'revision_requested' ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' :
                                                'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                              }`}>
                                              {s === 'revision_requested' ? 'Request Revision' : s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')}
                                            </button>
                                          ))}
                                        </div>
                                        <button onClick={() => { setRespondingId(null); setResponseForm({ admin_notes: '', admin_documents: [] }); }}
                                          className="w-full py-2 rounded-lg border border-white/10 text-white/40 text-xs hover:text-white/60 transition-colors">Cancel</button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => { setRespondingId(sub.id); setResponseForm({ admin_notes: sub.admin_notes || '', admin_documents: [] }); }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium transition-all">
                                        <MessageSquare className="w-3.5 h-3.5" /> {sub.admin_notes ? 'Edit Response' : 'Respond'}
                                      </button>
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
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Program Stats */}
          <div className="glass rounded-2xl border border-white/8 p-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Program Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Status</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-400 capitalize">{internship.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Enrolled</span>
                <span className="text-white font-medium">{internship.enrolled_count} / {internship.num_openings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Applicants</span>
                <span className="text-white font-medium">{applications.length || internship.applicant_count || 0}</span>
              </div>
              <div className="border-t border-white/8 pt-3 mt-3">
                <p className="text-xs text-white/40 mb-2">Timeline</p>
                <div className="space-y-1.5 text-xs">
                  <p className="text-white/60">Start: {internship.start_date ? format(new Date(internship.start_date), 'MMM dd, yyyy') : '—'}</p>
                  <p className="text-white/60">End: {internship.end_date ? format(new Date(internship.end_date), 'MMM dd, yyyy') : '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Timeline */}
          <div className="glass rounded-2xl border border-white/8 p-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Application Timeline</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white/50 text-xs mb-1">Application Deadline</p>
                <p className="text-white font-medium">{internship.application_deadline ? format(new Date(internship.application_deadline), 'MMM dd, yyyy') : '—'}</p>
              </div>
              <div className="border-t border-white/8 pt-3">
                <p className="text-white/50 text-xs mb-1">Program Start</p>
                <p className="text-white font-medium">{internship.start_date ? format(new Date(internship.start_date), 'MMM dd, yyyy') : '—'}</p>
              </div>
              <div className="border-t border-white/8 pt-3">
                <p className="text-white/50 text-xs mb-1">Program End</p>
                <p className="text-white font-medium">{internship.end_date ? format(new Date(internship.end_date), 'MMM dd, yyyy') : '—'}</p>
              </div>
            </div>
          </div>

          {/* Location & Type */}
          <div className="glass rounded-2xl border border-white/8 p-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Work Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-white/50 text-xs">Location Type</p>
                  <p className="text-white capitalize">{internship.location_type || 'Remote'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Created By & School */}
          <div className="glass rounded-2xl border border-white/8 p-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Metadata</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white/50 text-xs mb-1">School</p>
                <p className="text-white font-medium">{communities.find(c => c.id === internship.community_id)?.name || internship.community_id || '—'}</p>
              </div>
              <div className="border-t border-white/8 pt-3">
                <p className="text-white/50 text-xs mb-1">Category</p>
                <p className="text-white font-medium">{categories.find(c => c.id === internship.career_category_id)?.name || '—'}</p>
              </div>
              <div className="border-t border-white/8 pt-3">
                <p className="text-white/50 text-xs mb-1">Cohort</p>
                <p className="text-white font-medium">
                  {internship.cohort_id
                    ? cohorts.find(c => c.id === internship.cohort_id)?.name || internship.cohort_id
                    : '—'}
                </p>
              </div>
              <div className="border-t border-white/8 pt-3">
                <p className="text-white/50 text-xs mb-1">Created</p>
                <p className="text-white font-medium">{internship.created_date ? format(new Date(internship.created_date), 'MMM dd, yyyy') : '—'}</p>
              </div>
              <div className="border-t border-white/8 pt-3">
                <p className="text-white/50 text-xs mb-1">Openings</p>
                <p className="text-white font-medium">{internship.num_openings || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl p-6" style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-lg font-bold text-white mb-4">Add Milestone</h3>
              <div className="space-y-3">
                <input
                  value={newMilestone.name}
                  onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  placeholder="Milestone name"
                  className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-emerald-500/60"
                />
                <textarea
                  value={newMilestone.description}
                  onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  placeholder="Description (optional)"
                  className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-emerald-500/60 resize-none h-16"
                />
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60 text-left">
                        {newMilestone.due_date ? format(parse(newMilestone.due_date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : 'Pick a date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={newMilestone.due_date ? parse(newMilestone.due_date, 'yyyy-MM-dd', new Date()) : undefined} onSelect={date => setNewMilestone({ ...newMilestone, due_date: date ? format(date, 'yyyy-MM-dd') : '' })} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Signature Role</label>
                  <select
                    value={newMilestone.required_signatures[0]?.role || 'intern'}
                    onChange={e => setNewMilestone({ ...newMilestone, required_signatures: [{ role: e.target.value, status: 'pending' }] })}
                    className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60"
                  >
                    <option value="intern">Intern</option>
                    <option value="staff">Staff</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddMilestone(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm font-medium transition-colors hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMilestone}
                  disabled={!newMilestone.name.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold disabled:opacity-40 transition-all"
                >
                  Add
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl p-6" style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-lg font-bold text-white mb-4">Add Wedge Interview Link</h3>
              <input
                value={newWedgeLink}
                onChange={e => setNewWedgeLink(e.target.value)}
                placeholder="https://wedge.example.com/..."
                className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60 mb-6"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddLink(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm font-medium transition-colors hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWedgeLink}
                  disabled={!newWedgeLink.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold disabled:opacity-40 transition-all"
                >
                  Add Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}