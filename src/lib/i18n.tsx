import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "he" | "en";

const STORAGE_KEY = "golassos-lang";

const DICT = {
  // header
  announcement: ["🎉 חולצות כדורגל 65 ₪ • נעלי כדורגל מ-300 ₪ • משלוח לכל הארץ 🎉", "🎉 Football jerseys 65 ₪ • Football boots from 300 ₪ • Shipping all over Israel 🎉"],
  tracking: ["מעקב הזמנה", "Tracking"],
  search_placeholder: ["חיפוש...", "Search..."],
  sign_in: ["התחברות / הרשמה", "Sign In/Register"],
  all_categories: ["כל הקטגוריות", "ALL CATEGORIES"],
  home: ["דף הבית", "Home"],
  shoes: ["נעליים", "Shoes"],
  contact: ["צור קשר", "Contact Us"],
  cart: ["עגלה", "Cart"],
  account: ["האזור האישי", "Account"],
  menu: ["תפריט", "Menu"],
  // home
  new_arrivals: ["חדש באתר", "New Arrivals"],
  national_teams: ["נבחרות לאומיות", "National Teams"],
  clubs: ["קבוצות מועדון", "Club Teams"],
  retro: ["רטרו", "Retro"],
  football_boots: ["נעלי כדורגל", "Football Boots"],
  view_all: ["לכל המוצרים", "View all"],
  new_badge: ["חדש", "New"],
  // category
  products_count: ["מוצרים", "products"],
  refine: ["סינון", "Refine"],
  sort_by: ["מיון", "Sort By"],
  sort_newest: ["החדשים ביותר", "Newest"],
  sort_name: ["לפי שם", "Name"],
  sort_oldest: ["הוותיקים ביותר", "Oldest"],
  all_sizes: ["כל המידות", "All sizes"],
  no_products: ["אין מוצרים בקטגוריה זו כרגע.", "No products in this category yet."],
  category_not_found: ["הקטגוריה לא נמצאה", "Category not found"],
  back_to_categories: ["חזרה לכל הקטגוריות", "Back to all categories"],
  // product
  price: ["מחיר", "Price"],
  perk_1: ["🛒 קונים 2 פריטים ומעלה ➡️ חוסכים במשלוח! 💰", "🛒 Buy 2+ Items ➡️ Save Big on Delivery! 💰"],
  perk_2: ["✨ ככל שקונים יותר – חוסכים יותר! 💸", "✨ The More You Buy, The More You Save! 💸"],
  size: ["מידה", "Size"],
  quantity: ["כמות", "Qty"],
  customize: ["הדפסה אישית (שם ומספר על הגב)", "Customized Requirements (name & number)"],
  custom_name: ["שם על הגב", "Name on back"],
  custom_number: ["מספר", "Number"],
  in_stock: ["במלאי", "In Stock"],
  add_to_cart: ["הוספה לעגלה", "Add to Cart"],
  view_product: ["צפייה במוצר", "View Product"],
  add_short: ["לעגלה", "Add"],
  view_short: ["צפייה", "View"],
  buy_now: ["קנייה עכשיו", "Buy Now"],
  choose_size: ["יש לבחור מידה", "Please choose a size"],
  added_to_cart: ["המוצר נוסף לעגלה", "Added to cart"],
  detail: ["פרטים", "Detail"],
  product_name: ["שם המוצר", "Product Name"],
  item_no: ["מק\"ט", "Item NO."],
  category: ["קטגוריה", "Category"],
  grade: ["איכות", "Grade"],
  grade_value: ["AAA, איכות תאילנדית מעולה", "AAA, Thailand top quality"],
  material: ["חומר", "Material"],
  material_value: ["100% פוליאסטר", "100% Polyester"],
  customizable: ["ניתן להתאמה אישית", "Customizable"],
  customizable_value: ["שמות שחקנים, שמות אישיים ומספרים", "Star names, personal names and numbers"],
  note: ["הערה", "Note"],
  note_value: ["בגלל מדידה ידנית ייתכן פער של 1–3 ס\"מ במידות.", "Due to manual measurement, the size may have an error of 1-3 cm."],
  service: ["שירות", "Service"],
  service_value: ["אם המוצר פגום – פנו אלינו מיד ונחליף או נזכה אתכם. חולצות עם הדפסה אישית אינן ניתנות להחזרה (למעט פגם).", "If your product is defective, contact us immediately and we will replace or refund you. Custom jerseys do not support refunds (except quality issues)."],
  share: ["שיתוף", "Share"],
  copy_link: ["העתקת קישור", "Copy link"],
  link_copied: ["הקישור הועתק", "Link copied"],
  similar_style: ["דגמים דומים", "Similar Style"],
  customer_reviews: ["ביקורות לקוחות", "Customer Reviews"],
  no_reviews: ["עדיין אין ביקורות. היו הראשונים!", "No reviews yet. Be the first!"],
  you_may_also_like: ["אולי יעניין אתכם", "You May Also Like"],
  product_not_found: ["המוצר לא נמצא", "Product not found"],
  // search
  search_results: ["תוצאות חיפוש", "Search results"],
  no_results: ["לא נמצאו מוצרים מתאימים.", "No matching products."],
  // tracking
  track_title: ["מעקב אחר הזמנה", "Track your order"],
  track_hint: ["הזינו מספר הזמנה וטלפון כפי שהוזנו בהזמנה.", "Enter your order number and the phone used at checkout."],
  order_number: ["מספר הזמנה", "Order number"],
  phone: ["טלפון", "Phone"],
  track_btn: ["בדיקת סטטוס", "Track"],
  track_not_found: ["לא נמצאה הזמנה תואמת.", "No matching order found."],
  status: ["סטטוס", "Status"],
  status_new: ["התקבלה", "Received"],
  status_confirmed: ["אושרה", "Confirmed"],
  status_shipped: ["נשלחה", "Shipped"],
  status_delivered: ["נמסרה", "Delivered"],
  status_cancelled: ["בוטלה", "Cancelled"],
  total: ["סה\"כ", "Total"],
  // footer
  newsletter: ["ניוזלטר", "Newsletter"],
  newsletter_hint: ["הירשמו וקבלו עדכונים על דגמים חדשים ומבצעים", "Get updates on new kits and deals"],
  subscribe: ["הרשמה", "Subscribe"],
  subscribed: ["נרשמתם בהצלחה!", "Subscribed!"],
  company_info: ["מידע על החברה", "Company Info"],
  about_us: ["אודות", "About Us"],
  feedback: ["משוב", "Feedback"],
  user_center: ["אזור אישי", "User Center"],
  my_orders: ["ההזמנות שלי", "My Orders"],
  register: ["הרשמה / התחברות", "Register"],
  help: ["עזרה", "Help"],
  shipping_methods: ["שיטות משלוח", "Shipping Methods"],
  refund_policy: ["מדיניות החזרות", "Refund Policy"],
  size_guide: ["מדריך מידות", "Size Guide"],
  admin: ["ניהול האתר", "Site admin"],
  rights: ["כל הזכויות שמורות.", "All rights reserved."],
  leagues: ["ליגות", "Leagues"],
  mystery_box: ["מיסטרי בוקס", "Mystery Box"],
  lang_switch: ["English", "עברית"],
} as const;

export type TKey = keyof typeof DICT;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string; dir: "rtl" | "ltr" };

const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("he");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "he") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      dir: lang === "he" ? "rtl" : "ltr",
      t: (k) => DICT[k][lang === "he" ? 0 : 1],
    }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

const FALLBACK_CTX: Ctx = {
  lang: "he",
  setLang: () => {},
  dir: "rtl",
  t: (k) => DICT[k][0],
};

export function useLang(): Ctx {
  // Fall back to Hebrew defaults instead of crashing when a component renders
  // outside the provider (e.g. error boundaries or stale HMR trees).
  return useContext(LangContext) ?? FALLBACK_CTX;
}


/** Translate an order status code. */
export function statusKey(status: string): TKey {
  switch (status) {
    case "confirmed":
      return "status_confirmed";
    case "shipped":
      return "status_shipped";
    case "delivered":
      return "status_delivered";
    case "cancelled":
      return "status_cancelled";
    default:
      return "status_new";
  }
}
