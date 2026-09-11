import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getStoreData } from "@/lib/store.functions";
import { CartProvider } from "@/lib/cart";
import { LangProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { PurchaseToasts } from "@/components/PurchaseToasts";
import { ChatWidget } from "@/components/ChatWidget";
import { CookieConsent } from "@/components/CookieConsent";

function NotFoundComponent() {
  const links: Array<{ to: string; label: string }> = [
    { to: "/", label: "דף הבית" },
    { to: "/browse", label: "כל המוצרים" },
    { to: "/shoes", label: "נעלי כדורגל" },
    { to: "/mystery-box", label: "מיסטרי בוקס" },
    { to: "/tracking", label: "מעקב הזמנה" },
    { to: "/contact", label: "צור קשר" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="font-display text-7xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">הדף לא נמצא</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        הדף שחיפשתם אינו קיים, הועבר או שהמוצר כבר לא במלאי. אפשר להמשיך מכאן:
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="btn-critical-ghost focus-key inline-flex min-h-11 items-center rounded-md px-4 text-sm font-bold"
          >
            {l.label}
          </Link>
        ))}
      </div>
      <Link
        to="/browse"
        className="btn-critical focus-key mt-8 inline-flex min-h-12 items-center rounded-md px-8 text-base font-extrabold"
      >
        התחילו לקנות
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">הדף לא נטען</h1>
        <p className="mt-2 text-sm text-muted-foreground">משהו לא עבד. אפשר לרענן או לחזור לדף הבית.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            נסה שוב
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            דף הבית
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "גולאסוס | חולצות ונעלי כדורגל" },
      {
        name: "description",
        content: "חולצות כדורגל ונעלי כדורגל של קבוצות ונבחרות מכל העולם, במשלוח לכל הארץ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&family=Rubik:wght@500;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
  }),
  loader: () => getStoreData(),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const data = Route.useLoaderData();

  // Remember the referral code from a shared "?ref=" link for later checkout.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("golassos-ref", ref.trim().slice(0, 20).toUpperCase());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col overflow-x-clip">
          <Header categories={data?.categories ?? []} groups={data?.groups ?? []} settings={data?.settings ?? {}} />
          <main className="flex-1">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </main>
          <Footer settings={data?.settings ?? {}} groups={data?.groups ?? []} />
        </div>
        <PurchaseToasts products={data?.ticker ?? []} />
        <ChatWidget />
        <CookieConsent />
        <Toaster position="top-center" richColors />
      </CartProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}
