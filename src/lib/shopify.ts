import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/lib/cart";

/** Storefront API — public credentials, safe in the browser. */
const SHOPIFY_API_VERSION = "2025-07";
const SHOPIFY_STORE_PERMANENT_DOMAIN = "lovable-project-cuw7m-pqzrvzac.myshopify.com";
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = "486e40d4be881d9a4d43e4846e2ed593";

type Json = Record<string, unknown>;

export async function storefrontApiRequest(query: string, variables: Json = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    throw new Error("SHOPIFY_BILLING_REQUIRED");
  }
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as {
    data?: Record<string, any>;
    errors?: Array<{ message: string }>;
  };
  if (data.errors?.length) {
    throw new Error(`Error calling Shopify: ${data.errors.map((e) => e.message).join(", ")}`);
  }
  return data;
}

const PRODUCT_VARIANTS_QUERY = `
  query ProductVariants($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        variants(first: 50) {
          edges { node { id title availableForSale } }
        }
      }
    }
  }
`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
      }
      userErrors { field message }
    }
  }
`;

function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

export type CheckoutResult =
  | { ok: true; checkoutUrl: string; cartId: string }
  | { ok: false; reason: "unmapped"; missing: string[] }
  | { ok: false; reason: "error"; message: string };

/**
 * Turns the local cart into a real Shopify cart and returns its checkout URL.
 * Items whose product is not synced to Shopify yet are reported back.
 */
export async function createShopifyCheckout(items: CartItem[]): Promise<CheckoutResult> {
  if (items.length === 0) return { ok: false, reason: "error", message: "Cart is empty" };

  const productIds = [...new Set(items.map((i) => i.productId))];
  const { data: rows, error } = await supabase
    .from("products")
    .select("id, name, shopify_product_id")
    .in("id", productIds);

  if (error) return { ok: false, reason: "error", message: error.message };

  const shopifyByLocalId = new Map<string, string>();
  for (const row of rows ?? []) {
    if (row.shopify_product_id) shopifyByLocalId.set(row.id, row.shopify_product_id);
  }

  const missing = items.filter((i) => !shopifyByLocalId.has(i.productId)).map((i) => i.name);
  if (missing.length > 0) return { ok: false, reason: "unmapped", missing: [...new Set(missing)] };

  const gids = [...new Set([...shopifyByLocalId.values()])].map(
    (id) => `gid://shopify/Product/${id}`,
  );

  let variantsByProduct: Map<string, Array<{ id: string; title: string }>>;
  try {
    const data = await storefrontApiRequest(PRODUCT_VARIANTS_QUERY, { ids: gids });
    variantsByProduct = new Map();
    for (const node of (data.data?.["nodes"] ?? []) as Array<any>) {
      if (!node?.id) continue;
      variantsByProduct.set(
        node.id,
        (node.variants?.edges ?? []).map((e: any) => ({ id: e.node.id, title: e.node.title })),
      );
    }
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message };
  }

  const lines: Array<{ merchandiseId: string; quantity: number }> = [];
  const unresolved: string[] = [];

  for (const item of items) {
    const gid = `gid://shopify/Product/${shopifyByLocalId.get(item.productId)}`;
    const variants = variantsByProduct.get(gid) ?? [];
    const match =
      variants.find((v) => v.title === item.size) ??
      variants.find((v) => v.title.toLowerCase() === item.size.toLowerCase()) ??
      variants[0];
    if (!match) {
      unresolved.push(item.name);
      continue;
    }
    lines.push({ merchandiseId: match.id, quantity: item.quantity });
  }

  if (unresolved.length > 0) return { ok: false, reason: "unmapped", missing: unresolved };

  try {
    const data = await storefrontApiRequest(CART_CREATE_MUTATION, { input: { lines } });
    const result = data.data?.["cartCreate"];
    if (result?.userErrors?.length) {
      return { ok: false, reason: "error", message: result.userErrors[0].message };
    }
    const cart = result?.cart;
    if (!cart?.checkoutUrl) return { ok: false, reason: "error", message: "No checkout URL" };
    return { ok: true, cartId: cart.id, checkoutUrl: formatCheckoutUrl(cart.checkoutUrl) };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message };
  }
}
