import { Link } from "@tanstack/react-router";
import { imageUrl } from "@/lib/img";

type Props = {
  slug: string;
  name: string;
  image?: string | null | undefined;
  logo?: string | null | undefined;
  size?: "sm" | "md";
};

/** Category tile: shows the official crest when available, otherwise the product photo. */
export function CategoryTile({ slug, name, image, logo, size = "sm" }: Props) {
  return (
    <Link
      to="/category/$slug"
      params={{ slug }}
      className="card-hover overflow-hidden rounded-lg border bg-card text-center"
    >
      <div className={logo ? "flex aspect-square items-center justify-center bg-card p-3" : "aspect-square bg-muted"}>
        {logo ? (
          <img src={logo} alt={`סמל ${name}`} loading="lazy" className="h-full w-full object-contain" />
        ) : image ? (
          <img src={imageUrl(image)} alt={name} loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <p
        className={
          size === "md"
            ? "line-clamp-2 p-2 text-sm font-semibold leading-5"
            : "line-clamp-2 px-1 py-1.5 text-xs font-semibold leading-4"
        }
      >
        {name}
      </p>
    </Link>
  );
}

/** Small league / collection badge used next to group headings and nav chips. */
export function GroupBadge({ name, image, className = "h-6 w-6" }: { name: string; image?: string | null | undefined; className?: string }) {
  if (!image) return null;
  return <img src={image} alt={`סמל ${name}`} loading="lazy" className={`${className} shrink-0 object-contain`} />;
}
