/**
 * Convert a camelCase or snake_case string into a human-readable Title Case label.
 * All-uppercase tokens (acronyms) are preserved as-is.
 * Examples:
 *   bankAccount       → "Bank Account"
 *   standardChartered → "Standard Chartered"
 *   cpf               → "CPF"
 *   DBS               → "DBS"
 *   place_type        → "Place Type"
 *   morganStanley     → "Morgan Stanley"
 */
export function formatLabel(value: string): string {
  if (!value) return value;

  // Split on snake_case underscores first, then camelCase transitions
  const tokens = value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean);

  return tokens
    .map(token => {
      // If the token is already all-uppercase (acronym), keep it
      if (token === token.toUpperCase()) return token.toUpperCase();
      // Otherwise Title-Case it
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Mapping from category value → valid place_type values.
 * Custom categories (not in this map) will receive the full list.
 */
export const CATEGORY_PLACE_TYPES: Record<string, string[]> = {
  bankAccount: ['bank'],
  fund: ['bank', 'broker'],
  equity: ['broker'],
  cpf: ['cpf'],
};

/**
 * Returns the filtered list of place types for a given category.
 * Falls back to allPlaceTypes if the category is not in the mapping.
 */
export function placeTypesForCategory(
  category: string,
  allPlaceTypes: string[]
): string[] {
  const allowed = CATEGORY_PLACE_TYPES[category];
  if (!allowed) return allPlaceTypes;
  return allPlaceTypes.filter(pt => allowed.includes(pt));
}
