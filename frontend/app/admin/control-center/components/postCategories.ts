export const BUILT_IN_POST_CATEGORIES = ['Formats', 'Performance', 'Engineering', 'Best Practices'];
export const CUSTOM_POST_CATEGORIES_KEY = 'resizer_superadmin_post_categories';

export function loadCustomPostCategories(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = JSON.parse(localStorage.getItem(CUSTOM_POST_CATEGORIES_KEY) || '[]');
    return Array.isArray(stored)
      ? stored.filter((category): category is string => typeof category === 'string' && category.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

export function saveCustomPostCategories(categories: string[]) {
  localStorage.setItem(CUSTOM_POST_CATEGORIES_KEY, JSON.stringify(categories));
  window.dispatchEvent(new CustomEvent('resizer-post-categories-updated'));
}