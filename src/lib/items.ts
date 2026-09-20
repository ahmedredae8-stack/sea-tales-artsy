/** Weapons (raids / bombing) and hireable crews catalog. */

export type Currency = "coin" | "gem";

export type Weapon = {
  id: string;
  name: string;
  desc: string;
  power: number;
  price: number;
  currency: Currency;
  icon: string;
};

export type Crew = {
  id: string;
  name: string;
  desc: string;
  hours: number;
  price: number;
  currency: Currency;
  icon: string;
};

export const WEAPONS: Weapon[] = [
  { id: "rocket-s", name: "صاروخ صغير", desc: "ضرر خفيف على سفينة واحدة", power: 1, price: 2_500, currency: "coin", icon: "/img/cat-weapon.png" },
  { id: "rocket-m", name: "صاروخ متوسط", desc: "يعطّل الشحنة لبعض الوقت", power: 3, price: 12_000, currency: "coin", icon: "/img/cat-weapon.png" },
  { id: "rocket-l", name: "صاروخ كبير", desc: "ضرر عالٍ وسرقة أكبر", power: 6, price: 45_000, currency: "coin", icon: "/img/cat-weapon.png" },
  { id: "rocket-vip", name: "صاروخ VIP", desc: "يتجاوز درع الحارس", power: 9, price: 120, currency: "gem", icon: "/img/skull.png" },
  { id: "nuke", name: "قنبلة ذرية", desc: "تدمير شامل لأسطول الخصم", power: 14, price: 400, currency: "gem", icon: "/img/skull.png" },
  { id: "ad-bomb", name: "قنبلة إعلانية", desc: "مجانية بعد مشاهدة إعلان", power: 2, price: 0, currency: "coin", icon: "/img/chest.png" },
];

export const CREWS: Crew[] = [
  { id: "sailor", name: "بحار", desc: "+10% سرعة الإبحار", hours: 5, price: 1_500, currency: "coin", icon: "/img/act-crew.png" },
  { id: "luck", name: "حظ", desc: "+15% فرصة صيد نادر", hours: 5, price: 4_000, currency: "coin", icon: "/img/act-crew.png" },
  { id: "guide", name: "مرشد", desc: "يكشف أفضل مناطق الصيد", hours: 8, price: 9_000, currency: "coin", icon: "/img/act-crew.png" },
  { id: "thief", name: "لص", desc: "يسرق جزءًا من شحنة الخصم", hours: 4, price: 18_000, currency: "coin", icon: "/img/skull.png" },
  { id: "guard", name: "حارس", desc: "يحمي سفنك من الصواريخ", hours: 12, price: 60, currency: "gem", icon: "/img/cat-crew.png" },
  { id: "fix-s", name: "مصلح صغير", desc: "إصلاح 25% من الضرر", hours: 2, price: 2_000, currency: "coin", icon: "/img/act-dock.png" },
  { id: "fix-m", name: "مصلح متوسط", desc: "إصلاح 50% من الضرر", hours: 3, price: 7_500, currency: "coin", icon: "/img/act-dock.png" },
  { id: "fix-l", name: "مصلح كبير", desc: "إصلاح 80% من الضرر", hours: 4, price: 25_000, currency: "coin", icon: "/img/act-dock.png" },
  { id: "fix-legend", name: "مصلح أسطوري", desc: "إصلاح فوري كامل", hours: 1, price: 150, currency: "gem", icon: "/img/cat-crew.png" },
];
