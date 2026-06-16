import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function getSeasonFromDate(dateStr) {
  if (!dateStr) return 'Spring';
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 9) return 'Fall';
  return 'Winter';
}

function getCohortDisplayName(season, year) {
  return `${season} ${year}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all internships and cohorts
    const [allInternships, allCohorts] = await Promise.all([
      base44.asServiceRole.entities.Internship.list(),
      base44.asServiceRole.entities.InternshipCohort.list(),
    ]);

    // Filter internships without cohort_id
    const internshipsNeedingCohorts = allInternships.filter(i => !i.cohort_id);
    let updated = 0;
    let failed = 0;

    for (const internship of internshipsNeedingCohorts) {
      if (!internship.start_date || !internship.career_category_id) {
        failed++;
        continue;
      }

      const season = getSeasonFromDate(internship.start_date);
      const year = new Date(internship.start_date).getFullYear();
      
      // Find existing cohort
      let cohortId = null;
      const existingCohort = allCohorts.find(
        c => c.season === season && c.year === year && c.career_category_id === internship.career_category_id
      );
      
      if (existingCohort) {
        cohortId = existingCohort.id;
      } else {
        // Create new cohort
        const created = await base44.asServiceRole.entities.InternshipCohort.create({
          name: getCohortDisplayName(season, year),
          season,
          year,
          career_category_id: internship.career_category_id,
          status: 'open',
        });
        cohortId = created.id;
        allCohorts.push(created);
      }

      // Update internship with cohort_id
      await base44.asServiceRole.entities.Internship.update(internship.id, {
        cohort_id: cohortId,
      });
      
      updated++;
    }

    return Response.json({
      success: true,
      message: `Updated ${updated} internships with cohort assignments`,
      updated,
      failed,
      total: internshipsNeedingCohorts.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});