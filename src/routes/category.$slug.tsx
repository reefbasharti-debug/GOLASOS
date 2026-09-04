import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { getCategoryPage } from "@/lib/store.functions";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const data = await getCategoryPage({ data: { slug: params.slug } });
    if (!data.category) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "הקטגוריה לא נמצאה | גולאסוס" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.category!.name} | גולאסוס`;
    const description = `${loaderData.products.length} מוצרים בקטגוריה ${loaderData.category!.name} — הזמנה ישירה באתר גולאסוס.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">הקטגוריה לא נמצאה</h1>
      <Link to="/categories" className="mt-4 inline-block font-semibold text-muted-foreground">
        חזרה לכל הקטגוריות
      </Link>
    </div>
  ),
});

function CategoryPage() {
  const { category, products } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="text-xs text-muted-foreground">
        <Link to="/">דף הבית</Link> / <Link to="/categories">קטגוריות</Link>
        {category!.group_name ? <> / {category!.group_name}</> : null} / {category!.name}
      </nav>
      <h1 className="mt-2 text-2xl font-bold">{category!.name}</h1>
      {category!.description ? (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{category!.description}</p>
      ) : null}
      <p className="mt-1 text-sm text-muted-foreground">{products.length} מוצרים</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">אין מוצרים בקטגוריה זו כרגע.</p>
      ) : null}
    </div>
  );
}
