import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Search, Plus, Eye, Edit2, Trash2, Settings, X, Calendar as CalendarIcon, Trash, FileText, Download, ChevronDown, ChevronRight } from 'lucide-react';
import BrochurePreviewModal from '@/components/internship/BrochurePreviewModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import CategoryFormEditor from '@/components/admin/CategoryFormEditor';
import CategoryLandingPagePreview from '@/components/admin/CategoryLandingPagePreview';
import { Calendar } from '@/components/ui/calendar';
import { parse, format } from 'date-fns';
import { toast } from 'sonner';
import { getSeasonFromDate, getCohortDisplayName } from '@/lib/seasonHelper';

export default function AdminInternships() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [internships, setInternships] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryStatus, setNewCategoryStatus] = useState('active');
  const [internshipTab, setInternshipTab] = useState('list');
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [cohortDetailTab, setCohortDetailTab] = useState('internships');
  const [cohortMilestones, setCohortMilestones] = useState([]);
  const [cohortStudentSubmissions, setCohortStudentSubmissions] = useState([]);
  const [cohortMilestonesLoading, setCohortMilestonesLoading] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);
  const [milestoneSubTab, setMilestoneSubTab] = useState('program');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [schoolOnboardings, setSchoolOnboardings] = useState([]);
  const [brochureTemplates, setBrochureTemplates] = useState([]);
  const [selectedBrochure, setSelectedBrochure] = useState(null);
  const [showBrochureModal, setShowBrochureModal] = useState(false);
  const [editingBrochureId, setEditingBrochureId] = useState(null);
  const [editingCategoryIds, setEditingCategoryIds] = useState([]);
  const [editingBrochureNameId, setEditingBrochureNameId] = useState(null);
  const [editingBrochureName, setEditingBrochureName] = useState('');
  const [editingBrochureLogoId, setEditingBrochureLogoId] = useState(null);
  const [uploadingLogoId, setUploadingLogoId] = useState(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [categoryLandingPages, setCategoryLandingPages] = useState({});
  const [selectedCategoryForPreview, setSelectedCategoryForPreview] = useState(null);
  const [editingCategoryForm, setEditingCategoryForm] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    headline: '',
    description: '',
    features: ['', '', '', ''],
    cta_text: 'Apply Now',
    color_scheme: '#22c55e',
    form_steps: [
      { step: 'Basic Info', enabled: true },
      { step: 'Background', enabled: true },
      { step: 'Education', enabled: true },
      { step: 'Tech Skills', enabled: true },
      { step: 'AI & No-Code', enabled: true },
      { step: 'Goals', enabled: true },
      { step: 'Availability', enabled: true },
      { step: 'Final Steps', enabled: true },
    ],
  });
  const [lastCreatedFormSnapshot, setLastCreatedFormSnapshot] = useState(null);
  const [internshipForm, setInternshipForm] = useState({
    title: '',
    category_id: '',
    community_id: '',
    description: '',
    num_openings: 1,
    location_type: 'remote',
    start_date: '',
    end_date: '',
    application_deadline: '',
    milestone_ids: [],
  });
  const [milestones, setMilestones] = useState([]);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    due_date: '',
    required_signatures: [{ role: 'intern', status: 'pending' }],
  });

  useEffect(() => {
    Promise.all([
      base44.entities.Community.list(),
      base44.entities.Internship.list(),
      base44.entities.CareerCategory.list(),
      base44.entities.InternshipTemplate.list(),
      base44.entities.Course.list(),
      base44.entities.SchoolOnboarding.list(),
      base44.entities.InternshipCohort.list(),
      base44.entities.BrochureTemplate.filter({ is_active: true }),
    ]).then(([c, interns, cats, tmpls, crses, onboardings, cohs, brochures]) => {
      setCommunities(c);
      setInternships(interns);
      const sortedCats = cats.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setCategories(sortedCats);
      // Hydrate categoryLandingPages from persisted landing_config on each category
      const persistedConfigs = {};
      sortedCats.forEach(cat => {
        if (cat.landing_config) persistedConfigs[cat.id] = cat.landing_config;
      });
      setCategoryLandingPages(persistedConfigs);
      setTemplates(tmpls);
      setCourses(crses);
      setSchoolOnboardings(onboardings);
      setCohorts(cohs);
      setBrochureTemplates(brochures);
      setLoading(false);
    });
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newCat = await base44.entities.CareerCategory.create({
      name: newCategoryName.trim(),
      status: newCategoryStatus,
      display_order: categories.length,
    });
    setCategories(prev => [...prev, newCat].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
    setNewCategoryName('');
  };

  const handleDeleteCategory = async (catId) => {
    await base44.entities.CareerCategory.delete(catId);
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  const handleRetireCategory = async (catId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'retired' : 'active';
    await base44.entities.CareerCategory.update(catId, { status: newStatus });
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, status: newStatus } : c));
  };

  const handleLoadTemplate = async (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    const milestonesList = template.template_data?.milestones || [];
    setMilestones(milestonesList);
  };

  const handleAddMilestone = () => {
    if (!newMilestone.name.trim()) return;
    setMilestones([...milestones, { ...newMilestone, id: Date.now() }]);
    setNewMilestone({ name: '', description: '', due_date: '', required_signatures: [{ role: 'intern', status: 'pending' }] });
  };

  const handleRemoveMilestone = (id) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const handleCreateInternship = async () => {
    if (!internshipForm.title.trim() || !internshipForm.category_id || !internshipForm.community_id || !internshipForm.start_date || !internshipForm.application_deadline || submitting) return;
    setSubmitting(true);

    // Determine season and year from start_date
    const season = getSeasonFromDate(internshipForm.start_date);
    const year = new Date(internshipForm.start_date).getFullYear();

    // Check if cohort exists for this season, year, and category
    let cohortId;
    const existingCohort = cohorts.find(
      c => c.season === season && c.year === year && c.career_category_id === internshipForm.category_id
    );

    if (existingCohort) {
      cohortId = existingCohort.id;
    } else {
      // Auto-create new cohort
      const newCohort = await base44.entities.InternshipCohort.create({
        name: getCohortDisplayName(season, year),
        season,
        year,
        career_category_id: internshipForm.category_id,
        status: 'open',
      });
      cohortId = newCohort.id;
      setCohorts(prev => [...prev, newCohort]);
    }

    // Create milestones first
    const createdMilestoneIds = [];
    for (const milestone of milestones) {
      const created = await base44.entities.InternshipMilestone.create({
        internship_id: '', // Will be updated after internship creation
        name: milestone.name,
        description: milestone.description,
        due_date: milestone.due_date || internshipForm.end_date,
        required_signatures: milestone.required_signatures,
        status: 'pending',
      });
      createdMilestoneIds.push(created.id);
    }

    const newInternship = {
      title: internshipForm.title,
      career_category_id: internshipForm.category_id,
      community_id: internshipForm.community_id,
      description: internshipForm.description,
      num_openings: parseInt(internshipForm.num_openings) || 1,
      location_type: internshipForm.location_type,
      start_date: internshipForm.start_date,
      end_date: internshipForm.end_date,
      application_deadline: internshipForm.application_deadline,
      milestone_ids: createdMilestoneIds,
      is_active: true,
      status: 'active',
      cohort_id: cohortId,
    };

    const created = await base44.entities.Internship.create(newInternship);

    // Update milestones with internship_id
    for (const milestoneId of createdMilestoneIds) {
      await base44.entities.InternshipMilestone.update(milestoneId, { internship_id: created.id });
    }

    setInternships(prev => [...prev, created]);
    // Snapshot form before resetting so template save has access to community_id
    setLastCreatedFormSnapshot({ community_id: internshipForm.community_id, milestones: [...milestones] });
    setShowCreateModal(false);
    setShowSaveTemplate(true);
    setInternshipForm({
      title: '',
      category_id: '',
      community_id: '',
      description: '',
      num_openings: 1,
      location_type: 'remote',
      start_date: '',
      end_date: '',
      application_deadline: '',
      milestone_ids: createdMilestoneIds,
    });
    setMilestones([]);
    setSubmitting(false);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !lastCreatedFormSnapshot?.community_id) {
      toast.error('Missing data to save template');
      return;
    }
    const community = communities.find(c => c.id === lastCreatedFormSnapshot.community_id);
    await base44.entities.InternshipTemplate.create({
      school_id: community?.school_id || lastCreatedFormSnapshot.community_id,
      name: templateName,
      template_data: {
        milestones: (lastCreatedFormSnapshot.milestones || []).map(({ id, ...rest }) => rest),
      },
      created_by_id: (await base44.auth.me()).id,
    });
    const updatedTemplates = await base44.entities.InternshipTemplate.list();
    setTemplates(updatedTemplates);
    toast.success('Template saved');
    setShowSaveTemplate(false);
    setTemplateName('');
    setLastCreatedFormSnapshot(null);
  };

  const handleBrochureLogoUpload = async (brochureId, file) => {
    setUploadingLogoId(brochureId);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.BrochureTemplate.update(brochureId, {
        template_design: {
          ...(brochureTemplates.find(b => b.id === brochureId)?.template_design || {}),
          logo_url: result.file_url
        }
      });
      setBrochureTemplates(prev => prev.map(b => 
        b.id === brochureId 
          ? { ...b, template_design: { ...(b.template_design || {}), logo_url: result.file_url } }
          : b
      ));
      toast.success('Logo uploaded');
      setEditingBrochureLogoId(null);
    } catch (err) {
      toast.error('Failed to upload logo');
    }
    setUploadingLogoId(null);
  };

  const filteredInternships = internships.filter(intern => {
    const matchesSearch = intern.title?.toLowerCase().includes(search.toLowerCase()) ||
                         intern.position_title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || intern.status === statusFilter;
    const matchesSchool = schoolFilter === 'all' || intern.community_id === schoolFilter;
    const matchesCategory = categoryFilter === 'all' || intern.career_category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesSchool && matchesCategory;
  });

  const statusBadgeColor = {
    draft: 'bg-gray-500/15 text-gray-400',
    active: 'bg-emerald-500/15 text-emerald-400',
    pending_signature: 'bg-amber-500/15 text-amber-400',
    full: 'bg-blue-500/15 text-blue-400',
    closed: 'bg-rose-500/15 text-rose-400',
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Internships Management"
        subtitle="View, manage, and configure internship programs and career categories"
      />

      {/* Sub-tabs */}
      <div className="flex items-center gap-0 border-b border-white/8 mb-6">
        <button
          onClick={() => { setInternshipTab('list'); setSelectedCohort(null); }}
          className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
            internshipTab === 'list'
              ? 'border-rose-400 text-rose-300'
              : 'border-transparent text-white/40 hover:text-white/70'
          }`}
        >
          Master List
        </button>
        <button
          onClick={() => { setInternshipTab('cohorts'); setSelectedCohort(null); }}
          className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
            internshipTab === 'cohorts'
              ? 'border-rose-400 text-rose-300'
              : 'border-transparent text-white/40 hover:text-white/70'
          }`}
        >
          Cohorts
        </button>
        <button
          onClick={() => setInternshipTab('categories')}
          className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
            internshipTab === 'categories'
              ? 'border-rose-400 text-rose-300'
              : 'border-transparent text-white/40 hover:text-white/70'
          }`}
        >
          Career Categories
        </button>
        <button
          onClick={() => setInternshipTab('marketing')}
          className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
            internshipTab === 'marketing'
              ? 'border-rose-400 text-rose-300'
              : 'border-transparent text-white/40 hover:text-white/70'
          }`}
        >
          Marketing Materials
        </button>
        <button
          onClick={() => setInternshipTab('landing-pages')}
          className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
            internshipTab === 'landing-pages'
              ? 'border-rose-400 text-rose-300'
              : 'border-transparent text-white/40 hover:text-white/70'
          }`}
        >
          Category Landing Pages
        </button>
        <button
          onClick={() => setInternshipTab('category-forms')}
          className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
            internshipTab === 'category-forms'
              ? 'border-rose-400 text-rose-300'
              : 'border-transparent text-white/40 hover:text-white/70'
          }`}
        >
          Category Forms
        </button>
      </div>

      {/* Master List */}
      {internshipTab === 'list' && (
        <div className="space-y-6">
          {/* Create button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Internship
            </button>
          </div>

          {/* Filters and search */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search internships..."
                className="w-full bg-black/30 border border-rose-500/20 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-rose-500/60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/60"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="pending_signature">Pending Signature</option>
              <option value="full">Full</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
              className="bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/60"
            >
              <option value="all">All Schools</option>
              {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/60"
            >
              <option value="all">All Categories</option>
              {categories.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Internships table */}
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 rounded-lg bg-white/4 animate-pulse" />)}</div>
            ) : filteredInternships.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-white/30">No internships found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Title</th>
                    <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">School</th>
                    <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Category</th>
                    <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Responsible</th>
                    <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Filled</th>
                    <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Created</th>
                    <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInternships.map(intern => {
                    const school = communities.find(c => c.id === intern.community_id);
                    const category = categories.find(c => c.id === intern.career_category_id);
                    const responsible = intern.responsible_members?.[0];
                    return (
                      <tr key={intern.id} className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-all">
                        <td className="px-5 py-3 text-sm text-white font-medium">{intern.title || intern.position_title}</td>
                        <td className="px-5 py-3 text-sm text-white/60">{school?.name || '—'}</td>
                        <td className="px-5 py-3 text-sm text-white/60">{category?.name || '—'}</td>
                        <td className="px-5 py-3 text-sm text-white/60">{responsible?.name || '—'}</td>
                        <td className="px-5 py-3 text-sm text-white/60">
                          {intern.enrolled_count || 0} / {intern.num_openings || 1}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${statusBadgeColor[intern.status] || 'bg-white/8 text-white/30'}`}>
                            {intern.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-white/40">{new Date(intern.created_date).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => navigate(`/admin/internships/${intern.id}`)} className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => navigate(`/admin/internships/${intern.id}`)} className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Cohorts Management */}
      {internshipTab === 'cohorts' && (
        !selectedCohort ? (
          <div className="space-y-6">
            <div className="glass rounded-2xl border border-white/8 overflow-hidden">
              {loading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 rounded-lg bg-white/4 animate-pulse" />)}</div>
              ) : cohorts.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-white/30">No cohorts yet — they are auto-created when internships are added</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Cohort Name</th>
                      <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Season</th>
                      <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Year</th>
                      <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Category</th>
                      <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Internships</th>
                      <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Status</th>
                      <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map(cohort => {
                      const cohortInternships = internships.filter(i => i.cohort_id === cohort.id);
                      const category = categories.find(c => c.id === cohort.career_category_id);
                      return (
                        <tr key={cohort.id} className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-all">
                          <td className="px-5 py-3 text-sm text-white font-medium">{cohort.name}</td>
                          <td className="px-5 py-3 text-sm text-white/60">{cohort.season}</td>
                          <td className="px-5 py-3 text-sm text-white/60">{cohort.year}</td>
                          <td className="px-5 py-3 text-sm text-white/60">{category?.name || '—'}</td>
                          <td className="px-5 py-3 text-sm text-white/60">{cohortInternships.length}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${cohort.status === 'open' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>
                              {cohort.status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <button onClick={() => setSelectedCohort(cohort)} className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <button onClick={() => { setSelectedCohort(null); setCohortDetailTab('internships'); }} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
              ← Back to Cohorts
            </button>

            {/* Cohort header */}
            <div className="glass rounded-2xl border border-white/8 p-6">
              <h2 className="text-2xl font-bold text-white font-heading mb-4">{selectedCohort.name}</h2>
              <div className="grid grid-cols-3 gap-6">
                <div><p className="text-xs text-white/40">Season</p><p className="text-lg font-semibold text-white mt-1">{selectedCohort.season}</p></div>
                <div><p className="text-xs text-white/40">Year</p><p className="text-lg font-semibold text-white mt-1">{selectedCohort.year}</p></div>
                <div><p className="text-xs text-white/40">Status</p><p className="text-lg font-semibold text-white mt-1 capitalize">{selectedCohort.status}</p></div>
              </div>
            </div>

            {/* Cohort detail tabs */}
            <div className="flex gap-2 border-b border-white/8 pb-0">
              <button onClick={() => setCohortDetailTab('internships')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${cohortDetailTab === 'internships' ? 'border-rose-400 text-rose-300' : 'border-transparent text-white/40 hover:text-white/70'}`}>
                Internships ({internships.filter(i => i.cohort_id === selectedCohort.id).length})
              </button>
              <button onClick={async () => {
                setCohortDetailTab('milestones');
                if (cohortMilestones.length === 0 && !cohortMilestonesLoading) {
                  setCohortMilestonesLoading(true);
                  const cohortInternshipIds = internships.filter(i => i.cohort_id === selectedCohort.id).map(i => i.id);
                  const [allMilestones, allSubmissions] = await Promise.all([
                    base44.entities.InternshipMilestone.list(),
                    base44.entities.StudentMilestoneSubmission.list(),
                  ]);
                  setCohortMilestones(allMilestones.filter(m => cohortInternshipIds.includes(m.internship_id)));
                  setCohortStudentSubmissions(allSubmissions.filter(s => cohortInternshipIds.includes(s.internship_id)));
                  setCohortMilestonesLoading(false);
                }
              }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${cohortDetailTab === 'milestones' ? 'border-rose-400 text-rose-300' : 'border-transparent text-white/40 hover:text-white/70'}`}>
                Milestones
              </button>
            </div>

            {/* Internships tab */}
            {cohortDetailTab === 'internships' && (
              <div className="space-y-3">
                {internships.filter(i => i.cohort_id === selectedCohort.id).map(intern => {
                  const school = communities.find(c => c.id === intern.community_id);
                  return (
                    <div key={intern.id} className="p-4 rounded-lg bg-white/4 border border-white/8 hover:border-white/12 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{intern.title}</p>
                          <p className="text-xs text-white/40 mt-1">{school?.name || '—'}</p>
                        </div>
                        <button onClick={() => navigate(`/admin/internships/${intern.id}`)} className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {internships.filter(i => i.cohort_id === selectedCohort.id).length === 0 && (
                  <p className="text-sm text-white/30 text-center py-6">No internships in this cohort</p>
                )}
              </div>
            )}

            {/* Milestones tab */}
            {cohortDetailTab === 'milestones' && (
              <div className="space-y-4">
                {/* Sub-tabs */}
                <div className="flex gap-2">
                  <button onClick={() => setMilestoneSubTab('program')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${milestoneSubTab === 'program' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25' : 'bg-white/5 text-white/50 hover:bg-white/8 border border-white/10'}`}>
                    Program Milestones {cohortMilestonesLoading ? '' : `(${cohortMilestones.length})`}
                  </button>
                  <button onClick={() => setMilestoneSubTab('student')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${milestoneSubTab === 'student' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/25' : 'bg-white/5 text-white/50 hover:bg-white/8 border border-white/10'}`}>
                    Student Submissions {cohortMilestonesLoading ? '' : `(${cohortStudentSubmissions.length})`}
                    {!cohortMilestonesLoading && cohortStudentSubmissions.filter(s => s.status === 'submitted').length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-bold">
                        {cohortStudentSubmissions.filter(s => s.status === 'submitted').length}
                      </span>
                    )}
                  </button>
                </div>

                {cohortMilestonesLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" />)}</div>
                ) : milestoneSubTab === 'program' ? (
                  <div className="glass rounded-2xl border border-white/8 p-6">
                    {cohortMilestones.length === 0 ? (
                      <p className="text-sm text-white/30 text-center py-8">No program milestones for this cohort</p>
                    ) : (
                      <div className="space-y-3">
                        {cohortMilestones.map(milestone => {
                          const intern = internships.find(i => i.id === milestone.internship_id);
                          const school = communities.find(c => c.id === intern?.community_id);
                          return (
                            <div key={milestone.id} className="p-4 rounded-lg bg-white/5 border border-white/8">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-white text-sm">{milestone.name}</p>
                                  <p className="text-xs text-white/35 mt-0.5">{intern?.title || '—'} · {school?.name || '—'}</p>
                                  {milestone.description && <p className="text-xs text-white/50 mt-1">{milestone.description}</p>}
                                </div>
                                <button onClick={() => navigate(`/admin/internships/${milestone.internship_id}`)} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all ml-2">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center gap-3 text-xs flex-wrap">
                                {milestone.due_date && (
                                  <span className="text-white/40 flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{milestone.due_date}</span>
                                )}
                                <span className={`px-2 py-0.5 rounded font-medium ${milestone.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400'}`}>
                                  {milestone.status || 'pending'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass rounded-2xl border border-white/8 p-6">
                    {cohortStudentSubmissions.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-sm text-white/30">No student submissions for this cohort</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cohortStudentSubmissions.map(sub => {
                          const isExpanded = expandedSubmissionId === sub.id;
                          const intern = internships.find(i => i.id === sub.internship_id);
                          const statusColor = {
                            draft: 'bg-white/8 text-white/40',
                            submitted: 'bg-amber-500/15 text-amber-400',
                            under_review: 'bg-blue-500/15 text-blue-400',
                            approved: 'bg-emerald-500/15 text-emerald-400',
                            revision_requested: 'bg-rose-500/15 text-rose-400',
                          }[sub.status] || 'bg-white/8 text-white/40';
                          return (
                            <div key={sub.id} className="border border-white/8 rounded-xl overflow-hidden">
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
                                    {sub.student_name} · {intern?.title || '—'} · {sub.submitted_date || sub.created_date?.slice(0,10)}
                                  </p>
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); navigate(`/admin/internships/${sub.internship_id}`); }}
                                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />}
                              </button>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-white/6 overflow-hidden">
                                    <div className="p-4 space-y-3">
                                      {sub.description && <p className="text-sm text-white/60">{sub.description}</p>}
                                      {sub.student_documents?.length > 0 && (
                                        <div className="space-y-1.5">
                                          <p className="text-xs text-white/35 font-semibold uppercase tracking-wider">Student Documents</p>
                                          {sub.student_documents.map((doc, i) => (
                                            <a key={i} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/4 hover:bg-white/7 transition-all">
                                              <FileText className="w-3.5 h-3.5 text-violet-400" />
                                              <span className="text-xs text-white/70 flex-1 truncate">{doc.file_name}</span>
                                              <Download className="w-3.5 h-3.5 text-white/30" />
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                      {sub.admin_notes && (
                                        <div className="rounded-xl p-3" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
                                          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Admin Response</p>
                                          <p className="text-sm text-white/70">{sub.admin_notes}</p>
                                        </div>
                                      )}
                                      <button onClick={() => navigate(`/admin/internships/${sub.internship_id}`)}
                                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors">
                                        → Manage in internship detail
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )
      )}

      {/* Career Categories */}
      {internshipTab === 'categories' && (
        <div className="space-y-6">
          {/* Add new category */}
          <div className="glass rounded-2xl border border-white/8 p-6">
            <h3 className="text-base font-bold text-white mb-4">Add Career Category</h3>
            <div className="flex gap-3 flex-wrap">
              <input
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                className="flex-1 min-w-[200px] bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-rose-500/60"
              />
              <select
                value={newCategoryStatus}
                onChange={e => setNewCategoryStatus(e.target.value)}
                className="bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/60"
              >
                <option value="active">Active</option>
                <option value="retired">Retired</option>
              </select>
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold disabled:opacity-40 transition-all shadow-lg shadow-rose-500/20"
              >
                <Plus className="w-4 h-4 inline mr-1" /> Add
              </button>
            </div>
          </div>

          {/* Categories list */}
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="p-6 space-y-2">
              {categories.length === 0 ? (
                <p className="text-white/30 text-center py-8">No categories created yet</p>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/3 transition-all border border-white/6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{cat.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          cat.status === 'active'
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-gray-500/15 text-gray-400'
                        }`}>
                          {cat.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-1">Order: {cat.display_order || 0}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRetireCategory(cat.id, cat.status)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/70 hover:bg-white/5 transition-all"
                      >
                        {cat.status === 'active' ? 'Retire' : 'Reactivate'}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        )}

      {/* Marketing Materials */}
      {internshipTab === 'marketing' && (
        <div className="space-y-6">
          <p className="text-sm text-white/50">Preview and download branded brochure templates for internship recruitment.</p>
          {loading ? (
            <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-white/4 animate-pulse" />)}</div>
          ) : brochureTemplates.length === 0 ? (
            <div className="glass rounded-2xl border border-white/8 p-12 text-center">
              <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30">No brochure templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brochureTemplates.map(brochure => (
                <div key={brochure.id} className="glass rounded-xl border border-white/8 p-4 hover:border-white/12 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{brochure.name}</h3>
                      <p className="text-[10px] text-white/40 mt-0.5">Template</p>
                    </div>
                    <div
                      className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ background: brochure.template_design?.color_scheme || '#6366f1' }}
                    >
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                  </div>
                    
                    {editingBrochureId === brochure.id ? (
                      <div className="space-y-2">
                        <label className="text-xs text-white/50 block">Assign to Career Categories</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-white/10 text-white/70 text-xs focus:outline-none focus:border-emerald-500/50 hover:bg-white/5">
                              <span>{editingCategoryIds.length > 0 ? `${editingCategoryIds.length} selected` : 'Select categories'}</span>
                              <ChevronDown className="w-3 h-3 text-white/30" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2" align="start">
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {categories.map(cat => (
                                <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/6 p-2 rounded transition-all">
                                  <input
                                    type="checkbox"
                                    checked={editingCategoryIds.includes(cat.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditingCategoryIds(prev => [...prev, cat.id]);
                                      } else {
                                        setEditingCategoryIds(prev => prev.filter(id => id !== cat.id));
                                      }
                                    }}
                                    className="rounded w-4 h-4"
                                  />
                                  <span className="text-xs text-white/70">{cat.name}</span>
                                </label>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await base44.entities.BrochureTemplate.update(brochure.id, { category_ids: editingCategoryIds.length > 0 ? editingCategoryIds : [] });
                                setBrochureTemplates(prev => prev.map(b => b.id === brochure.id ? { ...b, category_ids: editingCategoryIds.length > 0 ? editingCategoryIds : [] } : b));
                                setEditingBrochureId(null);
                                setEditingCategoryIds([]);
                                toast.success('Categories updated');
                              } catch (err) {
                                toast.error('Failed to update');
                              }
                            }}
                            className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingBrochureId(null); setEditingCategoryIds([]); }}
                            className="flex-1 px-2 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/60 text-xs font-medium transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                    {editingBrochureNameId === brochure.id ? (
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={editingBrochureName}
                        onChange={(e) => setEditingBrochureName(e.target.value)}
                        placeholder="Template name"
                        className="flex-1 px-2 py-1 rounded-lg bg-card border border-white/10 text-foreground text-xs focus:outline-none focus:border-emerald-500/50"
                      />
                      <button
                        onClick={async () => {
                          if (editingBrochureName.trim()) {
                            try {
                              await base44.entities.BrochureTemplate.update(brochure.id, { name: editingBrochureName });
                              setBrochureTemplates(prev => prev.map(b => b.id === brochure.id ? { ...b, name: editingBrochureName } : b));
                              setEditingBrochureNameId(null);
                              setEditingBrochureName('');
                              toast.success('Name updated');
                            } catch (err) {
                              toast.error('Failed to update');
                            }
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingBrochureNameId(null); setEditingBrochureName(''); }}
                        className="px-1.5 py-1 text-white/40 hover:text-white/70 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {brochure.category_ids && brochure.category_ids.length > 0 ? (
                      brochure.category_ids.map(catId => {
                        const cat = categories.find(c => c.id === catId);
                        return cat ? (
                          <span key={catId} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-400">
                            {cat.name}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-blue-500/15 text-blue-400">
                        All
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setEditingBrochureNameId(brochure.id); setEditingBrochureName(brochure.name); }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 text-xs font-medium transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                      Name
                    </button>
                    <button
                      onClick={() => { setEditingBrochureId(brochure.id); setEditingCategoryIds(brochure.category_ids || []); }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-medium transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                      Cats
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-medium transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleBrochureLogoUpload(brochure.id, e.target.files[0]);
                          }
                        }}
                        disabled={uploadingLogoId === brochure.id}
                        className="hidden"
                      />
                      {uploadingLogoId === brochure.id ? 'Uploading...' : 'Logo'}
                    </label>
                    <button
                      onClick={() => { setSelectedBrochure(brochure); setShowBrochureModal(true); }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-medium transition-all"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                  </div>
                   )}
                  </div>
                  ))}
                  </div>
                  )}
                  </div>
                  )}

        {/* Create Internship Modal */}
        <AnimatePresence>
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
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Templates</h4>
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 font-medium">Load from Template (optional)</label>
                    <select onChange={e => e.target.value && handleLoadTemplate(e.target.value)}
                      className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/60">
                      <option value="">Select a template...</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Basics</h4>

                  <div className="space-y-2">
                    <label className="text-xs text-white/50 font-medium">Internship Title</label>
                    <input value={internshipForm.title} onChange={e => setInternshipForm({...internshipForm, title: e.target.value})}
                      placeholder="e.g. Software Engineer Intern" required className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-rose-500/60" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs text-white/50 font-medium">School</label>
                      <select value={internshipForm.community_id} onChange={e => setInternshipForm({...internshipForm, community_id: e.target.value})}
                        className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/60">
                        <option value="">Select School</option>
                        {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-white/50 font-medium">Career Category</label>
                      <select value={internshipForm.category_id} onChange={e => setInternshipForm({...internshipForm, category_id: e.target.value})}
                        className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/60">
                        <option value="">Select Category</option>
                        {categories.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/50 font-medium">Linked Onboarding Course (auto-populated)</label>
                    <select disabled value="" className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white/50 focus:outline-none focus:border-rose-500/60">
                      <option value="">
                        {(() => {
                          const onboarding = schoolOnboardings.find(so => so.category_id === internshipForm.category_id && so.school_id === internshipForm.community_id);
                          const course = courses.find(c => c.id === onboarding?.course_id);
                          return course?.title || 'No course mapped for this category';
                        })()}
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/50 font-medium">Description</label>
                    <textarea value={internshipForm.description} onChange={e => setInternshipForm({...internshipForm, description: e.target.value})}
                      placeholder="What will interns be doing?" className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-rose-500/60 resize-none h-20" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Logistics</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs text-white/50 font-medium">Start Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/60 transition-all hover:border-rose-500/40 flex items-center justify-between">
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
                      <label className="text-xs text-white/50 font-medium">End Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/60 transition-all hover:border-rose-500/40 flex items-center justify-between">
                            <span>{internshipForm.end_date ? format(parse(internshipForm.end_date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : 'Pick a date'}</span>
                            <CalendarIcon className="w-4 h-4 text-white/40" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={internshipForm.end_date ? parse(internshipForm.end_date, 'yyyy-MM-dd', new Date()) : undefined} onSelect={date => setInternshipForm({...internshipForm, end_date: date ? format(date, 'yyyy-MM-dd') : ''})} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/50 font-medium">Application Deadline</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/60 transition-all hover:border-rose-500/40 flex items-center justify-between">
                          <span>{internshipForm.application_deadline ? format(parse(internshipForm.application_deadline, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy') : 'Pick a date'}</span>
                          <CalendarIcon className="w-4 h-4 text-white/40" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={internshipForm.application_deadline ? parse(internshipForm.application_deadline, 'yyyy-MM-dd', new Date()) : undefined} onSelect={date => setInternshipForm({...internshipForm, application_deadline: date ? format(date, 'yyyy-MM-dd') : ''})} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs text-white/50 font-medium">Number of Openings</label>
                      <input type="number" min="1" value={internshipForm.num_openings} onChange={e => setInternshipForm({...internshipForm, num_openings: e.target.value})}
                        placeholder="e.g. 5" className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-rose-500/60" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-white/50 font-medium">Location Type</label>
                      <select value={internshipForm.location_type} onChange={e => setInternshipForm({...internshipForm, location_type: e.target.value})}
                        className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/60">
                        <option value="remote">Remote</option>
                        <option value="on-site">On-Site</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Milestones</h4>

                  {milestones.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {milestones.map((m, idx) => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/8">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{m.name}</p>
                            <p className="text-xs text-white/40">{m.due_date || 'No due date'}</p>
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
                      className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-rose-500/60"
                    />
                    <textarea
                      value={newMilestone.description}
                      onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                      placeholder="Description (optional)"
                      className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-rose-500/60 resize-none h-12"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-white/40">Due Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/60">
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
                          className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/60"
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
                      className="w-full px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium disabled:opacity-40 transition-all"
                    >
                      <Plus className="w-3 h-3 inline mr-1" /> Add Milestone
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end gap-3 flex-shrink-0">
                <button onClick={() => setShowCreateModal(false)} className="text-xs text-white/40 hover:text-white/70 px-4 py-2 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleCreateInternship}
                  disabled={submitting || !internshipForm.title.trim() || !internshipForm.category_id || !internshipForm.community_id || !internshipForm.start_date || !internshipForm.application_deadline}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold disabled:opacity-40 transition-all shadow-lg shadow-rose-500/20">
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        {/* Save Template Modal */}
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
                className="w-full bg-black/30 border border-rose-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-rose-500/60 mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowSaveTemplate(false)} className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm font-medium transition-colors">Skip</button>
                <button onClick={handleSaveTemplate} disabled={!templateName.trim()} className="flex-1 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold disabled:opacity-40 transition-all">Save</button>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        <BrochurePreviewModal
          isOpen={showBrochureModal}
          onClose={() => setShowBrochureModal(false)}
          brochure={selectedBrochure}
          qrUrl={`${window.location.origin}/internship-signup?invite=PREVIEW_CODE`}
          linkCode="PREVIEW_CODE"
        />

      {/* Category Landing Pages */}
      {internshipTab === 'landing-pages' && (
        <div className="space-y-6">
          <p className="text-sm text-white/50">Preview category-specific landing pages for internship signup.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.filter(c => c.status === 'active').map(cat => (
              <motion.button
                key={cat.id}
                onClick={() => setSelectedCategoryForPreview(cat)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-white/8 p-4 text-left hover:border-white/12 transition-all group"
              >
                <div className="w-full h-20 rounded-lg mb-3 group-hover:opacity-80 transition-opacity"
                  style={{ background: cat.color_scheme || '#0ea5e9' }} />
                <h3 className="text-sm font-semibold text-white truncate">{cat.name}</h3>
                <p className="text-[10px] text-white/40 mt-1">Click to preview</p>
              </motion.button>
            ))}
          </div>

          {/* Preview Modal */}
          <AnimatePresence>
            {selectedCategoryForPreview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                  style={{ background: 'rgba(14,18,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                    <h3 className="text-lg font-bold text-white">{selectedCategoryForPreview.name} — Landing Page</h3>
                    <button
                      onClick={() => setSelectedCategoryForPreview(null)}
                      className="text-white/30 hover:text-white/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="overflow-y-auto flex-1 p-6">
                    <div
                      className="rounded-xl border border-white/8 overflow-hidden"
                      style={{ background: selectedCategoryForPreview.color_scheme || '#0ea5e9', backgroundImage: `linear-gradient(135deg, ${selectedCategoryForPreview.color_scheme || '#0ea5e9'}33 0%, ${selectedCategoryForPreview.color_scheme || '#0ea5e9'}11 100%)` }}
                    >
                      <div className="p-8 text-white">
                        <h1 className="text-4xl font-bold mb-4 font-heading">
                          {categoryLandingPages[selectedCategoryForPreview.id]?.headline || `Welcome to ${selectedCategoryForPreview.name}`}
                        </h1>
                        <p className="text-lg opacity-90 mb-8 max-w-2xl">
                          {categoryLandingPages[selectedCategoryForPreview.id]?.description || 'Join our internship program and launch your career.'}
                        </p>
                        <button className="px-6 py-3 rounded-lg bg-white text-gray-900 font-bold hover:bg-white/90 transition-all">
                          {categoryLandingPages[selectedCategoryForPreview.id]?.cta_text || 'Apply Now'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 p-8 bg-black/20">
                        {(categoryLandingPages[selectedCategoryForPreview.id]?.features || ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4']).map((feature, i) => (
                          <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                            <p className="font-semibold text-white">{feature || `Feature ${i + 1}`}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Category Forms */}
      {internshipTab === 'category-forms' && (
        <div className="space-y-6">
          <p className="text-sm text-white/50">Create and manage landing page forms for each career category.</p>
          
          {editingCategoryForm ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-white/8 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Edit {editingCategoryForm.name} Form</h3>
                <button onClick={() => setEditingCategoryForm(null)} className="text-white/30 hover:text-white/70">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live Preview Section */}
              <div className="mb-8 pb-8 border-b border-white/8">
                <p className="text-xs text-white/50 font-medium uppercase tracking-wider mb-4">Live Preview</p>
                <CategoryLandingPagePreview
                  config={categoryFormData}
                  category={editingCategoryForm}
                />
              </div>

              <div className="space-y-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-2">Landing Page Headline</label>
                  <input
                    type="text"
                    value={categoryFormData.headline}
                    onChange={e => setCategoryFormData({ ...categoryFormData, headline: e.target.value })}
                    placeholder="Main headline for landing page"
                    className="w-full bg-gradient-to-r from-black/60 to-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-white/30 transition-all shadow-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-2">Subheadline</label>
                  <input
                    type="text"
                    value={categoryFormData.subheadline || ''}
                    onChange={e => setCategoryFormData({ ...categoryFormData, subheadline: e.target.value })}
                    placeholder="Secondary headline or tagline"
                    className="w-full bg-gradient-to-r from-black/60 to-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder-white/35 focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-2">Description</label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    placeholder="Compelling description for your landing page..."
                    className="w-full bg-gradient-to-r from-black/60 to-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-white/30 resize-none h-24 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-3">Key Features (4)</label>
                  <div className="space-y-4">
                    {(categoryFormData.features || []).map((feature, i) => {
                      const featureDetails = categoryFormData.feature_details?.[i] || {};
                      return (
                        <div key={i} className="border border-white/8 rounded-xl p-4 bg-white/3">
                          <input
                            type="text"
                            value={feature}
                            onChange={e => {
                              const newFeatures = [...categoryFormData.features];
                              newFeatures[i] = e.target.value;
                              setCategoryFormData({ ...categoryFormData, features: newFeatures });
                            }}
                            placeholder={`Feature ${i + 1} title`}
                            className="w-full bg-gradient-to-r from-black/60 to-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none focus:border-white/30 transition-all mb-2"
                          />
                          <textarea
                            value={featureDetails.description || ''}
                            onChange={e => {
                              const newDetails = { ...categoryFormData.feature_details, [i]: { ...featureDetails, description: e.target.value } };
                              setCategoryFormData({ ...categoryFormData, feature_details: newDetails });
                            }}
                            placeholder={`Describe what makes this feature special...`}
                            className="w-full bg-gradient-to-r from-black/60 to-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 placeholder-white/30 focus:outline-none focus:border-white/30 resize-none h-16 transition-all"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Form Steps Configuration */}
                <div className="border-t border-white/8 pt-6">
                  <label className="text-xs text-white/50 font-medium block mb-3">Signup Form Configuration</label>
                  <p className="text-xs text-white/40 mb-3">Enable/disable form steps and customize questions</p>
                  
                  {/* Step Toggles */}
                  <div className="space-y-2 mb-6">
                    {categoryFormData.form_steps.map((step, i) => (
                      <label key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 hover:bg-white/8 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={step.enabled}
                          onChange={e => {
                            const newSteps = [...categoryFormData.form_steps];
                            newSteps[i].enabled = e.target.checked;
                            setCategoryFormData({ ...categoryFormData, form_steps: newSteps });
                          }}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                        <span className="text-sm text-white/70">{step.step}</span>
                      </label>
                    ))}
                  </div>

                  {/* Form Questions Editor */}
                  <div className="border-t border-white/8 pt-4">
                    <CategoryFormEditor
                      categoryFormData={categoryFormData}
                      setCategoryFormData={setCategoryFormData}
                      categoryName={editingCategoryForm.name}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs text-white/50 font-medium block mb-2">CTA Button Text</label>
                     <input
                       type="text"
                       value={categoryFormData.cta_text}
                       onChange={e => setCategoryFormData({ ...categoryFormData, cta_text: e.target.value })}
                       placeholder="e.g., Start Your Journey"
                       className="w-full bg-gradient-to-r from-black/60 to-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-white/30 transition-all"
                     />
                   </div>
                   <div>
                     <label className="text-xs text-white/50 font-medium block mb-2">Primary Color</label>
                     <div className="flex gap-2">
                       <input
                         type="color"
                         value={categoryFormData.color_scheme}
                         onChange={e => setCategoryFormData({ ...categoryFormData, color_scheme: e.target.value })}
                         className="w-14 h-10 rounded-lg cursor-pointer border-2 border-white/10 hover:border-white/20 transition-all"
                       />
                       <input
                         type="text"
                         value={categoryFormData.color_scheme}
                         onChange={e => setCategoryFormData({ ...categoryFormData, color_scheme: e.target.value })}
                         className="flex-1 bg-gradient-to-r from-black/60 to-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-white/30 transition-all"
                       />
                     </div>
                   </div>
                 </div>

                 <div className="border-t border-white/8 pt-6 mt-6">
                   <label className="text-xs text-white/50 font-medium block mb-3">Hero Image (Optional)</label>
                   <input
                     type="text"
                     value={categoryFormData.hero_image_url || ''}
                     onChange={e => setCategoryFormData({ ...categoryFormData, hero_image_url: e.target.value })}
                     placeholder="Image URL for landing page hero"
                     className="w-full bg-gradient-to-r from-black/60 to-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-white/30 transition-all"
                   />
                 </div>

                 <div className="flex gap-3 pt-6">
                  <button
                    onClick={async () => {
                      if (!categoryFormData.headline?.trim() || !categoryFormData.description?.trim() || !categoryFormData.color_scheme?.trim()) {
                        toast.error('Headline, description, and color are required');
                        return;
                      }
                      await base44.entities.CareerCategory.update(editingCategoryForm.id, { landing_config: categoryFormData });
                      setCategories(prev => prev.map(c => c.id === editingCategoryForm.id ? { ...c, landing_config: categoryFormData } : c));
                      setCategoryLandingPages(prev => ({ ...prev, [editingCategoryForm.id]: categoryFormData }));
                      toast.success('Configuration saved successfully');
                      setEditingCategoryForm(null);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/30 to-emerald-500/20 hover:from-emerald-500/40 hover:to-emerald-500/30 text-emerald-400 text-sm font-bold transition-all border border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                  >
                    ✓ Save Configuration
                  </button>
                   <button
                     onClick={() => setEditingCategoryForm(null)}
                     className="flex-1 px-4 py-3 rounded-xl bg-white/8 hover:bg-white/12 text-white/60 hover:text-white/80 text-sm font-medium transition-all border border-white/10 hover:border-white/20"
                   >
                     Cancel
                   </button>
                 </div>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.filter(c => c.status === 'active').map(cat => {
                const config = categoryLandingPages[cat.id];
                const isConfigured = config?.headline && config?.description;
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => {
                      setEditingCategoryForm(cat);
                      setCategoryFormData(categoryLandingPages[cat.id] || {
                        headline: '',
                        subheadline: '',
                        description: '',
                        features: ['', '', '', ''],
                        cta_text: 'Start Your Journey',
                        color_scheme: '#22c55e',
                        form_steps: [
                          { step: 'Basic Info', enabled: true },
                          { step: 'Background', enabled: true },
                          { step: 'Education', enabled: true },
                          { step: 'Tech Skills', enabled: true },
                          { step: 'AI & No-Code', enabled: true },
                          { step: 'Goals', enabled: true },
                          { step: 'Availability', enabled: true },
                          { step: 'Final Steps', enabled: true },
                        ],
                      });
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative rounded-xl p-4 text-left border transition-all group overflow-hidden ${
                      isConfigured
                        ? 'glass border-white/12 hover:border-white/20 hover:shadow-lg hover:shadow-white/5'
                        : 'glass border-white/6 hover:border-white/12 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Gradient background effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                          {config?.subheadline && <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{config.subheadline}</p>}
                        </div>
                        <Edit2 className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0 mt-0.5" />
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        {isConfigured ? (
                          <>
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ Configured</span>
                            <span className="text-[10px] text-white/40">{config.form_steps?.filter(s => s.enabled).length || 0} steps</span>
                          </>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Set up required</span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      )}
        </div>
        );
        }