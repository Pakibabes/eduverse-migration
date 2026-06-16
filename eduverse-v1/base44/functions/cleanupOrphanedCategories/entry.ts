import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all valid career categories
    const categories = await base44.asServiceRole.entities.CareerCategory.list();
    const validCategoryIds = new Set(categories.map(c => c.id));

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();

    let cleaned = 0;
    for (const u of users) {
      if (u.categories && Array.isArray(u.categories)) {
        const validCategories = u.categories.filter(catId => validCategoryIds.has(catId));
        
        // Only update if categories changed
        if (validCategories.length !== u.categories.length) {
          await base44.asServiceRole.entities.User.update(u.id, { categories: validCategories });
          cleaned++;
        }
      }
    }

    return Response.json({ 
      success: true, 
      cleaned,
      message: `Cleaned up orphaned categories from ${cleaned} user(s)`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});