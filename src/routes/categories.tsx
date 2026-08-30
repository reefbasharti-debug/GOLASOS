import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { imageUrl } from "@/lib/img";

const rootApi = getRouteApi("__root__");

const KIND_LABEL: Record<string, string> = {
  club: "קבוצות מועדון",
  national: "נבחרות לאומיות",
  retro: "חולצות רטרו",
  shoes: "נעלי כדורגל",
  mixed: "קולקציות נוספות",
};

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "כל הקטגוריות | גולאסוס" },
      {
        name: "description",
        content: "קטגוריות חולצות כדורגל לפי קבוצות, נבחרות, דגמי רטרו ונעלי כדורגל.",
      },
      { property: "og:title", content: "כל הקטגוריות | גולאסוס" },
      { property: "og:description", content: "בחרו קבוצה, נבחרת או נעליים והזמינו ישירות באתר." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { categories } = rootApi.useLoaderData();
  const groups = Object.entries(
    categories.reduce<Record<string, typeof categories>>((acc, c) => {
      const key = KIND_LABEL[c.kind] ? c.kind : "mixed";
      acc[key] = [...(acc[key] ?? []), c];
      return acc;
    }, {}),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">כל הקטגוריות</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {categories.length} קטגוריות זמינות להזמנה ישירה באתר.
      </p>

      {groups.map(([kind, list]) => (
        <section key={kind} className="mt-10">
          <h2 className="mb-4 text-xl font-bold">{KIND_LABEL[kind]}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {list.map((c) => (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="card-hover overflow-hidden rounded-lg border bg-card text-center"
              >
                <div className="aspect-square bg-muted">
                  {c.image_url ? (
                    <img
                      src={imageUrl(c.image_url)}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <p className="p-2 text-sm font-semibold">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
