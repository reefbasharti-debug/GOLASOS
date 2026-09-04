import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Gift, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getMysteryBox } from "@/lib/store.functions";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import mysteryBoxImg from "@/assets/mystery-box.jpg";

export const Route = createFileRoute("/mystery-box")({
  loader: () => getMysteryBox(),
  head: () => {
    const title = "מיסטרי בוקס — חולצת כדורגל בהפתעה | גולאסוס";
    const description =
      "מיסטרי בוקס של גולאסוס: חולצת כדורגל מסתורית באיכות מעולה. בוחרים גודל, סוג והעדפות — ואנחנו דואגים להפתעה.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: MysteryBoxPage,
});

const ADULT_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];
const KID_SIZES = ["16 (3-4)", "18 (5-6)", "20 (7-8)", "22 (9-10)", "24 (11-12)", "26 (13-14)"];

const SEASONS = [
  ["current", "עונה נוכחית 2025/26", "Current season 2025/26"],
  ["new", "עונה חדשה 2026/27", "New season 2026/27"],
  ["retro", "רטרו קלאסי", "Retro classic"],
  ["surprise", "שיהיה הפתעה מלאה", "Full surprise"],
] as const;

const KINDS = [
  ["home", "חולצת בית", "Home kit"],
  ["away", "חולצת חוץ", "Away kit"],
  ["third", "חולצה שלישית", "Third kit"],
  ["national", "נבחרת לאומית", "National team"],
  ["surprise", "שיהיה הפתעה מלאה", "Full surprise"],
] as const;

function MysteryBoxPage() {
  const { box, patch } = Route.useLoaderData();
  const { add } = useCart();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const [audience, setAudience] = useState<"adult" | "kids">("adult");
  const [size, setSize] = useState("");
  const [season, setSeason] = useState<string>("surprise");
  const [kind, setKind] = useState<string>("surprise");
  const [teams, setTeams] = useState("");
  const [avoid, setAvoid] = useState("");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [withPatch, setWithPatch] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const he = lang === "he";
  const sizes = audience === "adult" ? ADULT_SIZES : KID_SIZES;
  const boxPrice = Number(box?.price_ils ?? 159);
  const patchPrice = Number(patch?.price_ils ?? 10);
  const unit = boxPrice + (withPatch && patch ? patchPrice : 0);
  const total = useMemo(() => unit * quantity, [unit, quantity]);

  const addToCart = (goToCart: boolean) => {
    if (!box) {
      toast.error(he ? "המיסטרי בוקס אינו זמין כרגע" : "Mystery box is unavailable");
      return;
    }
    if (!size) {
      toast.error(t("choose_size"));
      return;
    }
    const seasonLabel = SEASONS.find((s) => s[0] === season)![he ? 1 : 2];
    const kindLabel = KINDS.find((k) => k[0] === kind)![he ? 1 : 2];
    const parts: string[] = [seasonLabel, kindLabel];
    if (teams.trim()) parts.push(`${he ? "מועדפות" : "Favourites"}: ${teams.trim()}`);
    if (avoid.trim()) parts.push(`${he ? "לא רוצה" : "Avoid"}: ${avoid.trim()}`);
    if (name.trim() || number.trim()) parts.push(`${name.trim()} ${number.trim()}`.trim());
    if (withPatch) parts.push(he ? "כולל פאץ' רשמי" : "With official patch");

    add({
      productId: box.id,
      name: box.name,
      image: null,
      price: boxPrice,
      size: `${audience === "adult" ? (he ? "בוגרים" : "Adult") : he ? "ילדים" : "Kids"} ${size}`,
      quantity,
      custom: parts.join(" | ").slice(0, 78),
    });

    if (withPatch && patch) {
      add({
        productId: patch.id,
        name: patch.name,
        image: null,
        price: patchPrice,
        size: "",
        quantity,
      });
    }

    toast.success(t("added_to_cart"));
    if (goToCart) navigate({ to: "/cart" });
  };

  const optionBtn = (active: boolean) =>
    `rounded-md border px-3 py-2 text-sm font-semibold transition ${
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <nav className="text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">
          {t("home")}
        </Link>
        {" > "}
        <span className="text-foreground">{he ? "מיסטרי בוקס" : "Mystery Box"}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,52%)_1fr]">
        <div>
          <div className="overflow-hidden rounded-lg bg-navy/5">
            <img
              src={mysteryBoxImg}
              alt={he ? "מיסטרי בוקס גולאסוס" : "Golassos Mystery Box"}
              width={1024}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              [Sparkles, he ? "חולצה מקורית באיכות מעולה" : "Top quality jersey"],
              [ShieldCheck, he ? "שווי גבוה מהמחיר" : "Value above price"],
              [Truck, he ? "משלוח לכל הארץ" : "Nationwide shipping"],
            ].map(([Icon, label], i) => {
              const I = Icon as typeof Sparkles;
              return (
                <div key={i} className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
                  <I className="h-4 w-4 text-accent" />
                  <span>{label as string}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{he ? "מיסטרי בוקס" : "Mystery Box"}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {he
              ? "אתם בוחרים גודל והעדפות, ואנחנו שולחים חולצת כדורגל מסתורית בשווי גבוה מהמחיר ששילמתם. ההפתעה מובטחת — ואפשר גם שם ומספר על הגב."
              : "Choose your size and preferences and we ship a surprise football jersey worth more than you paid. Personalisation available."}
          </p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary">{total} ₪</span>
            {quantity > 1 || withPatch ? (
              <span className="text-sm text-muted-foreground">
                ({unit} ₪ {he ? "ליחידה" : "each"})
              </span>
            ) : null}
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 text-sm font-bold">{he ? "בוגרים / ילדים" : "Adults / Kids"}</div>
              <div className="flex gap-2">
                {(["adult", "kids"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAudience(a);
                      setSize("");
                    }}
                    className={optionBtn(audience === a)}
                  >
                    {a === "adult" ? (he ? "בוגרים" : "Adults") : he ? "ילדים" : "Kids"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-bold">{t("size")}</div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button key={s} type="button" onClick={() => setSize(s)} className={optionBtn(size === s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-bold">{he ? "עונה" : "Season"}</div>
              <div className="flex flex-wrap gap-2">
                {SEASONS.map((s) => (
                  <button key={s[0]} type="button" onClick={() => setSeason(s[0])} className={optionBtn(season === s[0])}>
                    {he ? s[1] : s[2]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-bold">{he ? "סוג החולצה" : "Jersey type"}</div>
              <div className="flex flex-wrap gap-2">
                {KINDS.map((k) => (
                  <button key={k[0]} type="button" onClick={() => setKind(k[0])} className={optionBtn(kind === k[0])}>
                    {he ? k[1] : k[2]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-bold">{he ? "קבוצות מועדפות" : "Preferred teams"}</span>
                <input
                  value={teams}
                  onChange={(e) => setTeams(e.target.value)}
                  maxLength={60}
                  placeholder={he ? "לדוגמה: ברצלונה, ריאל" : "e.g. Barcelona, Real"}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-bold">{he ? "קבוצות שלא בא לי" : "Teams to avoid"}</span>
                <input
                  value={avoid}
                  onChange={(e) => setAvoid(e.target.value)}
                  maxLength={60}
                  placeholder={he ? "לדוגמה: טוטנהאם" : "e.g. Tottenham"}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-bold">{he ? "שם על הגב (רשות)" : "Name on back (optional)"}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={14}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-bold">{he ? "מספר (רשות)" : "Number (optional)"}</span>
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
            </div>

            {patch ? (
              <label className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
                <input type="checkbox" checked={withPatch} onChange={(e) => setWithPatch(e.target.checked)} />
                <span className="font-semibold">
                  {he ? `הוספת פאץ' רשמי (+${patchPrice} ₪)` : `Add official patch (+${patchPrice} ₪)`}
                </span>
              </label>
            ) : null}

            <div>
              <div className="mb-2 text-sm font-bold">{t("quantity")}</div>
              <div className="inline-flex items-center rounded-md border border-border">
                <button
                  type="button"
                  className="px-3 py-2 text-lg"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="w-10 text-center font-bold">{quantity}</span>
                <button
                  type="button"
                  className="px-3 py-2 text-lg"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => addToCart(false)}
                className="flex-1 rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90"
              >
                {t("add_to_cart")}
              </button>
              <button
                type="button"
                onClick={() => addToCart(true)}
                className="flex-1 rounded-md bg-accent px-6 py-3 font-bold text-accent-foreground transition hover:opacity-90"
              >
                {t("buy_now")}
              </button>
            </div>

            <div className="rounded-md border border-border p-4 text-sm leading-relaxed text-muted-foreground">
              <div className="mb-1 flex items-center gap-2 font-bold text-foreground">
                <Gift className="h-4 w-4 text-accent" />
                {he ? "איך זה עובד?" : "How does it work?"}
              </div>
              {he
                ? "אחרי ההזמנה אנחנו בוחרים עבורכם חולצה שמתאימה להעדפות שסימנתם, אורזים בקופסת גולאסוס ושולחים. שווי החולצה תמיד גבוה מהמחיר ששילמתם. אין החזרה בגלל זהות הקבוצה, אבל מידה לא מתאימה ניתן להחליף."
                : "After ordering we pick a jersey matching your preferences, pack it in a Golassos box and ship it. The jersey value always exceeds what you paid. No returns for team identity, but sizes can be exchanged."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
