import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, Eye } from "lucide-react";
import { imageUrl } from "@/lib/img";
import { useLang } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

export type ProductCardData = {
  id: string;
  name: string;
  image_url: string | null;
  price_ils: number;
  product_type: string;
  extra_images?: string[];
  created_at?: string;
  sizes?: string[] | null;
};

const NEW_DAYS = 30;

export function ProductCard({ product }: { product: ProductCardData }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const { add } = useCart();
  const thumbs = [product.image_url, ...(product.extra_images ?? [])].filter(Boolean).slice(0, 4) as string[];
  const [active, setActive] = useState(0);
  const isNew = product.created_at
    ? Date.now() - new Date(product.created_at).getTime() < NEW_DAYS * 86400000
    : false;
  const main = thumbs[active] ?? product.image_url;
  const defaultSize = product.sizes?.[0];

  function handleAdd() {
    if (!defaultSize) {
      void navigate({ to: "/product/$id", params: { id: product.id } });
      return;
    }
    add({
      productId: product.id,
      name: product.name,
      image: product.image_url,
      price: Number(product.price_ils),
      size: defaultSize,
      quantity: 1,
    });
  }

  return (
    <div className="group flex flex-col">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="focus-key relative block aspect-square overflow-hidden bg-muted"
      >
        {main ? (
          <img
            src={imageUrl(main)}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {isNew ? (
          <span className="absolute start-0 top-2 bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
            {t("new_badge")}
          </span>
        ) : null}
      </Link>

      {thumbs.length > 1 ? (
        <div className="mt-2 flex justify-center gap-1.5">
          {thumbs.map((src, i) => (
            <button
              key={src + i}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              className={`focus-key size-10 overflow-hidden border ${i === active ? "border-foreground" : "border-border"}`}
              aria-label={`${product.name} ${i + 1}`}
              aria-pressed={i === active}
            >
              <img src={imageUrl(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-2 h-10" />
      )}

      <Link to="/product/$id" params={{ id: product.id }} className="focus-key mt-2 block text-center">
        <h3 className="line-clamp-2 min-h-10 text-sm leading-5 hover:text-primary/70">{product.name}</h3>
        <p className="mt-1 text-sm font-bold">₪ {Number(product.price_ils)}</p>
      </Link>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={handleAdd} className="btn-critical-sm h-10 px-1.5 text-xs leading-none">
          <ShoppingBag className="size-3.5 shrink-0" />
          <span className="whitespace-nowrap">{t("add_short")}</span>
        </button>
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="btn-critical-ghost h-10 px-1.5 text-xs leading-none"
          aria-label={`${t("view_product")} – ${product.name}`}
        >
          <Eye className="size-3.5 shrink-0" />
          <span className="whitespace-nowrap">{t("view_short")}</span>
        </Link>
      </div>
    </div>
  );
}
