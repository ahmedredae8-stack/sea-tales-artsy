import { useState } from "react";
import { Check, Crown, Gem, Shield, ShipWheel, Swords, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GameSprite } from "@/components/GameSprite";
import { CREWS, WEAPONS } from "@/lib/items";
import { fmt, ships } from "@/lib/ships";
import { currentPhase, phaseLabel, themes } from "@/lib/themes";
import { playSfx } from "@/lib/sound";

type StoreTab = "worlds" | "ships" | "weapons" | "crew" | "gems";

export function GameStore({ activeId, onSelect, onClose }: { activeId: string; onSelect: (id: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<StoreTab>("worlds");
  const tabs = [
    { id: "worlds" as const, label: "العوالم", icon: Crown },
    { id: "ships" as const, label: "السفن", icon: ShipWheel },
    { id: "weapons" as const, label: "الأسلحة", icon: Swords },
    { id: "crew" as const, label: "الطواقم", icon: Users },
    { id: "gems" as const, label: "الجواهر", icon: Gem },
  ];

  return (
    <div className="game-modal" role="dialog" aria-modal="true" aria-label="المتجر البحري" onClick={onClose}>
      <section dir="rtl" className="store-shell" onClick={(event) => event.stopPropagation()}>
        <header className="store-head">
          <div className="min-w-0">
            <p className="store-kicker">ميناء التجارة الملكي</p>
            <h2>متجر القبطان</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="إغلاق المتجر" onClick={onClose} className="store-close"><X /></Button>
        </header>
        <nav className="store-tabs" aria-label="أقسام المتجر">
          {tabs.map((item) => (
            <Button key={item.id} variant="ghost" onClick={() => { playSfx("click", 0.55); setTab(item.id); }} className={tab === item.id ? "store-tab store-tab-active" : "store-tab"}>
              <item.icon /> <span>{item.label}</span>
            </Button>
          ))}
        </nav>
        <div className="store-body">
          {tab === "worlds" && (
            <>
              <p className="store-section-note">العالم الآن في {phaseLabel(currentPhase())} ويتبدّل تلقائيًا كل ٦ ساعات</p>
              <ul className="store-grid store-worlds">
                {themes.map((theme) => (
                  <li key={theme.id}>
                    <Button variant="ghost" onClick={() => onSelect(theme.id)} className={theme.id === activeId ? "store-product world-card selected" : "store-product world-card"}>
                      <span className="world-preview"><img src={theme.day.poster} alt="" loading="lazy" /><img src={theme.night.poster} alt="" loading="lazy" /></span>
                      <span className="product-copy"><strong>{theme.name}</strong><small>{theme.id === activeId ? "العالم الحالي" : "مجاني"}</small></span>
                      {theme.id === activeId && <Check className="product-check" />}
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {tab === "ships" && <ProductGrid items={ships.map((ship) => ({ id: ship.id, title: ship.name, desc: ship.desc, price: ship.price, currency: ship.currency, image: <img src={ship.img} alt="" loading="lazy" /> }))} />}
          {tab === "weapons" && <ProductGrid items={WEAPONS.map((item, index) => ({ id: item.id, title: item.name, desc: `${item.desc} · قوة ${item.power}`, price: item.price, currency: item.currency, image: <GameSprite atlas="weapon" index={index} /> }))} />}
          {tab === "crew" && <ProductGrid items={CREWS.map((item, index) => ({ id: item.id, title: item.name, desc: `${item.desc} · ${item.hours} ساعات`, price: item.price, currency: item.currency, image: <GameSprite atlas="crew" index={index} /> }))} />}
          {tab === "gems" && <GemVault />}
        </div>
      </section>
    </div>
  );
}

type Product = { id: string; title: string; desc: string; price: number; currency: "coin" | "gem"; image: React.ReactNode };

function ProductGrid({ items }: { items: Product[] }) {
  return <ul className="store-grid">{items.map((item) => <li key={item.id} className="store-product"><span className="product-art">{item.image}</span><span className="product-copy"><strong>{item.title}</strong><small>{item.desc}</small></span><Button onClick={() => playSfx("click", 0.75)} className="product-buy"><img src={item.currency === "coin" ? "/img/coin.png" : "/img/gem.png"} alt="" />{item.price === 0 ? "مجاني" : fmt(item.price)}</Button></li>)}</ul>;
}

function GemVault() {
  return <div className="gem-vault"><Gem className="gem-vault-icon" /><h3>خزنة الجواهر</h3><p>احصل على الجواهر من المهام اليومية والمكافآت. باقات الشراء ستُفتح لاحقًا.</p><span><Shield /> عمليات آمنة ومحفوظة</span></div>;
}