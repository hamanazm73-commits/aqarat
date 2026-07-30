import type { Property, PropertyFilters, PropertyType } from "./types";

/** Local placeholder gallery for a property. Swap these for real photo URLs
 *  (Firebase Storage / Cloudinary) when listings get real images. Using local
 *  SVGs keeps the site working with zero external dependencies. */
const INT = ["/img/interior-1.svg", "/img/interior-2.svg", "/img/interior-3.svg"];
const gallery = (type: PropertyType, ...extra: string[]) => [
  `/img/${type}.svg`,
  ...extra,
];

/**
 * Seed listings. The public site runs entirely on these so it works with no
 * backend. When Firebase is wired up (see src/lib/firebase), the query
 * functions below can be pointed at Firestore instead.
 */
export const SEED_PROPERTIES: Property[] = [
  {
    id: "erb-villa-dream-city",
    title: {
      ku: "ڤێلای مۆدێرن لە دریم سیتی",
      en: "Modern villa in Dream City",
      ar: "فيلا حديثة في دريم سيتي",
    },
    description: {
      ku: "ڤێلایەکی جوان و مۆدێرن بە باخچەیەکی فراوان و مەلەوانگە لە باشترین ناوچەی هەولێر. تەواو مۆبلیاکراو و ئامادە بۆ نیشتەجێبوون.",
      en: "A stunning modern villa with a large garden and private pool in Erbil's finest neighbourhood. Fully furnished and move-in ready.",
      ar: "فيلا عصرية رائعة مع حديقة كبيرة ومسبح خاص في أرقى أحياء أربيل. مفروشة بالكامل وجاهزة للسكن.",
    },
    purpose: "sale",
    type: "villa",
    city: "erbil",
    district: { ku: "دریم سیتی", en: "Dream City", ar: "دريم سيتي" },
    priceIQD: 650_000_000,
    area: 480,
    bedrooms: 5,
    bathrooms: 4,
    images: gallery("villa", INT[0], INT[2]),
    amenities: ["parking", "garden", "pool", "furnished", "security", "generator"],
    featured: true,
    recommended: true,
    agent: { name: "Aland Real Estate", phone: "+9647501234567", whatsapp: "+9647501234567" },
    createdAt: "2026-06-20T10:00:00Z",
    lat: 36.1911,
    lng: 44.0092,
  },
  {
    id: "bgd-apartment-mansour",
    title: {
      ku: "شوقەی فاخر لە مەنسوور",
      en: "Luxury apartment in Al-Mansour",
      ar: "شقة فاخرة في المنصور",
    },
    description: {
      ku: "شوقەیەکی فراوان لە نهۆمی بەرزی کۆمپلێکسێکی نوێ، لەگەڵ دیمەنێکی جوانی شار و ئاسانسۆر و پارکینگ.",
      en: "A spacious high-floor apartment in a new complex with great city views, elevator and covered parking.",
      ar: "شقة واسعة في طابق مرتفع ضمن مجمع جديد بإطلالة رائعة على المدينة، مصعد وموقف مغطى.",
    },
    purpose: "sale",
    type: "apartment",
    city: "baghdad",
    district: { ku: "مەنسوور", en: "Al-Mansour", ar: "المنصور" },
    priceIQD: 320_000_000,
    area: 210,
    bedrooms: 3,
    bathrooms: 2,
    images: gallery("apartment", INT[1], INT[0]),
    amenities: ["parking", "elevator", "ac", "security", "generator"],
    featured: true,
    discount: { active: true, oldPriceIQD: 360_000_000 },
    agent: { name: "Baghdad Homes", phone: "+9647701112233", whatsapp: "+9647701112233" },
    createdAt: "2026-06-28T09:30:00Z",
    lat: 33.3152,
    lng: 44.3661,
  },
  {
    id: "slm-house-salim",
    title: {
      ku: "خانووی نیشتەجێبوون لە سالم",
      en: "Family house in Salim Street",
      ar: "منزل عائلي في شارع سالم",
    },
    description: {
      ku: "خانوویەکی دوو نهۆمی بە دیزاینێکی نایاب، نزیک لە خزمەتگوزارییەکان و قوتابخانە. گونجاو بۆ خێزانی گەورە.",
      en: "A two-storey house with a great layout, close to schools and services. Ideal for a large family.",
      ar: "منزل من طابقين بتصميم رائع، قريب من المدارس والخدمات. مثالي للعائلات الكبيرة.",
    },
    purpose: "sale",
    type: "house",
    city: "sulaymaniyah",
    district: { ku: "شەقامی سالم", en: "Salim Street", ar: "شارع سالم" },
    priceIQD: 280_000_000,
    area: 300,
    bedrooms: 4,
    bathrooms: 3,
    images: gallery("house", INT[0], INT[2]),
    amenities: ["parking", "garden", "heating", "water_tank"],
    recommended: true,
    agent: { name: "Sulaymaniyah Estates", phone: "+9647730009988" },
    createdAt: "2026-06-15T12:00:00Z",
    lat: 35.5556,
    lng: 45.4351,
  },
  {
    id: "erb-apartment-rent-empire",
    title: {
      ku: "شوقە بۆ کرێ لە ئەمپایەر",
      en: "Apartment for rent in Empire",
      ar: "شقة للإيجار في إمباير",
    },
    description: {
      ku: "شوقەیەکی مۆبلیاکراو و ئامادە لە کۆمپلێکسی ئەمپایەر، لەگەڵ هەموو خزمەتگوزارییەکان و ئاسایشی ٢٤ کاتژمێری.",
      en: "A furnished, ready apartment in Empire complex with all facilities and 24/7 security.",
      ar: "شقة مفروشة وجاهزة في مجمع إمباير مع جميع المرافق وأمن على مدار الساعة.",
    },
    purpose: "rent",
    type: "apartment",
    city: "erbil",
    district: { ku: "ئەمپایەر", en: "Empire World", ar: "إمباير" },
    priceIQD: 1_200_000,
    area: 130,
    bedrooms: 2,
    bathrooms: 2,
    images: gallery("apartment", INT[2], INT[1]),
    amenities: ["parking", "elevator", "furnished", "ac", "pool", "security"],
    featured: true,
    agent: { name: "Aland Real Estate", phone: "+9647501234567", whatsapp: "+9647501234567" },
    createdAt: "2026-07-01T08:00:00Z",
    lat: 36.1911,
    lng: 44.0092,
  },
  {
    id: "bsr-land-corniche",
    title: {
      ku: "زەوی بۆ فرۆشتن لە کۆرنیش",
      en: "Land for sale near the Corniche",
      ar: "أرض للبيع قرب الكورنيش",
    },
    description: {
      ku: "پارچە زەوییەکی بازرگانی بە شوێنێکی ستراتیژی نزیک کۆرنیشی بەسرە، گونجاو بۆ پرۆژەی بازرگانی یان نیشتەجێبوون.",
      en: "A commercial plot in a strategic location near Basra's Corniche, suitable for commercial or residential projects.",
      ar: "قطعة أرض تجارية بموقع استراتيجي قرب كورنيش البصرة، مناسبة لمشاريع تجارية أو سكنية.",
    },
    purpose: "sale",
    type: "land",
    city: "basra",
    district: { ku: "کۆرنیش", en: "Corniche", ar: "الكورنيش" },
    priceIQD: 450_000_000,
    area: 600,
    images: gallery("land", INT[2]),
    amenities: [],
    agent: { name: "Basra Land Co.", phone: "+9647801234567" },
    createdAt: "2026-05-30T14:00:00Z",
    lat: 30.5085,
    lng: 47.7835,
  },
  {
    id: "dhk-house-nakhoshkhana",
    title: {
      ku: "خانوو لە نەخۆشخانا رۆد",
      en: "House on Nakhoshkhana Road",
      ar: "منزل في شارع المستشفى",
    },
    description: {
      ku: "خانوویەکی نوێی دروستکراو بە کارەبای مۆلێد و تانکی ئاو، لە ناوچەیەکی هێمن و ئارامی دهۆک.",
      en: "A newly-built house with generator and water tank in a calm, quiet area of Duhok.",
      ar: "منزل حديث البناء مع مولد وخزان ماء في منطقة هادئة من دهوك.",
    },
    purpose: "sale",
    type: "house",
    city: "duhok",
    priceIQD: 240_000_000,
    area: 260,
    bedrooms: 3,
    bathrooms: 2,
    images: gallery("house", INT[1], INT[0]),
    amenities: ["parking", "generator", "water_tank", "heating"],
    agent: { name: "Duhok Property", phone: "+9647504445566" },
    createdAt: "2026-06-10T11:00:00Z",
    lat: 36.86,
    lng: 42.988,
  },
  {
    id: "bgd-office-karrada",
    title: {
      ku: "ئۆفیس بۆ کرێ لە کەڕادە",
      en: "Office for rent in Karrada",
      ar: "مكتب للإيجار في الكرادة",
    },
    description: {
      ku: "ئۆفیسێکی مۆدێرن و ئامادە لە دڵی کەڕادە، گونجاو بۆ کۆمپانیا و بزنس، لەگەڵ ئاسانسۆر و پارکینگ.",
      en: "A modern, ready office in the heart of Karrada, ideal for companies, with elevator and parking.",
      ar: "مكتب عصري جاهز في قلب الكرادة، مثالي للشركات، مع مصعد وموقف.",
    },
    purpose: "rent",
    type: "office",
    city: "baghdad",
    district: { ku: "کەڕادە", en: "Karrada", ar: "الكرادة" },
    priceIQD: 2_500_000,
    area: 180,
    bathrooms: 2,
    images: gallery("office", INT[2]),
    amenities: ["parking", "elevator", "ac", "generator", "security"],
    recommended: true,
    agent: { name: "Baghdad Homes", phone: "+9647701112233", whatsapp: "+9647701112233" },
    createdAt: "2026-06-25T13:00:00Z",
    lat: 33.3152,
    lng: 44.3661,
  },
  {
    id: "krk-house-rahimawa",
    title: {
      ku: "خانوو لە ڕەحیماوا",
      en: "House in Rahimawa",
      ar: "منزل في رحيماوة",
    },
    description: {
      ku: "خانوویەکی خێزانی بە نرخێکی گونجاو لە ناوچەی ڕەحیماوا، نزیک بازاڕ و خزمەتگوزارییەکان.",
      en: "An affordable family house in Rahimawa, close to the market and services.",
      ar: "منزل عائلي بسعر مناسب في رحيماوة، قريب من السوق والخدمات.",
    },
    purpose: "sale",
    type: "house",
    city: "kirkuk",
    priceIQD: 160_000_000,
    area: 200,
    bedrooms: 3,
    bathrooms: 2,
    images: gallery("house", INT[2]),
    amenities: ["parking", "water_tank", "heating"],
    discount: { active: true, oldPriceIQD: 185_000_000 },
    agent: { name: "Kirkuk Real Estate", phone: "+9647709998877" },
    createdAt: "2026-06-05T09:00:00Z",
    lat: 35.4681,
    lng: 44.3922,
  },
  {
    id: "erb-shop-family-mall",
    title: {
      ku: "دووکان بۆ کرێ نزیک فامیلی مۆڵ",
      en: "Shop for rent near Family Mall",
      ar: "محل للإيجار قرب فاميلي مول",
    },
    description: {
      ku: "دووکانێک بە پێشەوەیەکی فراوان لە شوێنێکی بازرگانی چالاک، گونجاو بۆ هەموو جۆرە بزنسێک.",
      en: "A shop with a wide frontage in a busy commercial spot, suitable for any type of business.",
      ar: "محل بواجهة عريضة في موقع تجاري حيوي، مناسب لأي نوع من الأعمال.",
    },
    purpose: "rent",
    type: "shop",
    city: "erbil",
    district: { ku: "١٠٠ مەتری", en: "100m Road", ar: "شارع المئة متر" },
    priceIQD: 1_800_000,
    area: 90,
    images: gallery("shop", INT[0]),
    amenities: ["ac", "generator", "security"],
    agent: { name: "Aland Real Estate", phone: "+9647501234567", whatsapp: "+9647501234567" },
    createdAt: "2026-06-18T10:30:00Z",
    lat: 36.1911,
    lng: 44.0092,
  },
  {
    id: "njf-apartment-rent",
    title: {
      ku: "شوقە بۆ کرێ لە نەجەف",
      en: "Apartment for rent in Najaf",
      ar: "شقة للإيجار في النجف",
    },
    description: {
      ku: "شوقەیەکی پاک و ئامادە نزیک ناوەندی شار، گونجاو بۆ خێزان یان کرێی مانگانە.",
      en: "A clean, ready apartment near the city centre, ideal for families or monthly rent.",
      ar: "شقة نظيفة وجاهزة قرب مركز المدينة، مناسبة للعائلات أو الإيجار الشهري.",
    },
    purpose: "rent",
    type: "apartment",
    city: "najaf",
    priceIQD: 700_000,
    area: 110,
    bedrooms: 2,
    bathrooms: 1,
    images: gallery("apartment", INT[0]),
    amenities: ["ac", "elevator", "water_tank"],
    agent: { name: "Najaf Estates", phone: "+9647811223344" },
    createdAt: "2026-06-22T15:00:00Z",
    lat: 32.0,
    lng: 44.33,
  },
  {
    id: "krb-house-sale",
    title: {
      ku: "خانوو بۆ فرۆشتن لە کەربەلا",
      en: "House for sale in Karbala",
      ar: "منزل للبيع في كربلاء",
    },
    description: {
      ku: "خانوویەکی نوێ لە ناوچەیەکی گەشەسەندوو، لەگەڵ باخچە و پارکینگ و کارەبای بەردەوام.",
      en: "A new house in a developing area with a garden, parking and reliable power.",
      ar: "منزل جديد في منطقة متطورة مع حديقة وموقف وكهرباء مستقرة.",
    },
    purpose: "sale",
    type: "house",
    city: "karbala",
    priceIQD: 210_000_000,
    area: 250,
    bedrooms: 4,
    bathrooms: 3,
    images: gallery("house", INT[0], INT[1]),
    amenities: ["parking", "garden", "generator", "solar"],
    agent: { name: "Karbala Homes", phone: "+9647822334455" },
    createdAt: "2026-05-28T10:00:00Z",
    lat: 32.6167,
    lng: 44.0333,
  },
  {
    id: "slm-villa-rent",
    title: {
      ku: "ڤێلا بۆ کرێ لە سلێمانی",
      en: "Villa for rent in Sulaymaniyah",
      ar: "فيلا للإيجار في السليمانية",
    },
    description: {
      ku: "ڤێلایەکی فراوان و مۆبلیاکراو بە باخچە و مەلەوانگە، گونجاو بۆ نیشتەجێبوونی درێژخایەن.",
      en: "A spacious, furnished villa with garden and pool, ideal for long-term living.",
      ar: "فيلا واسعة ومفروشة مع حديقة ومسبح، مثالية للسكن طويل الأمد.",
    },
    purpose: "rent",
    type: "villa",
    city: "sulaymaniyah",
    priceIQD: 3_500_000,
    area: 420,
    bedrooms: 5,
    bathrooms: 4,
    images: gallery("villa", INT[2], INT[1]),
    amenities: ["parking", "garden", "pool", "furnished", "security", "heating"],
    recommended: true,
    agent: { name: "Sulaymaniyah Estates", phone: "+9647730009988" },
    createdAt: "2026-07-02T09:00:00Z",
    lat: 35.5556,
    lng: 45.4351,
  },
];

/** Pure filter+sort used client-side and server-side. */
export function filterProperties(
  list: Property[],
  f: PropertyFilters,
): Property[] {
  let out = list.filter((p) => !p.hidden);

  if (f.purpose && f.purpose !== "all") out = out.filter((p) => p.purpose === f.purpose);
  if (f.type && f.type !== "all") out = out.filter((p) => p.type === f.type);
  if (f.city && f.city !== "all") out = out.filter((p) => p.city === f.city);
  if (typeof f.minPrice === "number") out = out.filter((p) => p.priceIQD >= f.minPrice!);
  if (typeof f.maxPrice === "number") out = out.filter((p) => p.priceIQD <= f.maxPrice!);
  if (typeof f.bedrooms === "number") out = out.filter((p) => (p.bedrooms ?? 0) >= f.bedrooms!);
  if (f.q) {
    const q = f.q.trim().toLowerCase();
    out = out.filter((p) =>
      [
        p.title.ku, p.title.en, p.title.ar,
        p.description.ku, p.description.en, p.description.ar,
        p.district?.ku ?? "", p.district?.en ?? "", p.district?.ar ?? "",
        p.city, p.type,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  switch (f.sort) {
    case "price_asc":
      out = [...out].sort((a, b) => a.priceIQD - b.priceIQD);
      break;
    case "price_desc":
      out = [...out].sort((a, b) => b.priceIQD - a.priceIQD);
      break;
    case "area_desc":
      out = [...out].sort((a, b) => b.area - a.area);
      break;
    default:
      out = [...out].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
  }
  return out;
}
