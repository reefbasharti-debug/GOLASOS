import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { CategoryTile, GroupBadge } from "@/components/CategoryTile";
import { groupCategories } from "@/lib/catalog";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "כל הקטגוריות | גולאסוס" },
      {
        name: "description",
        content: "קטגוריות חולצות כדורגל לפי ליגות, קבוצות, נבחרות, דגמי רטרו ונעלי כדורגל.",
      },
      { property: "og:title", content: "כל הקטגוריות | גולאסוס" },
      { property: "og:description", content: "בחרו ליגה, קבוצה, נבחרת או נעליים והזמינו ישירות באתר." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { categories, groups: groupMeta } = rootApi.useLoaderData();
  const groups = groupCategories(categories, groupMeta);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">כל הקטגוריות</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {categories.length} קטגוריות ב-{groups.length} ליגות וקולקציות.
      </p>

      <nav className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        {groups.map((g) => (
          <a
            key={g.name}
            href={`#g-${encodeURIComponent(g.name)}`}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-secondary"
          >
            <GroupBadge name={g.name} image={g.image_url} className="h-4 w-4" />
            {g.name}
          </a>
        ))}
      </nav>

      {groups.map((g) => (
        <section key={g.name} id={`g-${encodeURIComponent(g.name)}`} className="mt-10 scroll-mt-20">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <GroupBadge name={g.name} image={g.image_url} className="h-7 w-7" />
            {g.name}
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {g.items.map((c) => (
              <CategoryTile key={c.slug} slug={c.slug} name={c.name} image={c.image_url} logo={c.logo_url} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
