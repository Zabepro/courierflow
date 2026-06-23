export type Lang = "en" | "sw";

export type Dict = {
  nav: { pricing: string; faq: string; signIn: string };
  hero: {
    badge: string;
    titlePre: string; rotateWords: string[]; titlePost: string;
    subtitle: string;
    ctaPrimary: string; ctaSecondary: string;
    trackLabel: string; trackPlaceholder: string; trackButton: string;
    trust: string;
  };
  stats: { value: string; label: string }[];
  payBand: string;
  preview: {
    eyebrow: string; title: string; subtitle: string;
    nav: string[];
    stats: { n: string; l: string }[];
    tableTitle: string;
    rows: { code: string; who: string; status: string }[];
  };
  features: { eyebrow: string; title: string; items: { title: string; desc: string }[] };
  how: { eyebrow: string; title: string; steps: { title: string; desc: string }[] };
  testimonials: { eyebrow: string; title: string; items: { quote: string; role: string }[] };
  pricing: {
    eyebrow: string; title: string; subtitle: string; note: string; popular: string;
    plans: {
      name: string; tagline: string; price: string; period: string; cta: string;
      features: string[]; highlight: boolean; action: "signup" | "whatsapp";
    }[];
  };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  ctaStrip: { title: string; subtitle: string; primary: string; whatsapp: string };
  footer: {
    brandDesc: string; whatsappChat: string;
    columns: { title: string; links: { label: string; href: string; external?: boolean }[] }[];
    copyright: string; madeIn: string;
  };
};

const WHATSAPP_URL = "https://wa.me/255624964064?text=Habari%2C%20nina%20nia%20ya%20CourierFlow";

export const TESTIMONIAL_NAMES = ["Amina Hassan", "Joseph Mwaky", "Grace Kimaro"];
export const TESTIMONIAL_INITIALS = ["AH", "JM", "GK"];

export const translations: Record<Lang, Dict> = {
  en: {
    nav: { pricing: "Pricing", faq: "FAQ", signIn: "Sign in" },
    hero: {
      badge: "Built for Tanzania",
      titlePre: "Deliveries,", rotateWords: ["delivered", "tracked", "confirmed", "managed"], titlePost: "— on time, every time.",
      subtitle: "CourierFlow is the all-in-one platform to dispatch drivers, track parcels live, collect mobile-money payments and capture proof of delivery — built for couriers across Tanzania.",
      ctaPrimary: "Get started — it's free", ctaSecondary: "Sign in to dashboard",
      trackLabel: "Track a parcel — no account needed",
      trackPlaceholder: "Enter tracking code…", trackButton: "Track",
      trust: "Secure mobile-money payments · No setup fees",
    },
    stats: [
      { value: "10,000+", label: "Parcels delivered" },
      { value: "98%",     label: "On-time rate" },
      { value: "50+",     label: "Active couriers" },
      { value: "24/7",    label: "Live support" },
    ],
    payBand: "Pay-ins powered by Tanzania's mobile money",
    preview: {
      eyebrow: "See it in action",
      title: "Your whole operation, one clean dashboard",
      subtitle: "Track deliveries, manage drivers and watch your fleet move — all in real time.",
      nav: ["Overview", "Deliveries", "Drivers", "Fleet Map"],
      stats: [{ n: "1,284", l: "Total" }, { n: "37", l: "On road" }, { n: "12", l: "Pending" }, { n: "58", l: "Today" }],
      tableTitle: "Recent deliveries",
      rows: [
        { code: "CF-8X2K", who: "Neema A.", status: "In Transit" },
        { code: "CF-4M9P", who: "Baraka T.", status: "Delivered" },
        { code: "CF-1Q7R", who: "Halima S.", status: "Pending" },
      ],
    },
    features: {
      eyebrow: "Everything you need",
      title: "One platform, the whole delivery journey",
      items: [
        { title: "Live tracking",     desc: "Follow every parcel in real time from pickup to doorstep." },
        { title: "Mobile money",      desc: "Collect via M-Pesa, Tigo Pesa & Airtel Money out of the box." },
        { title: "Fleet map",         desc: "See your whole fleet on one live map with GPS updates." },
        { title: "Proof of delivery", desc: "Photo, signature & GPS captured at the point of handover." },
      ],
    },
    how: {
      eyebrow: "How it works",
      title: "From order to paid in three steps",
      steps: [
        { title: "Create a delivery", desc: "Add the parcel, recipient and fee in seconds. A tracking code is generated automatically." },
        { title: "Assign a driver",   desc: "Dispatch to any driver. They get a mobile portal with GPS and turn-by-turn updates." },
        { title: "Track & get paid",  desc: "Watch it move live, capture proof on arrival, and collect payment via mobile money." },
      ],
    },
    testimonials: {
      eyebrow: "Loved by couriers",
      title: "Trusted by delivery teams across Tanzania",
      items: [
        { quote: "We cut delivery disputes to almost zero — the photo and GPS proof settles everything. Our customers love the live tracking link.", role: "Operations Lead, SwiftBoda" },
        { quote: "Collecting payment used to be the hardest part. Now M-Pesa confirmations land in the dashboard instantly. Game changer.", role: "Owner, DSM Express" },
        { quote: "Onboarding 12 riders took an afternoon. The phone portal just works, even in areas with weak network.", role: "Fleet Manager, PikiPiki Logistics" },
      ],
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Simple plans that grow with you",
      subtitle: "Start free. Upgrade when your deliveries do.",
      note: "Prices in TZS. VAT may apply. Cancel anytime.",
      popular: "Popular",
      plans: [
        { name: "Starter", price: "0", period: "/month", highlight: false, action: "signup",
          tagline: "For solo couriers getting started.",
          features: ["Up to 50 deliveries/mo", "1 driver", "Live tracking", "Mobile-money payments"],
          cta: "Start free" },
        { name: "Biashara", price: "49,000", period: "TZS /month", highlight: true, action: "signup",
          tagline: "For growing delivery businesses.",
          features: ["Unlimited deliveries", "Up to 15 drivers", "Fleet map & GPS", "Proof of delivery", "SMS notifications"],
          cta: "Start 14-day trial" },
        { name: "Kampuni", price: "Custom", period: "", highlight: false, action: "whatsapp",
          tagline: "For large fleets & enterprises.",
          features: ["Everything in Biashara", "Unlimited drivers", "Priority support", "Custom integrations", "Dedicated account manager"],
          cta: "Contact sales" },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Questions, answered",
      items: [
        { q: "Do I need any hardware to start?", a: "No. CourierFlow runs entirely in the browser and on your drivers' phones — no special devices required." },
        { q: "Which payment methods are supported?", a: "M-Pesa, Tigo Pesa and Airtel Money via AzamPay. Customers pay directly to mobile money and you see it confirmed in real time." },
        { q: "Can my drivers use it on their phones?", a: "Yes. The driver portal is mobile-first with live GPS, photo proof of delivery and an offline queue for areas with weak signal." },
        { q: "Is there a setup fee?", a: "None. Start on the free Starter plan, and upgrade only when your delivery volume grows." },
        { q: "How is customer tracking shared?", a: "Every delivery gets a public tracking code your customers can follow live — no account needed." },
      ],
    },
    ctaStrip: {
      title: "Ready to move faster?",
      subtitle: "Set up your courier business in minutes.",
      primary: "Create your account",
      whatsapp: "Book a demo",
    },
    footer: {
      brandDesc: "The all-in-one delivery platform built for couriers across Tanzania.",
      whatsappChat: "Chat on WhatsApp",
      columns: [
        { title: "Product", links: [
          { label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" },
          { label: "Live tracking", href: "/track" }, { label: "Sign in", href: "/sign-in" },
        ] },
        { title: "Company", links: [
          { label: "How it works", href: "#how" }, { label: "Contact", href: WHATSAPP_URL, external: true },
          { label: "FAQ", href: "#faq" },
        ] },
        { title: "Legal", links: [
          { label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" },
        ] },
      ],
      copyright: "CourierFlow · Delivery management for Tanzania",
      madeIn: "Made in Tanzania",
    },
  },

  sw: {
    nav: { pricing: "Bei", faq: "Maswali", signIn: "Ingia" },
    hero: {
      badge: "Imejengwa kwa ajili ya Tanzania",
      titlePre: "Vifurushi,", rotateWords: ["vinawasilishwa", "vinafuatiliwa", "vinathibitishwa", "vinasimamiwa"], titlePost: "— kwa wakati, kila wakati.",
      subtitle: "CourierFlow ni jukwaa moja kamili la kutuma madereva, kufuatilia vifurushi moja kwa moja, kukusanya malipo ya simu na kunasa uthibitisho wa uwasilishaji — limejengwa kwa wasambazaji Tanzania nzima.",
      ctaPrimary: "Anza sasa — ni bure", ctaSecondary: "Ingia kwenye dashibodi",
      trackLabel: "Fuatilia kifurushi — hauhitaji akaunti",
      trackPlaceholder: "Andika namba ya kufuatilia…", trackButton: "Fuatilia",
      trust: "Malipo salama ya simu · Hakuna ada ya kuanzisha",
    },
    stats: [
      { value: "10,000+", label: "Vifurushi vilivyowasilishwa" },
      { value: "98%",     label: "Kiwango cha wakati" },
      { value: "50+",     label: "Wasambazaji hai" },
      { value: "24/7",    label: "Msaada wakati wote" },
    ],
    payBand: "Malipo yanawezeshwa na pesa za simu za Tanzania",
    preview: {
      eyebrow: "Iangalie ikifanya kazi",
      title: "Operesheni yako yote, dashibodi moja safi",
      subtitle: "Fuatilia uwasilishaji, simamia madereva na uone fleet yako ikitembea — yote kwa wakati halisi.",
      nav: ["Muhtasari", "Uwasilishaji", "Madereva", "Ramani ya Fleet"],
      stats: [{ n: "1,284", l: "Jumla" }, { n: "37", l: "Njiani" }, { n: "12", l: "Inasubiri" }, { n: "58", l: "Leo" }],
      tableTitle: "Uwasilishaji wa hivi karibuni",
      rows: [
        { code: "CF-8X2K", who: "Neema A.", status: "Njiani" },
        { code: "CF-4M9P", who: "Baraka T.", status: "Imewasilishwa" },
        { code: "CF-1Q7R", who: "Halima S.", status: "Inasubiri" },
      ],
    },
    features: {
      eyebrow: "Kila unachohitaji",
      title: "Jukwaa moja, safari nzima ya uwasilishaji",
      items: [
        { title: "Ufuatiliaji wa moja kwa moja", desc: "Fuatilia kila kifurushi kwa wakati halisi tangu kuchukua hadi mlangoni." },
        { title: "Pesa za simu",                desc: "Kusanya kupitia M-Pesa, Tigo Pesa na Airtel Money moja kwa moja." },
        { title: "Ramani ya fleet",             desc: "Ona fleet yako yote kwenye ramani moja hai yenye taarifa za GPS." },
        { title: "Uthibitisho wa uwasilishaji", desc: "Picha, sahihi na GPS vinanaswa wakati wa kukabidhi." },
      ],
    },
    how: {
      eyebrow: "Jinsi inavyofanya kazi",
      title: "Kutoka oda hadi malipo kwa hatua tatu",
      steps: [
        { title: "Tengeneza uwasilishaji", desc: "Ongeza kifurushi, mpokeaji na ada kwa sekunde. Namba ya kufuatilia inatengenezwa moja kwa moja." },
        { title: "Mpe dereva",             desc: "Tuma kwa dereva yeyote. Anapata portal ya simu yenye GPS na taarifa za njia." },
        { title: "Fuatilia na ulipwe",     desc: "Ona ikitembea, nasa uthibitisho ikifika, na kusanya malipo kupitia pesa za simu." },
      ],
    },
    testimonials: {
      eyebrow: "Inapendwa na wasambazaji",
      title: "Inaaminiwa na timu za uwasilishaji Tanzania nzima",
      items: [
        { quote: "Tumepunguza migogoro ya uwasilishaji karibu sifuri — uthibitisho wa picha na GPS unamaliza kila kitu. Wateja wetu wanapenda kiungo cha kufuatilia.", role: "Kiongozi wa Operesheni, SwiftBoda" },
        { quote: "Kukusanya malipo ilikuwa sehemu ngumu zaidi. Sasa uthibitisho wa M-Pesa unaingia dashibodi papo hapo. Imebadilisha kila kitu.", role: "Mmiliki, DSM Express" },
        { quote: "Kusajili waendeshaji 12 kulichukua mchana mmoja. Portal ya simu inafanya kazi tu, hata maeneo yenye mtandao dhaifu.", role: "Meneja wa Fleet, PikiPiki Logistics" },
      ],
    },
    pricing: {
      eyebrow: "Bei",
      title: "Mipango rahisi inayokua nawe",
      subtitle: "Anza bure. Pandisha kadiri uwasilishaji wako unavyoongezeka.",
      note: "Bei kwa TZS. VAT yaweza kutozwa. Sitisha wakati wowote.",
      popular: "Maarufu",
      plans: [
        { name: "Starter", price: "0", period: "/mwezi", highlight: false, action: "signup",
          tagline: "Kwa wasambazaji binafsi wanaoanza.",
          features: ["Hadi uwasilishaji 50/mwezi", "Dereva 1", "Ufuatiliaji wa moja kwa moja", "Malipo ya pesa za simu"],
          cta: "Anza bure" },
        { name: "Biashara", price: "49,000", period: "TZS /mwezi", highlight: true, action: "signup",
          tagline: "Kwa biashara za uwasilishaji zinazokua.",
          features: ["Uwasilishaji usio na kikomo", "Hadi madereva 15", "Ramani ya fleet na GPS", "Uthibitisho wa uwasilishaji", "Arifa za SMS"],
          cta: "Anza majaribio ya siku 14" },
        { name: "Kampuni", price: "Maalum", period: "", highlight: false, action: "whatsapp",
          tagline: "Kwa fleet kubwa na makampuni.",
          features: ["Kila kitu cha Biashara", "Madereva wasio na kikomo", "Msaada wa kipaumbele", "Muunganisho maalum", "Meneja maalum wa akaunti"],
          cta: "Wasiliana na mauzo" },
      ],
    },
    faq: {
      eyebrow: "Maswali",
      title: "Maswali, yamejibiwa",
      items: [
        { q: "Je nahitaji vifaa vyovyote kuanza?", a: "Hapana. CourierFlow inafanya kazi kabisa kwenye browser na simu za madereva wako — hakuna vifaa maalum vinavyohitajika." },
        { q: "Ni njia zipi za malipo zinazokubaliwa?", a: "M-Pesa, Tigo Pesa na Airtel Money kupitia AzamPay. Wateja wanalipa moja kwa moja kwa pesa za simu na unaona ikithibitishwa kwa wakati halisi." },
        { q: "Je madereva wangu wanaweza kuitumia kwenye simu zao?", a: "Ndiyo. Portal ya dereva ni ya simu kwanza yenye GPS hai, uthibitisho wa picha na foleni ya nje ya mtandao kwa maeneo yenye mtandao dhaifu." },
        { q: "Je kuna ada ya kuanzisha?", a: "Hakuna. Anza na mpango wa bure wa Starter, na upandishe pale tu uwasilishaji wako unapoongezeka." },
        { q: "Je ufuatiliaji wa mteja unashirikishwaje?", a: "Kila uwasilishaji unapata namba ya umma ya kufuatilia ambayo wateja wako wanaweza kufuatilia moja kwa moja — hakuna akaunti inayohitajika." },
      ],
    },
    ctaStrip: {
      title: "Tayari kwenda haraka zaidi?",
      subtitle: "Anzisha biashara yako ya usambazaji kwa dakika.",
      primary: "Tengeneza akaunti yako",
      whatsapp: "Panga demo",
    },
    footer: {
      brandDesc: "Jukwaa moja kamili la uwasilishaji lililojengwa kwa wasambazaji Tanzania nzima.",
      whatsappChat: "Ongea kwa WhatsApp",
      columns: [
        { title: "Bidhaa", links: [
          { label: "Vipengele", href: "#features" }, { label: "Bei", href: "#pricing" },
          { label: "Ufuatiliaji", href: "/track" }, { label: "Ingia", href: "/sign-in" },
        ] },
        { title: "Kampuni", links: [
          { label: "Jinsi inavyofanya kazi", href: "#how" }, { label: "Wasiliana", href: WHATSAPP_URL, external: true },
          { label: "Maswali", href: "#faq" },
        ] },
        { title: "Kisheria", links: [
          { label: "Sera ya Faragha", href: "/privacy" }, { label: "Masharti ya Huduma", href: "/terms" },
        ] },
      ],
      copyright: "CourierFlow · Usimamizi wa uwasilishaji Tanzania",
      madeIn: "Imetengenezwa Tanzania",
    },
  },
};

export { WHATSAPP_URL };
