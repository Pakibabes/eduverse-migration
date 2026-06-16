import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { internship_id, school_id, category_id, cohort_id, description } = body;

    if (!internship_id || !school_id || !category_id) {
      return Response.json({ error: 'Missing required fields: internship_id, school_id, category_id' }, { status: 400 });
    }

    // Generate unique code using Web Crypto API
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    const code = Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');

    // Create invite link
    const inviteLink = await base44.entities.InviteLink.create({
      code,
      internship_id,
      school_id,
      category_id,
      cohort_id: cohort_id || null,
      role: 'student',
      is_active: true,
      created_by_id: user.id,
      description: description || `Internship signup link`,
    });

    return Response.json(inviteLink);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});