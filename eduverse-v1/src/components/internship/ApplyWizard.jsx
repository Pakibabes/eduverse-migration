import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, ExternalLink, User, FileText, Video, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STEPS = ['profile', 'apply', 'interview'];

const STATUS_CONFIG = {
  applied: { label: 'Applied', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  pending_interview: { label: 'Interview Pending', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  interview_completed: { label: 'Interview Done', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  under_review: { label: 'Under Review', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  accepted: { label: '✓ Approved', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  rejected: { label: 'Not Selected', color: 'text-white/40 bg-white/5 border-white/10' },
};

export function ApplicationStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.applied;
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export function ApplicationStatusTimeline({ status }) {
  const stages = [
    { key: 'applied', label: 'Applied' },
    { key: 'pending_interview', label: 'Interview' },
    { key: 'interview_completed', label: 'Reviewing' },
    { key: 'accepted', label: 'Decision' },
  ];
  const order = ['applied', 'pending_interview', 'interview_completed', 'under_review', 'accepted'];
  const currentIdx = order.indexOf(status);

  return (
    <div className="flex items-center gap-0 w-full">
      {stages.map((stage, i) => {
        const stageOrder = order.indexOf(stage.key);
        const done = currentIdx > stageOrder;
        const active = currentIdx === stageOrder || (stage.key === 'interview_completed' && status === 'under_review');
        return (
          <div key={stage.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${done ? 'bg-emerald-500 border-emerald-500 text-black' : active ? 'bg-violet-500/20 border-violet-400 text-violet-300' : 'bg-white/5 border-white/15 text-white/25'}`}>
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-[9px] font-medium whitespace-nowrap ${done || active ? 'text-white/60' : 'text-white/20'}`}>{stage.label}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={`h-px flex-1 mb-4 transition-all ${done ? 'bg-emerald-500/50' : 'bg-white/8'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ApplyWizard({ internship, userProfile, currentUser, existingApplication, onClose, onSuccess }) {
  const [step, setStep] = useState(existingApplication ? 'status' : 'profile');
  const [profile, setProfile] = useState({
    phone: userProfile?.phone || '',
    country: userProfile?.country || '',
    city: userProfile?.city || '',
    linkedin_url: userProfile?.linkedin_url || '',
    resume_url: userProfile?.resume_url || '',
    resume_file_name: userProfile?.resume_file_name || '',
    bio: userProfile?.bio || '',
  });
  const [coverNote, setCoverNote] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState(existingApplication || null);

  const handleResumeUpload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfile(p => ({ ...p, resume_url: file_url, resume_file_name: file.name }));
    setResumeFile(file);
    setUploading(false);
  };

  const handleSubmitApplication = async () => {
    if (!profile.resume_url) { toast.error('Please upload your resume'); return; }
    setSubmitting(true);

    // Save/update profile
    if (userProfile?.id) {
      await base44.entities.UserProfile.update(userProfile.id, profile);
    } else {
      await base44.entities.UserProfile.create({ ...profile, user_id: currentUser.id });
    }

    // Find matching interview link (country + category, fallback to category only, fallback to any)
    const interviewLinks = await base44.entities.InternshipInterviewLink.filter({ internship_id: internship.id });
    let matchedLink = interviewLinks.find(l => l.country === profile.country && l.career_category_id === internship.career_category_id)
      || interviewLinks.find(l => l.country === profile.country)
      || interviewLinks.find(l => l.career_category_id === internship.career_category_id)
      || interviewLinks[0];

    const app = await base44.entities.InternshipApplication.create({
      internship_id: internship.id,
      student_id: currentUser.id,
      student_name: currentUser.full_name,
      student_email: currentUser.email,
      resume_url: profile.resume_url,
      resume_file_name: profile.resume_file_name,
      cover_note: coverNote,
      status: matchedLink ? 'pending_interview' : 'applied',
      interview_url: matchedLink?.wedge_interview_url || '',
      applied_date: format(new Date(), 'yyyy-MM-dd'),
    });

    setApplication(app);
    setSubmitting(false);
    onSuccess?.();
    setStep('interview');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        style={{ background: 'rgba(12,16,38,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-white font-heading">{internship.title || internship.position_title}</h3>
            <p className="text-xs text-white/35 mt-0.5">
              {step === 'status' ? 'Application Status' : step === 'profile' ? 'Step 1 of 2 — Your Profile' : step === 'apply' ? 'Step 2 of 2 — Application' : 'Interview'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 scrollbar-thin">
          <AnimatePresence mode="wait">

            {/* ── STATUS VIEW (existing application) ── */}
            {step === 'status' && application && (
              <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/50">Your application</p>
                  <ApplicationStatusBadge status={application.status} />
                </div>
                <ApplicationStatusTimeline status={application.status} />

                {/* Interview section */}
                {(application.status === 'pending_interview' || application.status === 'interview_completed') && application.interview_url && (
                  <div className="glass rounded-2xl border border-violet-500/20 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <Video className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Wedge Interview</p>
                        <p className="text-xs text-white/40">Complete your video interview to advance</p>
                      </div>
                    </div>
                    <a href={application.interview_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold transition-all mb-3">
                      <ExternalLink className="w-4 h-4" /> Start Interview
                    </a>
                    {application.status === 'pending_interview' && (
                      <button onClick={handleMarkInterviewDone} disabled={submitting}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/10 transition-all disabled:opacity-40">
                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Mark Interview as Complete
                      </button>
                    )}
                  </div>
                )}

                {application.status === 'interview_completed' && (
                  <div className="glass rounded-2xl border border-emerald-500/20 p-5 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white">Interview Completed!</p>
                    <p className="text-xs text-white/40 mt-1">Your application is now under review. We'll notify you of the outcome.</p>
                  </div>
                )}

                {application.status === 'accepted' && (
                  <div className="glass rounded-2xl border border-emerald-500/30 p-5 text-center" style={{ background: 'rgba(52,211,153,0.05)' }}>
                    <p className="text-2xl mb-2">🎉</p>
                    <p className="text-sm font-bold text-emerald-400">Congratulations! You've been accepted!</p>
                    <p className="text-xs text-white/40 mt-1">Your school coordinator will reach out with next steps.</p>
                  </div>
                )}

                {application.cover_note && (
                  <div className="glass rounded-xl border border-white/8 p-4">
                    <p className="text-xs text-white/35 mb-1.5">Your Cover Note</p>
                    <p className="text-sm text-white/70 leading-relaxed">{application.cover_note}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 1: PROFILE ── */}
            {step === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 space-y-5">
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <User className="w-5 h-5 text-violet-400 flex-shrink-0" />
                  <p className="text-xs text-white/60">Confirm your details below — they'll be used for this and future applications.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40 font-medium">Phone</label>
                    <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 555 000 0000"
                      className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40 font-medium">Country</label>
                    <input value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))}
                      placeholder="e.g. United States"
                      className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40 font-medium">City</label>
                    <input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                      placeholder="e.g. New York"
                      className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40 font-medium">LinkedIn</label>
                    <input value={profile.linkedin_url} onChange={e => setProfile(p => ({ ...p, linkedin_url: e.target.value }))}
                      placeholder="linkedin.com/in/you"
                      className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60" />
                  </div>
                </div>

                {/* Resume upload */}
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-medium">Resume *</label>
                  {profile.resume_url ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5">
                      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-emerald-300 flex-1 truncate">{profile.resume_file_name || 'Resume uploaded'}</span>
                      <label className="text-xs text-white/40 hover:text-white/70 cursor-pointer transition-colors">
                        Replace
                        <input type="file" accept=".pdf,.doc,.docx" onChange={e => e.target.files?.[0] && handleResumeUpload(e.target.files[0])} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed border-violet-500/25 hover:border-violet-500/50 cursor-pointer transition-all group">
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-white/25 group-hover:text-violet-400 transition-colors" />
                      )}
                      <span className="text-xs text-white/35 group-hover:text-white/55 transition-colors">
                        {uploading ? 'Uploading...' : 'Click to upload resume (PDF, DOC)'}
                      </span>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={e => e.target.files?.[0] && handleResumeUpload(e.target.files[0])} className="hidden" />
                    </label>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: APPLICATION ── */}
            {step === 'apply' && (
              <motion.div key="apply" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 space-y-5">
                {/* Summary card */}
                <div className="glass rounded-2xl border border-white/8 p-4">
                  <p className="text-xs text-white/35 mb-3 uppercase tracking-wider font-semibold">Applying as</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {(currentUser?.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{currentUser?.full_name}</p>
                      <p className="text-xs text-white/40">{currentUser?.email}</p>
                    </div>
                  </div>
                  {profile.resume_file_name && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/6">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-white/50">{profile.resume_file_name}</span>
                      <span className="text-[10px] text-emerald-400 ml-auto">✓ Ready</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/40 font-medium">Cover Note <span className="text-white/20">(optional)</span></label>
                  <textarea value={coverNote} onChange={e => setCoverNote(e.target.value)}
                    placeholder="Tell us why you're interested in this internship..."
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 resize-none h-28" />
                </div>

                <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <p className="text-xs text-white/40 leading-relaxed">
                    After submitting, you'll receive a Wedge video interview link. Complete it to advance your application.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── INTERVIEW STEP ── */}
            {step === 'interview' && application && (
              <motion.div key="interview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 space-y-5">
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-heading mb-1">Application Submitted!</h3>
                  <p className="text-sm text-white/40">Your next step is to complete the video interview.</p>
                </div>

                {application.interview_url ? (
                  <div className="glass rounded-2xl border border-violet-500/20 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Wedge Video Interview</p>
                        <p className="text-xs text-white/35">Click to open in a new tab and complete at your convenience</p>
                      </div>
                    </div>
                    <a href={application.interview_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold transition-all">
                      <ExternalLink className="w-4 h-4" /> Open Interview
                    </a>
                    <button onClick={handleMarkInterviewDone} disabled={submitting}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/10 transition-all disabled:opacity-40">
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      I've Completed the Interview
                    </button>
                  </div>
                ) : (
                  <div className="glass rounded-2xl border border-white/8 p-5 text-center">
                    <p className="text-sm text-white/50">Interview details will be sent by your coordinator soon.</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end gap-3 flex-shrink-0">
          {step === 'status' && (
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 text-white text-sm font-medium transition-all">
              Close
            </button>
          )}
          {step === 'profile' && (
            <>
              <button onClick={onClose} className="text-xs text-white/30 hover:text-white/60 px-4 py-2 transition-colors">Cancel</button>
              <button onClick={() => setStep('apply')} disabled={!profile.resume_url || uploading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold disabled:opacity-40 transition-all">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === 'apply' && (
            <>
              <button onClick={() => setStep('profile')} className="text-xs text-white/30 hover:text-white/60 px-4 py-2 transition-colors">Back</button>
              <button onClick={handleSubmitApplication} disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit Application
              </button>
            </>
          )}
          {step === 'interview' && (
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 text-white text-sm font-medium transition-all">
              Close
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}