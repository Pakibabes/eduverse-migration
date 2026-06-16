import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import GlassButton from '@/components/ui/GlassButton';
import { Search, MapPin, Clock, DollarSign, Users, ArrowRight, BookmarkPlus, X, ChevronDown, Calendar as CalendarIcon, Plus, Trash, Upload, FileText, Eye, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { parse, format } from 'date-fns';
import { toast } from 'sonner';
import { getSeasonFromDate, getCohortDisplayName } from '@/lib/seasonHelper';

export default function SchoolInternships() {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [schools, setSchools] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [internshipFilter, setInternshipFilter] = useState('active');
  const [careers, setCareers] = useState([]);
  const [internshipForm, setInternshipForm] = useState({
     title: '',
     position_title: '',
     category_id: '',
     community_id: '',
     description: '',
     num_openings: 1,
     location_type: 'on-site',
     total_hours: '',
     start_date: '',
     end_date: '',
     application_deadline: '',
     responsible_members: [],
     current_member_type: 'existing',
     current_member_id: '',
     current_member_name: '',
     current_member_email: '',
     draft_status: 'draft',
  });
  const [submitting, setSubmitting] = useState(false);
  const [schoolMembers, setSchoolMembers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [cohorts, setCohorts] = useState([]);

  const [milestones, setMilestones] = useState([]);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    due_date: '',
    required_signatures: [{ role: 'intern', status: 'pending' }],
  });
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [newDoc, setNewDoc] = useState({ title: '', file: null });
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('internships');
  const [lastCreatedSnapshot, setLastCreatedSnapshot] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editTemplateMilestones, setEditTemplateMilestones] = useState([]);
  const [newEditMilestone, setNewEditMilestone] = useState({ name: '', description: '', required_signatures: [{ role: 'intern', status: 'pending' }] });

  useEffect(() => {
    const loadData = async () => {
      const [interns, schoolList, user] = await Promise.all([
        base44.entities.Internship.list(),
        base44.entities.School.list(),
        base44.auth.me(),
      ]);
      setInternships(interns);
      setSchools(schoolList);
      setCurrentUser(user);

      const [comms, careerList, members, tmpls, cohortList] = await Promise.all([
        base44.entities.Community.list(),
        base44.entities.CareerCategory.list(),
        base44.entities.SchoolMember.list(),
        base44.entities.InternshipTemplate.list(),
        base44.entities.InternshipCohort.list(),
      ]);
      setCommunities(comms);
      setCareers(careerList);
      setSchoolMembers(members);
      setTemplates(tmpls);
      setCohorts(cohortList);

      setLoading(false);
    };
    loadData().catch(err => console.error('Failed to load data:', err));
  }, []);

  const filteredInternships = internships.filter(intern => {
    const matchesSearch = intern.title.toLowerCase().includes(search.toLowerCase()) ||
                         intern.position_title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = 
      (internshipFilter === 'active' && intern.status === 'active') ||
      (internshipFilter === 'past' && intern.status === 'draft') ||
      (internshipFilter === 'completed' && intern.status === 'closed');
    return matchesSearch && matchesStatus;
  });

  const handleLoadTemplate = async (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    const milestonesList = template.template_data?.milestones || [];
    const documentsList = template.template_data?.documents || [];
    setMilestones(milestonesList);
    setDocuments(documentsList);
  };

  const handleAddMilestone = () => {
    if (!newMilestone.name.trim()) return;
    setMilestones([...milestones, { ...newMilestone, id: Date.now() }]);
    setNewMilestone({ name: '', description: '', due_date: '', required_signatures: [{ role: 'intern', status: 'pending' }] });
  };

  const handleRemoveMilestone = (id) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const getOrCreateCohort = async (startDate, categoryId) => {
    const season = getSeasonFromDate(startDate);
    const year = new Date(startDate).getFullYear();
    const existing = cohorts.find(c => c.season === season && c.year === year && c.career_category_id === categoryId);
    if (existing) return existing.id;
    const created = await base44.entities.InternshipCohort.create({
      name: getCohortDisplayName(season, year),
      season,
      year,
      career_category_id: categoryId,
      status: 'open',
    });
    setCohorts(prev => [...prev, created]);
    return created.id;
  };

  const handleCreateInternship = async (draftStatus) => {
    if (!currentUser) { toast.error('You are not logged in'); return; }

    const titleTrimmed = internshipForm.position_title?.trim();
    const hoursNum = parseInt(internshipForm.total_hours || 0, 10);
    const selectedSchool = schools.find(s => s.id === internshipForm.community_id);

    if (!selectedSchool) { toast.error('Please select a school'); return; }
    if (!titleTrimmed || !internshipForm.category_id || !internshipForm.start_date || !internshipForm.end_date || !internshipForm.application_deadline || hoursNum <= 0) {
      toast.error('Please fill in all required fields with valid data');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const communityId = selectedSchool.id;

      // Create milestones first (with empty internship_id, will update later)
      const createdMilestoneIds = [];
      for (const milestone of milestones) {
        const created = await base44.entities.InternshipMilestone.create({
          internship_id: '', // Empty string, will update with real ID after internship created
          name: milestone.name,
          description: milestone.description,
          due_date: milestone.due_date || internshipForm.end_date,
          required_signatures: milestone.required_signatures || [],
          status: 'pending',
        });
        createdMilestoneIds.push(created.id);
      }

      // Auto-assign cohort
      const cohortId = await getOrCreateCohort(internshipForm.start_date, internshipForm.category_id);

      // Create internship
      const newInternship = {
        title: titleTrimmed,
        position_title: titleTrimmed,
        career_category_id: internshipForm.category_id,
        cohort_id: cohortId,
        community_id: communityId,
        schools_selected: [communityId],
        description: internshipForm.description || '',
        location_type: internshipForm.location_type,
        total_hours: hoursNum,
        start_date: internshipForm.start_date,
        end_date: internshipForm.end_date,
        application_deadline: internshipForm.application_deadline,
        responsible_members: internshipForm.responsible_members || [],
        milestone_ids: createdMilestoneIds,
        status: draftStatus === 'active' ? 'active' : 'draft',
        is_active: draftStatus === 'active',
        created_by_id: currentUser.id,
      };

      const created = await base44.entities.Internship.create(newInternship);

      // Update milestones with actual internship_id
      for (const milestoneId of createdMilestoneIds) {
        await base44.entities.InternshipMilestone.update(milestoneId, { internship_id: created.id });
      }

      // Only create post if launching (active)
      if (draftStatus === 'active') {
        try {
          await base44.entities.Post.create({
            community_id: communityId,
            author_id: currentUser.id,
            author_name: currentUser.full_name,
            content: `${titleTrimmed}\n\n${internshipForm.description || ''}`,
            type: 'announcement',
            in_school_feed: true,
          });
        } catch (postError) {
          console.warn('Post creation failed (non-critical):', postError);
          // Don't fail the whole operation if post fails
        }
      }

      // Update UI with new internship
      setInternships(prev => [...prev, created]);
      toast.success(`Internship ${draftStatus === 'active' ? 'launched' : 'saved as draft'}`);

      // Snapshot for template saving
      setLastCreatedSnapshot({ community_id: internshipForm.community_id, milestones: [...milestones], documents: [...documents] });
      setShowCreateModal(false);
      setShowSaveTemplate(true);

      // Reset form
      setInternshipForm({
        title: '',
        position_title: '',
        category_id: '',
        community_id: '',
        description: '',
        num_openings: 1,
        location_type: 'on-site',
        total_hours: '',
        start_date: '',
        end_date: '',
        application_deadline: '',
        responsible_members: [],
        current_member_type: 'existing',
        current_member_id: '',
        current_member_name: '',
        current_member_email: '',
        draft_status: 'draft',
      });
      setMilestones([]);
      setDocuments([]);
      
    } catch (error) {
      console.error('Internship creation error:', error);
      toast.error(error?.message || 'Failed to create internship');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDocument = () => {
    if (!newDoc.title.trim() || !newDoc.file) return;
    setDocuments([...documents, { title: newDoc.title, file_name: newDoc.file.name, file: newDoc.file, id: Date.now() }]);
    setNewDoc({ title: '', file: null });
  };

  const handleRemoveDocument = (id) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;

    try {
      const snapshot = lastCreatedSnapshot;
      await base44.entities.InternshipTemplate.create({
        school_id: snapshot?.community_id || '',
        name: templateName,
        template_data: {
          milestones: (snapshot?.milestones || []).map(({ id, ...rest }) => rest),
          documents: (snapshot?.documents || []).map(({ file, id, ...rest }) => rest),
        },
        created_by_id: currentUser.id,
      });
      const updatedTemplates = await base44.entities.InternshipTemplate.list();
      setTemplates(updatedTemplates);
      toast.success('Template saved');
      setShowSaveTemplate(false);
      setTemplateName('');
      setLastCreatedSnapshot(null);
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    await base44.entities.InternshipTemplate.delete(templateId);
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Template deleted');
  };

  const handleOpenEdit = (template) => {
    setEditingTemplate({ ...template });
    setEditTemplateMilestones(template.template_data?.milestones ? [...template.template_data.milestones.map((m, i) => ({ ...m, _id: i }))] : []);
    setNewEditMilestone({ name: '', description: '', required_signatures: [{ role: 'intern', status: 'pending' }] });
  };

  const handleSaveTemplateEdit = async () => {
    const updated = await base44.entities.InternshipTemplate.update(editingTemplate.id, {
      name: editingTemplate.name,
      template_data: {
        ...editingTemplate.template_data,
        milestones: editTemplateMilestones.map(({ _id, ...rest }) => rest),
      },
    });
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTemplate(null);
    toast.success('Template updated');
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Manage Internships"
        subtitle="Create, edit, and track your internship programs"
      />

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-white/8 mb-6">
        <button
          onClick={() => setActiveTab('internships')}
          className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === 'internships' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-white/40 hover:text-white/70'}`}
        >
          Internships
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === 'templates' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-white/40 hover:text-white/70'}`}
        >
          Templates ({templates.length})
        </button>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-16 rounded-2xl glass border border-white/8">
              <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/40">No templates saved yet</p>
              <p className="text-white/20 text-sm mt-1">Create an internship and save it as a template</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <div key={template.id} className="glass rounded-2xl border border-white/8 p-5 hover:border-emerald-500/20 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">{template.name}</h3>
                      <p className="text-xs text-white/40 mt-1">{template.template_data?.milestones?.length || 0} milestones</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewingTemplate(template)} className="p-1.5 text-white/30 hover:text-blue-400 transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleOpenEdit(template)} className="p-1.5 text-white/30 hover:text-emerald-400 transition-colors" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteTemplate(template.id)} className="p-1.5 text-white/30 hover:text-rose-400 transition-colors" title="Delete">
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {template.template_data?.milestones?.length > 0 && (
                    <div className="space-y-1">
                      {template.template_data.milestones.slice(0, 3).map((m, i) => (
                        <p key={i} className="text-xs text-white/50">• {m.name}</p>
                      ))}
                      {template.template_data.milestones.length > 3 && (
                        <p className="text-xs text-white/30">+{template.template_data.milestones.length - 3} more</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Template Modal */}
      <AnimatePresence>
        {viewingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col"
              style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <div>
                  <h3 className="text-lg font-bold text-white">{viewingTemplate.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5">{viewingTemplate.template_data?.milestones?.length || 0} milestones</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setViewingTemplate(null); handleOpenEdit(viewingTemplate); }} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors flex items-center gap-1">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => setViewingTemplate(null)} className="text-white/30 hover:text-white/70 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="overflow-y-auto scrollbar-thin flex-1 p-6">
                {(!viewingTemplate.template_data?.milestones?.length) ? (
                  <p className="text-white/30 text-sm text-center py-8">No milestones defined</p>
                ) : (
                  <div className="space-y-3">
                    {viewingTemplate.template_data.milestones.map((m, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/8">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{m.name}</p>
                            {m.description && <p className="text-xs text-white/50 mt-1">{m.description}</p>}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 whitespace-nowrap">
                            {m.required_signatures?.[0]?.role || 'intern'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Template Modal */}
      <AnimatePresence>
        {editingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
              style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
                <h3 className="text-lg font-bold text-white">Edit Template</h3>
                <button onClick={() => setEditingTemplate(null)} className="text-white/30 hover:text-white/70 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto scrollbar-thin flex-1 p-6 space-y-5">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Template Name</label>
                  <input
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60"
                  />
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-2">Milestones ({editTemplateMilestones.length})</p>
                  <div className="space-y-2 mb-3">
                    {editTemplateMilestones.map((m, i) => (
                      <div key={m._id ?? i} className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/8">
                        <div className="flex-1 space-y-1.5">
                          <input
                            value={m.name}
                            onChange={e => setEditTemplateMilestones(prev => prev.map((ms, idx) => idx === i ? { ...ms, name: e.target.value } : ms))}
                            placeholder="Milestone name"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/40"
                          />
                          <input
                            value={m.description || ''}
                            onChange={e => setEditTemplateMilestones(prev => prev.map((ms, idx) => idx === i ? { ...ms, description: e.target.value } : ms))}
                            placeholder="Description (optional)"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-violet-500/40"
                          />
                          <select
                            value={m.required_signatures?.[0]?.role || 'intern'}
                            onChange={e => setEditTemplateMilestones(prev => prev.map((ms, idx) => idx === i ? { ...ms, required_signatures: [{ role: e.target.value, status: 'pending' }] } : ms))}
                            className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 focus:outline-none"
                          >
                            <option value="intern">Intern</option>
                            <option value="staff">Staff</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                        <button onClick={() => setEditTemplateMilestones(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-white/30 hover:text-rose-400 transition-colors mt-1">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Add new milestone inline */}
                  <div className="flex gap-2 border-t border-white/8 pt-3">
                    <input
                      value={newEditMilestone.name}
                      onChange={e => setNewEditMilestone({ ...newEditMilestone, name: e.target.value })}
                      placeholder="New milestone name..."
                      className="flex-1 bg-black/30 border border-violet-500/20 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/60"
                    />
                    <button
                      onClick={() => {
                        if (!newEditMilestone.name.trim()) return;
                        setEditTemplateMilestones(prev => [...prev, { ...newEditMilestone, _id: Date.now() }]);
                        setNewEditMilestone({ name: '', description: '', required_signatures: [{ role: 'intern', status: 'pending' }] });
                      }}
                      disabled={!newEditMilestone.name.trim()}
                      className="px-3 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-xs font-medium disabled:opacity-40 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end gap-3 flex-shrink-0">
                <button onClick={() => setEditingTemplate(null)} className="text-xs text-white/40 hover:text-white/70 px-4 py-2 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleSaveTemplateEdit} disabled={!editingTemplate.name.trim()} className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold disabled:opacity-40 transition-all">
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeTab === 'internships' && (
      <>
      {/* Search, Filter, and Create Button */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search internships..."
            className="w-full bg-black/30 border border-violet-500/20 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60 transition-all"
          />
        </div>
        <div className="flex gap-2 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <button onClick={() => setInternshipFilter('active')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${internshipFilter === 'active' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-white/50 hover:text-white/70'}`}>
            Active
          </button>
          <button onClick={() => setInternshipFilter('past')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${internshipFilter === 'past' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-white/50 hover:text-white/70'}`}>
            Past
          </button>
          <button onClick={() => setInternshipFilter('completed')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${internshipFilter === 'completed' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-white/50 hover:text-white/70'}`}>
            Completed
          </button>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
        >
          Start an Internship
        </button>
      </div>

      {/* Create Internship Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
              <h3 className="text-lg font-bold text-white">Create Internship</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-white/30 hover:text-white/70 transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="overflow-y-auto scrollbar-thin flex-1 p-6 space-y-6">
              {/* Templates */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Templates</h4>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium">Load from Template (optional)</label>
                  <select onChange={e => e.target.value && handleLoadTemplate(e.target.value)}
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60">
                    <option value="">Select a template...</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Basics Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Basics</h4>
                
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium">School *</label>
                  <select value={internshipForm.community_id} onChange={e => setInternshipForm({...internshipForm, community_id: e.target.value})}
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60">
                    <option value="">Select school...</option>
                    {schools.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                   <label className="text-xs text-white/50 font-medium">Internship Title *</label>
                   <input value={internshipForm.position_title} onChange={e => setInternshipForm({...internshipForm, position_title: e.target.value})}
                     placeholder="e.g. Software Engineer Intern" required className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60" />
                 </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium">Career Category *</label>
                  <select value={internshipForm.category_id} onChange={e => setInternshipForm({...internshipForm, category_id: e.target.value})} required
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60">
                    <option value="">Select Career Category</option>
                    {careers.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>


                
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium">Description & Responsibilities</label>
                  <textarea value={internshipForm.description} onChange={e => setInternshipForm({...internshipForm, description: e.target.value})}
                    placeholder="What will interns be doing?" className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60 resize-none h-20" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium">Estimated Students Applying</label>
                  <input type="number" min="1" value={internshipForm.num_openings} onChange={e => setInternshipForm({...internshipForm, num_openings: e.target.value})}
                    placeholder="e.g. 5" className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60" />
                </div>
              </div>

              {/* Logistics Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Logistics</h4>
                
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium">Start Date *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-all hover:border-violet-500/40 flex items-center justify-between">
                        <span>{internshipForm.start_date ? format(parse(internshipForm.start_date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : 'Pick a date'}</span>
                        <CalendarIcon className="w-4 h-4 text-white/40" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={internshipForm.start_date ? parse(internshipForm.start_date, 'yyyy-MM-dd', new Date()) : undefined} onSelect={date => setInternshipForm({...internshipForm, start_date: date ? format(date, 'yyyy-MM-dd') : ''})} />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium">End Date *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-all hover:border-violet-500/40 flex items-center justify-between">
                        <span>{internshipForm.end_date ? format(parse(internshipForm.end_date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : 'Pick a date'}</span>
                        <CalendarIcon className="w-4 h-4 text-white/40" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={internshipForm.end_date ? parse(internshipForm.end_date, 'yyyy-MM-dd', new Date()) : undefined} onSelect={date => setInternshipForm({...internshipForm, end_date: date ? format(date, 'yyyy-MM-dd') : ''})} />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium">Application Deadline *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-all hover:border-violet-500/40 flex items-center justify-between">
                        <span>{internshipForm.application_deadline ? format(parse(internshipForm.application_deadline, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : 'Pick a date'}</span>
                        <CalendarIcon className="w-4 h-4 text-white/40" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={internshipForm.application_deadline ? parse(internshipForm.application_deadline, 'yyyy-MM-dd', new Date()) : undefined} onSelect={date => setInternshipForm({...internshipForm, application_deadline: date ? format(date, 'yyyy-MM-dd') : ''})} />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium">Total Hours *</label>
                  <input type="number" value={internshipForm.total_hours} onChange={e => setInternshipForm({...internshipForm, total_hours: e.target.value})} required
                    placeholder="e.g. 480" className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60" />
                </div>
              </div>

              {/* Point of Contact Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Point of Contact</h4>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Contact type:</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setInternshipForm({...internshipForm, current_member_type: 'existing'})}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${internshipForm.current_member_type === 'existing' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-white/5 text-white/50 hover:bg-white/8'}`}>
                      Existing Member
                    </button>
                    <button type="button" onClick={() => setInternshipForm({...internshipForm, current_member_type: 'email'})}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${internshipForm.current_member_type === 'email' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-white/5 text-white/50 hover:bg-white/8'}`}>
                      Invite by Email
                    </button>
                  </div>
                </div>

                {internshipForm.current_member_type === 'existing' ? (
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 font-medium">Select Member</label>
                    <div className="flex gap-2">
                      <select value={internshipForm.current_member_id} onChange={e => setInternshipForm({...internshipForm, current_member_id: e.target.value})}
                        className="flex-1 bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60">
                        <option value="">Choose a member...</option>
                        {schoolMembers.filter(m => m.school_id === internshipForm.community_id && m.status === 'approved').map(m => <option key={m.user_id} value={m.user_id}>{m.user_name || m.user_email}</option>)}
                      </select>
                      <button type="button" onClick={() => {
                        const member = schoolMembers.find(m => m.user_id === internshipForm.current_member_id);
                        if (member && internshipForm.current_member_id) {
                          setInternshipForm({...internshipForm, responsible_members: [...internshipForm.responsible_members, {type: 'existing', id: internshipForm.current_member_id, name: member.user_name || member.user_email, email: member.user_email}], current_member_id: ''});
                        }
                      }}
                        disabled={!internshipForm.current_member_id}
                        className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold disabled:opacity-40 transition-all">
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs text-white/50 font-medium">Name</label>
                        <input value={internshipForm.current_member_name} onChange={e => setInternshipForm({...internshipForm, current_member_name: e.target.value})}
                          placeholder="e.g. John Doe" className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-xs text-white/50 font-medium">Email</label>
                        <input type="email" value={internshipForm.current_member_email} onChange={e => setInternshipForm({...internshipForm, current_member_email: e.target.value})}
                          placeholder="e.g. john@example.com" className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60" />
                      </div>
                      <button type="button" onClick={() => {
                        if (internshipForm.current_member_name.trim() && internshipForm.current_member_email.trim()) {
                          setInternshipForm({...internshipForm, responsible_members: [...internshipForm.responsible_members, {type: 'email', name: internshipForm.current_member_name, email: internshipForm.current_member_email}], current_member_name: '', current_member_email: ''});
                        }
                      }}
                        disabled={!internshipForm.current_member_name.trim() || !internshipForm.current_member_email.trim()}
                        className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold disabled:opacity-40 transition-all h-fit mt-7">
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Added members list */}
                {internshipForm.responsible_members.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/8">
                    <p className="text-xs text-white/50 font-medium">Added members ({internshipForm.responsible_members.length})</p>
                    <div className="space-y-1.5">
                      {internshipForm.responsible_members.map((member, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{member.name}</p>
                            <p className="text-[10px] text-white/40 truncate">{member.email}</p>
                          </div>
                          <button type="button" onClick={() => setInternshipForm({...internshipForm, responsible_members: internshipForm.responsible_members.filter((_, idx) => idx !== i)})}
                            className="text-white/40 hover:text-white/70 transition-colors ml-2 flex-shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Milestones */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Milestones</h4>

                {milestones.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {milestones.map((m, idx) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/8">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{m.name}</p>
                          <p className="text-xs text-white/40">{m.due_date ? format(parse(m.due_date, 'yyyy-MM-dd', new Date()), 'MMM dd') : 'No due date'}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveMilestone(m.id)}
                          className="p-1 rounded text-white/40 hover:text-rose-400 transition-colors"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 border-t border-white/8 pt-3">
                  <input
                    value={newMilestone.name}
                    onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })}
                    placeholder="Milestone name"
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60"
                  />
                  <textarea
                    value={newMilestone.description}
                    onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    placeholder="Description (optional)"
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60 resize-none h-12"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-white/40">Due Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/60">
                            {newMilestone.due_date ? format(parse(newMilestone.due_date, 'yyyy-MM-dd', new Date()), 'MMM dd') : 'Pick date'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={newMilestone.due_date ? parse(newMilestone.due_date, 'yyyy-MM-dd', new Date()) : undefined} onSelect={date => setNewMilestone({ ...newMilestone, due_date: date ? format(date, 'yyyy-MM-dd') : '' })} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/40">Signature Role</label>
                      <select
                        value={newMilestone.required_signatures[0]?.role || 'intern'}
                        onChange={e => setNewMilestone({ ...newMilestone, required_signatures: [{ role: e.target.value, status: 'pending' }] })}
                        className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/60"
                      >
                        <option value="intern">Intern</option>
                        <option value="staff">Staff</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleAddMilestone}
                    disabled={!newMilestone.name.trim()}
                    className="w-full px-3 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-xs font-medium disabled:opacity-40 transition-all"
                  >
                    <Plus className="w-3 h-3 inline mr-1" /> Add Milestone
                  </button>
                </div>
              </div>

              {/* Documents & Agreements Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Documents & Agreements</h4>

                {documents.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/8">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{doc.title}</p>
                          <p className="text-xs text-white/40 truncate">{doc.file_name}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="p-1 rounded text-white/40 hover:text-rose-400 transition-colors ml-2"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 border-t border-white/8 pt-3">
                  <input
                    value={newDoc.title}
                    onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                    placeholder="Document title"
                    className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60"
                  />
                  <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-violet-500/20 hover:border-violet-500/40 text-xs text-white/60 hover:text-white/80 cursor-pointer transition-all bg-black/30">
                    <Upload className="w-3.5 h-3.5" />
                    {newDoc.file ? newDoc.file.name : 'Select file'}
                    <input
                      type="file"
                      onChange={e => setNewDoc({ ...newDoc, file: e.target.files?.[0] || null })}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleAddDocument}
                    disabled={!newDoc.title.trim() || !newDoc.file}
                    className="w-full px-4 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-xs font-medium disabled:opacity-40 transition-all"
                  >
                    Add document
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end gap-3 flex-shrink-0">
              <button onClick={() => setShowCreateModal(false)} className="text-xs text-white/40 hover:text-white/70 px-4 py-2 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => handleCreateInternship('draft')}
                disabled={submitting} className="px-4 py-2 rounded-xl border border-white/20 hover:border-white/40 text-white text-xs font-bold transition-all">
                Save Draft
              </button>
              <button onClick={() => handleCreateInternship('active')}
                disabled={submitting || !internshipForm.community_id || !internshipForm.position_title.trim() || !internshipForm.category_id || !internshipForm.start_date || !internshipForm.end_date || !internshipForm.application_deadline || !internshipForm.total_hours || parseInt(internshipForm.total_hours || 0) < 1}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20">
                {submitting ? 'Creating...' : 'Launch'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Save Template Modal - inside internships tab */}
      <AnimatePresence>
        {showSaveTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6"
              style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-lg font-bold text-white mb-4">Save as Template?</h3>
              <p className="text-sm text-white/50 mb-4">Reuse this internship structure for future programs.</p>
              <input
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="Template name..."
                className="w-full bg-black/30 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/60 mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowSaveTemplate(false)} className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm font-medium transition-colors">Skip</button>
                <button onClick={handleSaveTemplate} disabled={!templateName.trim()} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold disabled:opacity-40 transition-all">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Internships grid */}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-56 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : filteredInternships.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <BookmarkPlus className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-base">No internships found</p>
          <p className="text-white/20 text-sm mt-1">Check back later for more opportunities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredInternships.map((intern, i) => {
              const school = communities.find(c => c.id === intern.community_id);
              const cohort = cohorts.find(c => c.id === intern.cohort_id);
              return (
                <motion.div
                  key={intern.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass rounded-2xl border border-white/8 p-6 hover:border-emerald-500/20 transition-all group"
                >
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white font-heading">{intern.title}</h3>
                        <p className="text-xs text-white/50 mt-1">{intern.position_title}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {intern.is_posted_to_all_schools && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium whitespace-nowrap">All Schools</span>
                        )}
                        {cohort && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium whitespace-nowrap">{cohort.name}</span>
                        )}
                      </div>
                    </div>
                    {school && (
                      <p className="text-xs text-white/50 mt-1">Posted to {school.name}</p>
                    )}
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-white/6">

                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Users className="w-3.5 h-3.5 text-white/30" />
                      <span>{intern.applicant_count || 0} applied</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => navigate(`/school/internships/${intern.id}`)}
                  >
                    View Program <ArrowRight className="w-3 h-3" />
                  </GlassButton>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      </>
      )}
    </div>
  );
}