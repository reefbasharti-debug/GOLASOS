import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Paperclip } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { chatLookupOrder, submitTicket } from "@/lib/support.functions";

type Msg = { from: "bot" | "user"; text: string };
type Option = { label: string; next: string };

type Step =
  | "root"
  | "ship_number"
  | "ship_email"
  | "damage_number"
  | "damage_email"
  | "damage_image"
  | "damage_text"
  | "order_root"
  | "find_help"
  | "request_email"
  | "request_image"
  | "request_text"
  | "size_root"
  | "done";

const ROOT_OPTIONS: Option[] = [
  { label: "🚚 סטטוס הזמנה ומשלוח", next: "ship_number" },
  { label: "⚠️ דיווח על פריט פגום / שגוי", next: "damage_number" },
  { label: "🛒 יצירת הזמנה חדשה / חיפוש מוצר", next: "order_root" },
  { label: "📏 ייעוץ מידת מוצרים", next: "size_root" },
];

const SIZE_ANSWERS: Record<string, string> = {
  "👕 חולצות":
    "החולצות שלנו במידות תקניות (Standard Fit). בגרסת שחקן מומלץ לקחת מידה אחת מעל המידה הרגילה שלך. 📏 טבלת מידות מלאה בדף המוצר.",
  "🩳 מכנסיים / שורטים":
    "המכנסיים כוללים שרוך הידוק וגזרה ספורטיבית נוחה. 📏 טבלת המידות המלאה בס\"מ מופיעה בדף המוצר.",
  "👟 נעליים":
    'בנעליים מומלץ למדוד את אורך כף הרגל בס"מ מהעקב עד הבוהן. 📏 טבלת המרת מידות (EU/US/CM) מופיעה בדף המוצר.',
  "🧥 אימוניות / ג'קטים":
    "האימוניות והג'קטים בגזרה ישרה ונוחה. 📏 טבלת המידות המלאה מופיעה בדף המוצר.",
};

/** Floating scripted customer-service chat with email hand-off to the service team. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("root");
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "היי! 👋 ברוכים הבאים לגולאסוס. אשמח לעזור! במה מדובר?" },
  ]);
  const [options, setOptions] = useState<Option[]>(ROOT_OPTIONS);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ orderNumber?: number; email?: string }>({});
  const [misses, setMisses] = useState(0);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lookup = useServerFn(chatLookupOrder);
  const ticket = useServerFn(submitTicket);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, options]);

  const say = (text: string) => setMsgs((m) => [...m, { from: "bot", text }]);
  const me = (text: string) => setMsgs((m) => [...m, { from: "user", text }]);

  const restart = () => {
    setStep("root");
    setOptions(ROOT_OPTIONS);
    setDraft({});
    setImage(null);
    say("אפשר לבחור נושא נוסף 👇");
  };

  const pick = (opt: Option) => {
    me(opt.label);
    setOptions([]);
    if (opt.next === "ship_number") {
      setStep("ship_number");
      say("מעולה, אשמח לבדוק את מצב המשלוח. מה מספר ההזמנה שלך? (לדוגמה: 12345)");
    } else if (opt.next === "damage_number") {
      setStep("damage_number");
      say("מצטערים מאוד שקיבלת פריט שלא כראוי 😔 מה מספר ההזמנה שלך?");
    } else if (opt.next === "order_root") {
      setStep("order_root");
      say("רוצה להתחדש? איזה כיף! במה אוכל לסייע?");
      setOptions([
        { label: "🔍 עזרה במציאת מוצר באתר", next: "find_help" },
        { label: "📸 לא מצאתי את המוצר ואני רוצה לבדוק אם ניתן להזמין אותו", next: "request_email" },
      ]);
    } else if (opt.next === "find_help") {
      setStep("find_help");
      say(
        "אפשר לחפש ישירות בשורת החיפוש בראש האתר, או לרשום לי כאן את שם הקבוצה / השחקן / העונה שאת/ה מחפש/ת ואכוון אותך.",
      );
    } else if (opt.next === "request_email") {
      setStep("request_email");
      say("אין בעיה, נבדוק אם אפשר להזמין את הדגם במיוחד עבורך 👕 מה כתובת האימייל שלך למענה?");
    } else if (opt.next === "size_root") {
      setStep("size_root");
      say("כדי להתאים לך את המידה המדויקת, עבור איזה מוצר תרצה/י ייעוץ?");
      setOptions(Object.keys(SIZE_ANSWERS).map((label) => ({ label, next: `size:${label}` })));
    } else if (opt.next.startsWith("size:")) {
      say(SIZE_ANSWERS[opt.label] ?? "");
      restart();
    }
  };

  const sendTicket = async (
    kind: "shipping_delay" | "damaged_item" | "product_request" | "misunderstood",
    description: string,
  ) => {
    setBusy(true);
    try {
      await ticket({
        data: {
          kind,
          ...(draft.orderNumber ? { orderNumber: draft.orderNumber } : {}),
          ...(draft.email ? { email: draft.email } : {}),
          description,
          ...(image ? { imageDataUrl: image } : {}),
        },
      });
    } catch {
      /* ticket already stored server-side when possible */
    } finally {
      setBusy(false);
      setImage(null);
    }
  };

  const submit = async (raw: string) => {
    const text = raw.trim();
    if (!text && !image) return;
    me(text || "📸 תמונה");
    setInput("");

    if (step === "ship_number") {
      const n = Number(text.replace(/\D/g, ""));
      if (!n) return say("נא להזין מספר הזמנה מספרי, לדוגמה 12345");
      setDraft({ orderNumber: n });
      setStep("ship_email");
      return say("תודה! מה כתובת האימייל שאיתה בוצעה ההזמנה?");
    }

    if (step === "ship_email") {
      setDraft((d) => ({ ...d, email: text }));
      setBusy(true);
      try {
        const res = await lookup({ data: { orderNumber: draft.orderNumber!, email: text } });
        if (!res) {
          say("לא מצאתי הזמנה שמתאימה למספר ולאימייל האלה. אפשר לבדוק את הפרטים ולנסות שוב?");
          setBusy(false);
          return;
        }
        if (res.tracking) {
          say(
            `החבילה שלך יצאה לדרך! 🚚 מספר המעקב שלך הוא ${res.tracking}. צפי הגעה: ${res.etaLabel}.`,
          );
        } else if (res.businessDays <= 5) {
          say("החבילה שלך תישלח בימים הקרובים! מספר המעקב יופיע בפרטי ההזמנה באזור האישי שלך.");
        } else if (res.businessDays <= 14) {
          say(
            "עקב עומס זמני ההזמנה ממתינה ליציאה למשלוח. העברתי את הפרטים לצוות השירות – נציג יבדוק ויעדכן אותך במייל בהקדם.",
          );
          await sendTicket("shipping_delay", `ההזמנה טרם נשלחה, ${res.businessDays} ימי עסקים מההזמנה.`);
        } else {
          say(
            "אנחנו מצטערים מאוד על העיכוב! העברנו את הפרטים לצוות השירות, ונציג יחזור אליך במייל עם מענה מלא ב-48 השעות הקרובות.",
          );
          await sendTicket("shipping_delay", `החבילה לא הגיעה, ${res.businessDays} ימי עסקים מההזמנה.`);
        }
      } finally {
        setBusy(false);
      }
      return restart();
    }

    if (step === "damage_number") {
      const n = Number(text.replace(/\D/g, ""));
      if (!n) return say("נא להזין מספר הזמנה מספרי");
      setDraft({ orderNumber: n });
      setStep("damage_email");
      return say("מה כתובת האימייל שלך למענה?");
    }

    if (step === "damage_email") {
      setDraft((d) => ({ ...d, email: text }));
      setStep("damage_image");
      return say("אנא העלה/י לכאן תמונה של הפריט או הפגם שקיבלת 📸 (בעזרת אייקון המהדק)");
    }

    if (step === "damage_image") {
      if (!image) return say("צריך תמונה אחת כדי שנוכל לבדוק — אפשר להעלות בעזרת אייקון המהדק 📎");
      setStep("damage_text");
      return say("תודה! כתוב/כתבי בכמה מילים מה הבעיה במוצר (למשל: הדפסה פגומה, קרע, מידה שגויה):");
    }

    if (step === "damage_text") {
      await sendTicket("damaged_item", text);
      say(
        `תודה! הפנייה שלך, בצירוף התמונה והתיאור, נשלחה לצוות השירות 📩 נציג יבדוק ויחזור אליך במייל ל-${draft.email} עד 5 ימי עסקים.`,
      );
      return restart();
    }

    if (step === "request_email") {
      setDraft({ email: text });
      setStep("request_image");
      return say("אנא העלה/י תמונה של החולצה / המוצר שאת/ה מחפש/ת 📸");
    }

    if (step === "request_image") {
      if (!image) return say("אפשר להעלות תמונה בעזרת אייקון המהדק 📎");
      setStep("request_text");
      return say("אם יש פרטים נוספים (מידה מבוקשת, שם שחקן, עונה) — רשום/י אותם כאן:");
    }

    if (step === "request_text") {
      await sendTicket("product_request", text);
      say(
        "מעולה! התמונה והפרטים נשלחו לצוות ההזמנות 📩 נציג יבדוק זמינות מול הספקים ויחזור אליך במייל תוך 24-48 שעות.",
      );
      return restart();
    }

    if (step === "find_help") {
      say(`מחפש/ת "${text}"? אפשר להקליד את זה בשורת החיפוש בראש האתר ולראות את כל הדגמים הזמינים.`);
      return restart();
    }

    // Free text we don't understand
    const next = misses + 1;
    setMisses(next);
    if (next >= 2) {
      setMisses(0);
      await sendTicket("misunderstood", text);
      say("העברתי את הפנייה לצוות השירות שלנו במייל, ונציג יחזור אליך בהקדם 📩");
      return restart();
    }
    say("לא הצלחתי להבין — אפשר לבחור אחת מהאפשרויות?");
    setOptions(ROOT_OPTIONS);
    setStep("root");
  };

  const onFile = (file: File) => {
    if (file.size > 4_000_000) {
      say("התמונה גדולה מדי (עד 4MB). אפשר לצלם מסך קטן יותר?");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
      say("קיבלתי את התמונה ✅");
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-critical focus-key shadow-soft fixed bottom-4 right-4 z-50 flex size-14 items-center justify-center rounded-full"
        aria-label="צ'אט שירות לקוחות"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {open ? (
        <div className="shadow-soft fixed bottom-20 right-4 z-50 flex h-[32rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-card">
          <div className="bg-navy px-4 py-3 text-sm font-extrabold text-white">שירות הלקוחות של גולאסוס</div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.from === "bot" ? "bg-secondary" : "ms-auto bg-navy text-white"
                }`}
              >
                {m.text}
              </div>
            ))}
            {options.length > 0 ? (
              <div className="flex flex-col gap-2 pt-1">
                {options.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => pick(o)}
                    className="focus-key rounded-lg border border-navy/30 bg-background px-3 py-2 text-start text-sm font-semibold hover:bg-secondary"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit(input);
            }}
            className="flex items-center gap-1 border-t p-2"
          >
            <label className="focus-key grid size-9 cursor-pointer place-items-center rounded-md hover:bg-secondary">
              <Paperclip className="size-4" />
              <span className="sr-only">העלאת תמונה</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
            </label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="כתבו הודעה..."
              className="h-9 flex-1 rounded-md border px-2 text-sm"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={busy}
              className="focus-key grid size-9 place-items-center rounded-md text-primary hover:bg-secondary disabled:opacity-50"
              aria-label="שליחה"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
