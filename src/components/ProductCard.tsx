import { Link } from "@tanstack/react-router";
import { imageUrl } from "@/lib/img";

export type ProductCardData = {
  id: string;
  name: string;
  image_url: string | null;
  price_ils: number;
  product_type: string;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="card-hover group block overflow-hidden rounded-lg border bg-card"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={imageUrl(product.image_url)}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="space-y-2 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5">{product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold">{Number(product.price_ils)} ₪</span>
          <span className="rounded surface-gold px-2 py-0.5 text-xs font-semibold">
            {product.product_type === "shoes" ? "נעליים" : "חולצה"}
          </span>
        </div>
      </div>
    </Link>
  );
}
