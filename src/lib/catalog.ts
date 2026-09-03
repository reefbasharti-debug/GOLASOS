export type CatalogCategory = {
  slug: string;
  name: string;
  kind: string;
  group_name: string;
  group_order: number;
  image_url?: string | null;
  description?: string | null;
};

export const KIND_LABEL: Record<string, string> = {
  club: "קבוצות מועדון",
  national: "נבחרות לאומיות",
  retro: "חולצות רטרו",
  shoes: "נעלי כדורגל",
  mixed: "קולקציות נוספות",
};

export type CategoryGroup<T extends CatalogCategory> = { name: string; kind: string; items: T[] };

/** Groups categories by league / collection (group_name), preserving group_order. */
export function groupCategories<T extends CatalogCategory>(categories: T[]): CategoryGroup<T>[] {
  const map = new Map<string, CategoryGroup<T> & { order: number }>();
  for (const c of categories) {
    const key = c.group_name || KIND_LABEL[c.kind] || KIND_LABEL["mixed"]!;
    const g = map.get(key) ?? { name: key, kind: c.kind, items: [], order: c.group_order };
    g.items.push(c);
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => a.order - b.order);
}
