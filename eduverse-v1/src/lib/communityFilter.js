/**
 * Filters communities/courses based on user categories and country
 * Logic: user must match at least one of entity's categories AND country (if specified)
 */
export function filterEntitiesByUserAccess(entities, user) {
  if (!user || !user.categories) return [];
  
  return entities.filter(entity => {
    const entityCategories = entity.category_ids || [];
    
    // If entity has category restrictions, user must match at least one
    if (entityCategories.length > 0) {
      const categoryMatch = entityCategories.some(catId => user.categories.includes(catId));
      if (!categoryMatch) return false;
    }
    
    // If entity has country restriction, user's country must match
    if (entity.country && entity.country !== user.country) {
      return false;
    }
    
    return true;
  });
}