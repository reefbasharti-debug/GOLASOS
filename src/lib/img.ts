/** Build a same-origin URL for a supplier image (or return local/own URLs as-is). */
export function imageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.includes("yupoo.com")) {
    return `/api/public/img?u=${encodeURIComponent(url)}`;
  }
  return url;
}
