import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all courses and delete them
    const courses = await base44.asServiceRole.entities.Course.list();
    let deleted = 0;

    for (const course of courses) {
      await base44.asServiceRole.entities.Course.delete(course.id);
      deleted++;
    }

    return Response.json({ success: true, deleted, message: `Deleted ${deleted} course(s)` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});