import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, FileText, Upload, Loader2, CheckCircle, Clock, AlertCircle, X, ChevronDown, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const STATUS_CONFIG = {
  draft:              { label: 'Draft',              color: 'bg-white/8 text-white/40 border-white/10' },
  submitted:          { label: 'Submitted',          color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  under_review:       { label: 'Under Review',       color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  approved:           { label: 'Approved',           color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  revision_requested: { label: 'Revision Requested', color: 'bg-rose-500/15 text-rose-400 border-rose-500/25' },
};

const StatusIcon = ({ status }) => {
  if (status === 'approved')           return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === 'revision_requested') return <AlertCircle className="w-4 h-4 text-rose-400" />;
  if (status === 'under_review')       return <Clock className="w-4 h-4 text-amber-400" />;
  if (status === 'submitted')          return <Clock className="w-4 h-4 text-blue-400" />;
  return <FileText className="w-4 h-4 text-white/30" />;
};

export default function StudentMilestonesTab({ internshipId, currentUser, internship }) {
  const [submissions, setSubmissions] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_staff_ids: [],
    student_documents: [],
  });

  useEffect(() => {
    const load = async () => {
      const [subs, members] = await Promise.all([
        base44.entities.StudentMilestoneSubmission.filter({
          internship_id: internshipId,
          student_id: currentUser?.id,
        }),
        base44.entities.SchoolMember.filter({ school_id: internship?.community_id }),
      ]);
      setSubmissions(subs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setStaffMembers(members.filter(m => m.role === 'admin' || m.role === 'member'));
      setLoading(false);
    };
    load();
  }, [internshipId, currentUser?.id]);

  const handleDocUpload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({
      ...f,
      student_documents: [
        ...f.student_documents,
        { file_url, file_name: file.name, uploaded_date: format(new Date(), 'yyyy-MM-dd') },
      ],
    }));
    setUploading(false);
    toast.success('Document uploaded');
  };

  const handleRemoveDoc = (idx) => {
    setForm(f => ({ ...f, student_documents: f.student_documents.filter((_, i) => i !== idx) }));
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);
    const created = await base44.entities.StudentMilestoneSubmission.create({
      internship_id: internshipId,
      student_id: currentUser.id,
      student_name: currentUser.full_name,
      title: form.title,
      description: form.description,
      due_date: form.due_date,
      assigned_staff_ids: form.assigned_staff_ids,
      student_documents: form.student_documents,
      status: 'draft',
    });
    setSubmissions(prev => [created, ...prev]);
    setForm({ title: '', description: '', due_date: '', assigned_staff_ids: [], student_documents: [] });
    setShowCreate(false);
    setSubmitting(false);
    toast.success('Milestone created');
  };

  const handleSubmit = async (sub) => {
    const updated = await base44.entities.StudentMilestoneSubmission.update(sub.id, {
      status: 'submitted',
      submitted_date: format(new Date(), 'yyyy-MM-dd'),
    });
    setSubmissions(prev => prev.map(s => s.id === sub.id ? updated : s));
    toast.success('Milestone submitted for review');
  };

  const handleAddDocToExisting = async (sub, file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const newDoc = { file_url, file_name: file.name, uploaded_date: format(new Date(), 'yyyy-MM-dd') };
    const updatedDocs = [...(sub.student_documents || []), newDoc];
    const updated = await base44.entities.StudentMilestoneSubmission.update(sub.id, { student_documents: updatedDocs });
    setSubmissions(prev => prev.map(s => s.id === sub.id ? updated : s));
    setUploading(false);
    toast.success('Document added');
  };

  const toggleStaff = (staffId) => {
    setForm(f => ({
      ...f,
      assigned_staff_ids: f.assigned_staff_ids.includes(staffId)
        ? f.assigned_staff_ids.filter(id => id !== staffId)
        : [...f.assigned_staff_ids, staffId],
    }));
  };

  if (loading) return (
    <div className="space-y-3">
      {[1,2].map(i => <div key={i} className="h-24 rounded-2xl bg-white/4 animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">My Milestones</h3>
          <p className="text-xs text-white/40 mt-0.5">Create milestones, upload documents and submit for staff review</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-xs font-bold border border-violet-500/25 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> New Milestone
        </button>
      </div>

      {/* Submissions list */}
      {submissions.length === 0 ? (
        <div className="text-center py-14 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40">No milestones yet</p>
          <p className="text-xs text-white/25 mt-1">Create your first milestone to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => {
            const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.draft;
            const isExpanded = expandedId === sub.id;

            return (
              <motion.div key={sub.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl border border-white/8 overflow-hidden">
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/3 transition-all"
                >
                  <StatusIcon status={sub.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{sub.title}</p>
                    <p className="text-xs text-white/35 mt-0.5">
                      {sub.due_date ? `Due ${format(parse(sub.due_date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}` : 'No due date'}
                      {sub.student_documents?.length > 0 && ` · ${sub.student_documents.length} doc${sub.student_documents.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />}
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/6 overflow-hidden">
                      <div className="p-4 space-y-4">
                        {/* Description */}
                        {sub.description && (
                          <p className="text-sm text-white/60 leading-relaxed">{sub.description}</p>
                        )}

                        {/* Assigned staff */}
                        {sub.assigned_staff_ids?.length > 0 && (
                          <div>
                            <p className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Assigned Staff</p>
                            <div className="flex flex-wrap gap-2">
                              {sub.assigned_staff_ids.map(sid => {
                                const member = staffMembers.find(m => m.user_id === sid);
                                return (
                                  <span key={sid} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                                    <User className="w-3 h-3" /> {member?.user_name || sid}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Student documents */}
                        <div>
                          <p className="text-xs text-white/35 font-semibold uppercase tracking-wider mb-2">Your Documents</p>
                          {sub.student_documents?.length > 0 ? (
                            <div className="space-y-1.5 mb-3">
                              {sub.student_documents.map((doc, i) => (
                                <a key={i} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/4 hover:bg-white/7 transition-all group">
                                  <FileText className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                  <span className="text-xs text-white/70 flex-1 truncate">{doc.file_name}</span>
                                  <span className="text-[10px] text-white/30">{doc.uploaded_date}</span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-white/25 mb-3">No documents uploaded</p>
                          )}
                          {(sub.status === 'draft' || sub.status === 'revision_requested') && (
                            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/15 text-xs text-white/40 hover:border-violet-500/40 hover:text-violet-400 cursor-pointer transition-all">
                              <input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleAddDocToExisting(sub, e.target.files[0])} disabled={uploading} />
                              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              Upload document
                            </label>
                          )}
                        </div>

                        {/* Admin response */}
                        {(sub.admin_notes || sub.admin_documents?.length > 0) && (
                          <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
                            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Staff Response</p>
                            {sub.admin_notes && <p className="text-sm text-white/70 leading-relaxed">{sub.admin_notes}</p>}
                            {sub.admin_documents?.length > 0 && (
                              <div className="space-y-1.5">
                                {sub.admin_documents.map((doc, i) => (
                                  <a key={i} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 transition-all">
                                    <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    <span className="text-xs text-white/70 flex-1 truncate">{doc.file_name}</span>
                                    <span className="text-[10px] text-white/30">{doc.uploaded_by_name}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        {sub.status === 'draft' && (
                          <button
                            onClick={() => handleSubmit(sub)}
                            className="w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/20"
                          >
                            Submit for Review
                          </button>
                        )}
                        {sub.status === 'revision_requested' && (
                          <button
                            onClick={() => handleSubmit(sub)}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all"
                          >
                            Resubmit for Review
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

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
              style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>

              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
                <h3 className="text-base font-bold text-white">New Milestone</h3>
                <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white/70"><X className="w-4 h-4" /></button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Milestone title"
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the work completed..."
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60 resize-none h-20"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white text-left flex items-center justify-between focus:outline-none focus:border-violet-500/60">
                        <span>{form.due_date ? format(parse(form.due_date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : 'Pick a date'}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single"
                        selected={form.due_date ? parse(form.due_date, 'yyyy-MM-dd', new Date()) : undefined}
                        onSelect={date => setForm({ ...form, due_date: date ? format(date, 'yyyy-MM-dd') : '' })} />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Staff assignment */}
                {staffMembers.length > 0 && (
                  <div>
                    <label className="text-xs text-white/50 font-medium block mb-1.5">Assign Staff (optional)</label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {staffMembers.map(m => (
                        <label key={m.user_id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${form.assigned_staff_ids.includes(m.user_id) ? 'bg-violet-500/15 border border-violet-500/25' : 'bg-white/4 border border-white/8 hover:bg-white/6'}`}>
                          <input type="checkbox" className="hidden" checked={form.assigned_staff_ids.includes(m.user_id)} onChange={() => toggleStaff(m.user_id)} />
                          <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 flex-shrink-0">
                            {(m.user_name || '?')[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{m.user_name || m.user_email}</p>
                            <p className="text-[10px] text-white/35 capitalize">{m.role}</p>
                          </div>
                          {form.assigned_staff_ids.includes(m.user_id) && <CheckCircle className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document upload */}
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Documents</label>
                  {form.student_documents.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {form.student_documents.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/8">
                          <FileText className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                          <span className="text-xs text-white/70 flex-1 truncate">{doc.file_name}</span>
                          <button onClick={() => handleRemoveDoc(i)} className="text-white/30 hover:text-rose-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-violet-500/25 text-xs text-white/40 hover:border-violet-500/50 hover:text-violet-400 cursor-pointer transition-all">
                    <input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleDocUpload(e.target.files[0])} disabled={uploading} />
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Click to upload document'}
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/8 flex gap-3 flex-shrink-0">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:text-white transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={!form.title.trim() || submitting}
                  className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold disabled:opacity-40 transition-all shadow-lg shadow-violet-500/20">
                  {submitting ? 'Creating...' : 'Create Milestone'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}