import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, ChevronDown, Upload, File, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

export default function MilestoneManager({ internshipId, onMilestoneAdded, activeStudents, schoolMembers }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    due_date: '',
    assigned_students: [],
    assigned_staff: [],
    documents: [],
  });

  const handleAddMilestone = async () => {
    if (!formData.name.trim()) {
      toast.error('Milestone name required');
      return;
    }

    setLoading(true);
    try {
      const milestone = await base44.entities.InternshipMilestone.create({
        internship_id: internshipId,
        name: formData.name,
        description: formData.description,
        due_date: formData.due_date || null,
        assigned_student_ids: formData.assigned_students,
        assigned_staff_ids: formData.assigned_staff,
        status: 'pending',
      });

      toast.success('Milestone created!');
      setFormData({ name: '', description: '', due_date: '', assigned_students: [], assigned_staff: [], documents: [] });
      setShowForm(false);
      onMilestoneAdded(milestone);
    } catch (error) {
      toast.error('Failed to create milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (studentId) => {
    setFormData(prev => ({
      ...prev,
      assigned_students: prev.assigned_students.includes(studentId)
        ? prev.assigned_students.filter(id => id !== studentId)
        : [...prev.assigned_students, studentId]
    }));
  };

  const handleStaffChange = (staffId) => {
    setFormData(prev => ({
      ...prev,
      assigned_staff: prev.assigned_staff.includes(staffId)
        ? prev.assigned_staff.filter(id => id !== staffId)
        : [...prev.assigned_staff, staffId]
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Milestones</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium transition-all"
        >
          <Plus className="w-3 h-3" />
          Add Milestone
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4 p-4 border border-white/6 rounded-lg bg-white/3 space-y-4"
          >
            <input
              type="text"
              placeholder="Milestone name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground placeholder-white/30 text-xs focus:outline-none focus:border-emerald-500/50"
            />

            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground placeholder-white/30 text-xs focus:outline-none focus:border-emerald-500/50 h-20 resize-none"
            />

            <div>
              <label className="text-xs text-white/50 font-medium mb-2 block">Milestone Deadline</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-white/10 text-foreground text-xs focus:outline-none focus:border-emerald-500/50 hover:bg-white/5">
                    <span>{formData.due_date ? format(new Date(formData.due_date), 'MMM dd, yyyy') : 'Pick a date'}</span>
                    <Calendar className="w-4 h-4 text-white/30" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.due_date ? new Date(formData.due_date) : undefined}
                    onSelect={(date) => {
                      const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
                      setFormData(prev => ({ ...prev, due_date: dateStr }));
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Assign Students */}
            <div>
              <label className="text-xs text-white/50 font-medium mb-2 block">Assign Students</label>
              {activeStudents && activeStudents.length > 0 ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-white/10 text-white/70 text-xs focus:outline-none focus:border-emerald-500/50 hover:bg-white/5">
                      <span>{formData.assigned_students.length} selected</span>
                      <ChevronDown className="w-3 h-3 text-white/30" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {activeStudents.map(student => (
                        <label key={student.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/6 p-2 rounded transition-all">
                          <input
                            type="checkbox"
                            checked={formData.assigned_students.includes(student.id)}
                            onChange={() => handleStudentChange(student.id)}
                            className="rounded w-4 h-4"
                          />
                          <span className="text-xs text-white/70 flex-1">{student.student_name || student.user_name}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <button disabled className="w-full px-3 py-2 rounded-lg bg-card border border-white/10 text-white/40 text-xs cursor-not-allowed">
                  No students enrolled yet
                </button>
              )}
              {formData.assigned_students.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {formData.assigned_students.map(id => {
                    const student = activeStudents?.find(s => s.id === id);
                    return student ? (
                      <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/15 text-blue-400 text-[10px] border border-blue-500/20">
                        {student.student_name || student.user_name}
                        <button onClick={() => handleStudentChange(id)} className="hover:opacity-70">×</button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              </div>

              {/* Assign Staff */}
            {schoolMembers && schoolMembers.length > 0 && (
              <div>
                <label className="text-xs text-white/50 font-medium mb-2 block">Assign Staff</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-white/10 text-white/70 text-xs focus:outline-none focus:border-emerald-500/50 hover:bg-white/5">
                      <span>{formData.assigned_staff.length} selected</span>
                      <ChevronDown className="w-3 h-3 text-white/30" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {schoolMembers.map(member => (
                        <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/6 p-2 rounded transition-all">
                          <input
                            type="checkbox"
                            checked={formData.assigned_staff.includes(member.id)}
                            onChange={() => handleStaffChange(member.id)}
                            className="rounded w-4 h-4"
                          />
                          <span className="text-xs text-white/70 flex-1">{member.user_name}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {formData.assigned_staff.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {formData.assigned_staff.map(id => {
                      const member = schoolMembers.find(m => m.id === id);
                      return member ? (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[10px] border border-amber-500/20">
                          {member.user_name}
                          <button onClick={() => handleStaffChange(id)} className="hover:opacity-70">×</button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Upload Documents */}
            <div>
              <label className="text-xs text-white/50 font-medium mb-2 block">Attach Documents</label>
              <div className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setFormData(prev => ({
                      ...prev,
                      documents: [...prev.documents, ...files.map(f => ({ file: f, name: f.name }))]
                    }));
                  }}
                  className="hidden"
                  id="doc-upload"
                />
                <label htmlFor="doc-upload" className="block cursor-pointer">
                  <Upload className="w-4 h-4 text-white/40 mx-auto mb-1" />
                  <span className="text-xs text-white/50">Click to upload or drag files here</span>
                </label>
              </div>
              {formData.documents.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {formData.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-white/4 rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <File className="w-3 h-3 text-white/40 flex-shrink-0" />
                        <span className="text-xs text-white/60 truncate">{doc.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            documents: prev.documents.filter((_, idx) => idx !== i)
                          }));
                        }}
                        className="text-white/40 hover:text-white/70 transition-all p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddMilestone}
                disabled={loading || !formData.name.trim()}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-all disabled:opacity-40"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                   setShowForm(false);
                   setFormData({ name: '', description: '', due_date: '', assigned_students: [], assigned_staff: [], documents: [] });
                 }}
                className="px-3 py-2 text-white/40 hover:text-white/70 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}