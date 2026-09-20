import { useEffect, useRef, useState, type CSSProperties } from "react";
import { X } from "lucide-react";

import shipIdle from "@/assets/ships/fishing-ship-idle.png";
import shipCast from "@/assets/ships/fishing-ship-cast.png";
import shipHaul from "@/assets/ships/fishing-ship-haul.png";
import shipSubmerged from "@/assets/ships/fishing-ship-submerged.png";
import { GameSprite } from "@/components/GameSprite";
import { Button } from "@/components/ui/button";
import { CREWS } from "@/lib/items";
import { fmt } from "@/lib/ships";
import { playSfx } from "@/lib/sound";

type ShipState = "docked" | "sailingOut" | "casting" | "fishing" | "hauling" | "sailingHome" | "sold";
type FleetShip = { id: number; state: ShipState };
type ShipStyle = CSSProperties & { "--ship-x": string; "--ship-y": string; "--ship-delay": string };

const initialFleet: FleetShip[] = [1, 2, 3].map((id) => ({ id, state: "docked" }));
const positions = [
  { x: "29%", y: "65%", delay: "0ms" },
  { x: "50%", y: "57%", delay: "260ms" },
  { x: "70%", y: "65%", delay: "520ms" },
];

export function FishingFleet() {
  const [ships, setShips] = useState(initialFleet);
  const [selected, setSelected] = useState<number | null>(null);
  const [crewFor, setCrewFor] = useState<number | null>(null);
  const [sellFor, setSellFor] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  const update = (id: number, state: ShipState) => {
    setShips((current) => current.map((ship) => (ship.id === id ? { ...ship, state } : ship)));
  };

  const later = (callback: () => void, delay: number) => {
    timers.current.push(window.setTimeout(callback, delay));
  };

  const sail = (ship: FleetShip) => {
    setSelected(null);
    playSfx("click", 0.55);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-game-motion");
    if (ship.state === "docked") {
      if (reducedMotion) {
        update(ship.id, "fishing");
        return;
      }
      update(ship.id, "sailingOut");
      later(() => update(ship.id, "casting"), 2100);
      later(() => update(ship.id, "fishing"), 3050);
      return;
    }
    if (ship.state === "fishing") {
      if (reducedMotion) {
        update(ship.id, "docked");
        return;
      }
      update(ship.id, "hauling");
      later(() => update(ship.id, "sailingHome"), 950);
      later(() => update(ship.id, "docked"), 3150);
    }
  };

  return (
    <div className="fleet-layer" aria-label="أسطول الصيد">
      {ships.map((ship, index) => {
        if (ship.state === "sold") return null;
        const pos = positions[index];
        if (!pos) return null;
        const busy = ship.state === "sailingOut" || ship.state === "casting" || ship.state === "hauling" || ship.state === "sailingHome";
        const image = ship.state === "casting" ? shipCast : ship.state === "fishing" ? shipSubmerged : ship.state === "hauling" ? shipHaul : shipIdle;
        const style: ShipStyle = { "--ship-x": pos.x, "--ship-y": pos.y, "--ship-delay": pos.delay };
        return (
          <div key={ship.id} className={`fleet-ship fleet-ship-${ship.state}`} style={style}>
            {selected === ship.id && !busy && (
              <div className="ship-actions" role="menu" aria-label={`أوامر السفينة ${ship.id}`}>
                <Button variant="ghost" role="menuitem" onClick={() => sail(ship)} aria-label={ship.state === "docked" ? "الذهاب للصيد" : "العودة للميناء"} title={ship.state === "docked" ? "الذهاب للصيد" : "العودة للميناء"}>
                  <img src="/img/act-dock.png" alt="" />
                </Button>
                <Button variant="ghost" role="menuitem" onClick={() => { setSelected(null); setCrewFor(ship.id); playSfx("click", 0.65); }} aria-label="تفقد الطاقم" title="تفقد الطاقم">
                  <img src="/img/act-crew.png" alt="" />
                </Button>
                <Button variant="ghost" role="menuitem" onClick={() => { setSelected(null); setSellFor(ship.id); playSfx("click", 0.65); }} aria-label="بيع السفينة" title="بيع السفينة">
                  <img src="/img/act-sail.png" alt="" />
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              className="ship-hitbox"
              disabled={busy}
              aria-label={`السفينة ${ship.id}${busy ? " تتحرك" : ""}`}
              onClick={() => { setSelected((current) => current === ship.id ? null : ship.id); playSfx("click", 0.6); }}
            >
              <span className="ship-water-shadow" />
              <img src={image} alt={`سفينة الصيد ${ship.id}`} width={1536} height={1024} draggable={false} />
              {ship.state === "fishing" && <span className="fishing-ripple" />}
            </Button>
          </div>
        );
      })}

      {crewFor !== null && <CrewPanel shipId={crewFor} onClose={() => setCrewFor(null)} />}
      {sellFor !== null && (
        <div className="fleet-modal" role="dialog" aria-modal="true" aria-label="بيع السفينة" onClick={() => setSellFor(null)}>
          <section className="sell-panel" dir="rtl" onClick={(event) => event.stopPropagation()}>
            <img src={shipIdle} alt="" width={1536} height={1024} />
            <h2>بيع السفينة؟</h2>
            <p>ستحصل على 12,500 عملة ذهبية. سيبقى أسطولك قابلاً للإبحار بالسفن الأخرى.</p>
            <div>
              <Button variant="destructive" onClick={() => { update(sellFor, "sold"); setSellFor(null); playSfx("click", 0.8); }}>تأكيد البيع</Button>
              <Button variant="secondary" onClick={() => setSellFor(null)}>إلغاء</Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function CrewPanel({ shipId, onClose }: { shipId: number; onClose: () => void }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="fleet-modal" role="dialog" aria-modal="true" aria-label={`طاقم السفينة ${shipId}`} onClick={onClose}>
      <section className="crew-panel" dir="rtl" onClick={(event) => event.stopPropagation()}>
        <header><h2>طاقم السفينة {shipId}</h2><Button variant="ghost" size="icon" onClick={onClose} aria-label="إغلاق"><X /></Button></header>
        <ul>
          {CREWS.slice(0, 4).map((crew, index) => (
            <li key={crew.id}>
              <GameSprite atlas="crew" index={index} className="crew-portrait" />
              <span><strong>{crew.name}</strong><small>{crew.desc}</small></span>
              <Button disabled={active === crew.id} onClick={() => { setActive(crew.id); playSfx("click", 0.7); }}>
                {active === crew.id ? "يعمل الآن" : "استخدام"}<small>{crew.hours}H · {fmt(crew.price)}</small>
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
