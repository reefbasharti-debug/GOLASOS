import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { CategoryTile } from "@/components/CategoryTile";

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
          <CategoryTile key={c.slug} slug={c.slug} name={c.name} image={c.image_url} size="md" />
        ))}
      </div>
    </div>
  );
}
