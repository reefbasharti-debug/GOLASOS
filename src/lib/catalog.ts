export type CatalogCategory = {
  slug: string;
  name: string;
  kind: string;
  group_name: string;
  group_order: number;
  image_url?: string | null;
  logo_url?: string | null;
  description?: string | null;
};

export type CatalogGroupMeta = { name: string; image_url: string | null };

export const KIND_LABEL: Record<string, string> = {
  club: "קבוצות מועדון",
  national: "נבחרות לאומיות",
  retro: "חולצות רטרו",
  shoes: "נעלי כדורגל",
  mixed: "קולקציות נוספות",
};

export type CategoryGroup<T extends CatalogCategory> = {
  name: string;
  kind: string;
  image_url: string | null;
  items: T[];
};

/** Groups categories by league / collection (group_name), preserving group_order. */
export function groupCategories<T extends CatalogCategory>(
  categories: T[],
  groupMeta: CatalogGroupMeta[] = [],
): CategoryGroup<T>[] {
  const logos = new Map(groupMeta.map((g) => [g.name, g.image_url]));
  const map = new Map<string, CategoryGroup<T> & { order: number }>();
  for (const c of categories) {
    const key = c.group_name || KIND_LABEL[c.kind] || KIND_LABEL["mixed"]!;
    const g = map.get(key) ?? {
      name: key,
      kind: c.kind,
      image_url: logos.get(key) ?? null,
      items: [],
      order: c.group_order,
    };
    g.items.push(c);
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => a.order - b.order);
}
