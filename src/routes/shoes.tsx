import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { imageUrl } from "@/lib/img";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/shoes")({
  head: () => ({
    meta: [
      { title: "נעלי כדורגל | גולאסוס" },
      {
        name: "description",
        content: "אלפי דגמי נעלי כדורגל של נייקי, אדידס, פומה, מיזונו ועוד — לפי סדרה, סוג משטח ומידה. 350 ₪ לזוג.",
      },
      { property: "og:title", content: "נעלי כדורגל | גולאסוס" },
      { property: "og:description", content: "נעלי כדורגל לפי מותג וסדרה, ב-350 ₪ לזוג עם משלוח לכל הארץ." },
    ],
  }),
  component: ShoesPage,
});

function ShoesPage() {
  const { categories, settings } = rootApi.useLoaderData();
  const shoes = categories.filter((c) => c.kind === "shoes");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">נעלי כדורגל</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {shoes.length} סדרות • כל זוג {settings["shoe_price"] ?? "350"} ₪ • בחרו סדרה כדי לראות את כל הצבעים והמידות.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {shoes.map((c) => (
          <Link
            key={c.slug}
            to="/category/$slug"
            params={{ slug: c.slug }}
            className="card-hover overflow-hidden rounded-lg border bg-card text-center"
          >
            <div className="aspect-square bg-muted">
              {c.image_url ? (
                <img src={imageUrl(c.image_url)} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <p className="line-clamp-2 p-2 text-sm font-semibold leading-5">{c.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
