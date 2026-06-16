import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Calendar as CalendarIcon, Upload, Check, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { parse, format } from 'date-fns';
import { toast } from 'sonner';

export default function EducationInternshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Internship.get(id),
      base44.entities.InternshipMilestone.filter({ internship_id: id }),
      base44.auth.me(),
    ]).then(([interns_data, miles, currentUser]) => {
      if (interns_data) setInternship(interns_data);
      setMilestones(miles);
      setUser(currentUser);
      setLoading(false);
    });
  }, [id]);

  const handleSignDocument = async (milestoneId) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    const updated = await base44.entities.InternshipMilestone.update(milestoneId, {
      required_signatures: milestone.required_signatures.map(sig =>
        sig.role === 'intern' ? { ...sig, status: 'signed', signed_by: user.id, signed_date: new Date().toISOString().split('T')[0] } : sig
      ),
    });
    setMilestones(milestones.map(m => m.id === milestoneId ? updated : m));
    toast.success('Document signed');
  };

  const handleUploadSubmission = async (milestoneId) => {
    toast.info('File upload UI to be implemented');
  };

  const completionPercentage = milestones.length > 0
    ? Math.round((milestones.filter(m => m.status === 'completed').length / milestones.length) * 100)
    : 0;

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
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-heading text-white">{internship.title}</h1>
          <p className="text-sm text-white/40 mt-1">Track your progress and complete milestones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress */}
          <div className="glass rounded-2xl border border-white/8 p-6">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Internship Progress</h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white/70">Overall Completion</span>
                <span className="text-lg font-bold text-emerald-400">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-center">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-white/50 text-xs mb-1">Completed</p>
                <p className="font-bold text-emerald-400">{milestones.filter(m => m.status === 'completed').length}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-white/50 text-xs mb-1">In Progress</p>
                <p className="font-bold text-orange-400">{milestones.filter(m => m.status === 'in_progress').length}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-white/50 text-xs mb-1">Total</p>
                <p className="font-bold text-white">{milestones.length}</p>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="glass rounded-2xl border border-white/8 p-6">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Milestones</h2>
            <div className="space-y-4">
              {milestones.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">No milestones assigned yet</p>
              ) : (
                milestones.map((milestone, idx) => {
                  const internSig = milestone.required_signatures?.find(s => s.role === 'intern' || s.role === 'both');
                  const staffSig = milestone.required_signatures?.find(s => s.role === 'staff' || s.role === 'both');

                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-lg bg-white/5 border border-white/8 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                            <p className="font-medium text-white">{milestone.name}</p>
                          </div>
                          {milestone.description && <p className="text-xs text-white/50 mt-1 ml-8">{milestone.description}</p>}
                        </div>
                      </div>

                      <div className="ml-8 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <CalendarIcon className="w-3.5 h-3.5 text-white/40" />
                          <span className="text-white/60">Due: {milestone.due_date ? format(new Date(milestone.due_date), 'MMM dd, yyyy') : 'No due date'}</span>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/8">
                          {internSig && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/60">Your Signature</span>
                              {internSig.status === 'signed' ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400">
                                  <Check className="w-3 h-3" /> Signed
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSignDocument(milestone.id)}
                                  className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                                >
                                  Sign Now
                                </button>
                              )}
                            </div>
                          )}

                          {(staffSig || milestone.required_signatures?.some(s => s.role === 'both')) && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/60">Staff Signature</span>
                              {staffSig?.status === 'signed' ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400">
                                  <Check className="w-3 h-3" /> Signed
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-orange-400">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => handleUploadSubmission(milestone.id)}
                            className="w-full flex items-center justify-center gap-2 text-xs px-2.5 py-1.5 rounded border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 transition-colors mt-2"
                          >
                            <Upload className="w-3 h-3" /> Upload Submission
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Internship Details */}
          <div className="glass rounded-2xl border border-white/8 p-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white/50">Company</p>
                <p className="text-white font-medium mt-0.5">{internship.company_name || internship.title}</p>
              </div>
              <div>
                <p className="text-white/50">Duration</p>
                <p className="text-white font-medium mt-0.5">{internship.duration_weeks || '—'} weeks</p>
              </div>
              <div>
                <p className="text-white/50">Location</p>
                <p className="text-white font-medium mt-0.5 capitalize">{internship.location_type || '—'}</p>
              </div>
            </div>
          </div>

          {/* Achievements (if completed) */}
          {completionPercentage === 100 && (
            <div className="glass rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Check className="w-4 h-4" /> Completed!
              </h3>
              <p className="text-xs text-white/60">You've earned a certificate and reward for completing this internship.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}