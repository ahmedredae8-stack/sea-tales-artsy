import { useEffect, useRef, useState, type CSSProperties } from "react";
import { X } from "lucide-react";

import shipIdle from "@/assets/ships/ship-v2-idle.png";
import shipCast from "@/assets/ships/ship-v2-cast.png";
import shipHaul from "@/assets/ships/ship-v2-haul.png";
import shipSubmerged from "@/assets/ships/ship-v2-submerged.png";
import actSail from "@/assets/actions/act-sail.png";
import actCrew from "@/assets/actions/act-crew.png";
import actSell from "@/assets/actions/act-sell.png";
import { GameSprite } from "@/components/GameSprite";
import { FleetCalibrator } from "@/components/FleetCalibrator";
import { Button } from "@/components/ui/button";
import { CREWS } from "@/lib/items";
import { cachedLanes, fetchLanes, type Lane } from "@/lib/fleetLayout";
import { fmt } from "@/lib/ships";
import { playSfx } from "@/lib/sound";

type ShipState = "docked" | "sailingOut" | "turning" | "casting" | "fishing" | "hauling" | "sailingHome" | "sold";
type FleetShip = { id: number; state: ShipState };
type ShipStyle = CSSProperties & {
  "--ship-x": string;
  "--ship-y": string;
  "--ship-size": string;
  "--ship-dx": string;
  "--ship-dy": string;
  "--ship-delay": string;
};

const initialFleet: FleetShip[] = [1, 2, 3].map((id) => ({ id, state: "docked" }));
const delays = ["0ms", "240ms", "480ms"];

const shipFrames = [
  { key: "idle", src: shipIdle },
  { key: "cast", src: shipCast },
  { key: "submerged", src: shipSubmerged },
  { key: "haul", src: shipHaul },
] as const;

/** States where the hull sits at the far end of its lane. */
const atSea: ShipState[] = ["sailingOut", "turning", "casting", "fishing", "hauling"];
/** States where the bow points back toward the shore. */
const facingShore: ShipState[] = ["turning", "casting", "fishing", "hauling", "sailingHome"];
const busyStates: ShipState[] = ["sailingOut", "turning", "casting", "hauling", "sailingHome"];

export function FishingFleet() {
  const [ships, setShips] = useState(initialFleet);
  const [lanes, setLanes] = useState<Lane[]>(() => cachedLanes());
  const [assetsReady, setAssetsReady] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [crewFor, setCrewFor] = useState<number | null>(null);
  const [sellFor, setSellFor] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all(
      shipFrames.map(({ src }) => {
        const image = new Image();
        image.src = src;
        return image.decode().catch(() => undefined);
      }),
    ).then(() => {
      if (active) setAssetsReady(true);
    });
    void fetchLanes().then((published) => {
      if (active) setLanes(published);
    });
    return () => {
      active = false;
      timers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

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
      later(() => update(ship.id, "turning"), 2300);
      later(() => update(ship.id, "casting"), 3150);
      later(() => update(ship.id, "fishing"), 4600);
      return;
    }
    if (ship.state === "fishing") {
      if (reducedMotion) {
        update(ship.id, "docked");
        return;
      }
      update(ship.id, "hauling");
      later(() => update(ship.id, "sailingHome"), 1500);
      later(() => update(ship.id, "docked"), 3900);
    }
  };

  /** Owner tool preview: send every docked ship out on its new lane. */
  const testSail = () => {
    ships.forEach((ship, index) => {
      if (ship.state === "docked") later(() => sail(ship), index * 260);
    });
  };

  return (
    <div className={`fleet-layer ${assetsReady ? "fleet-ready" : ""}`} aria-label="أسطول الصيد" aria-busy={!assetsReady}>
      {ships.map((ship, index) => {
        if (ship.state === "sold") return null;
        const lane = lanes[index];
        if (!lane) return null;
        const busy = busyStates.includes(ship.state);
        const frame = ship.state === "casting" ? "cast" : ship.state === "fishing" ? "submerged" : ship.state === "hauling" ? "haul" : "idle";
        const style: ShipStyle = {
          "--ship-x": `${lane.dockX}%`,
          "--ship-y": `${lane.dockY}%`,
          "--ship-size": String(lane.size),
          "--ship-dx": `calc(${(lane.fishX - lane.dockX).toFixed(2)} * 1cqw)`,
          "--ship-dy": `calc(${(lane.fishY - lane.dockY).toFixed(2)} * 1cqh)`,
          "--ship-delay": delays[index] ?? "0ms",
        };
        const laneClasses = [
          "fleet-ship",
          `fleet-ship-${ship.state}`,
          atSea.includes(ship.state) ? "fleet-ship-at-sea" : "",
          ship.state === "sailingOut" || ship.state === "sailingHome" ? "fleet-ship-moving" : "",
        ].filter(Boolean).join(" ");
        return (
          <div key={ship.id} className={laneClasses} style={style}>
            {selected === ship.id && !busy && (
              <div className="ship-actions" role="menu" aria-label={`أوامر السفينة ${ship.id}`}>
                <Button variant="ghost" role="menuitem" className="ship-action" onClick={() => sail(ship)} title={ship.state === "docked" ? "الذهاب للصيد" : "العودة للميناء"}>
                  <img src={actSail} alt="" />
                  <span>{ship.state === "docked" ? "صيد" : "رجوع"}</span>
                </Button>
                <Button variant="ghost" role="menuitem" className="ship-action" onClick={() => { setSelected(null); setCrewFor(ship.id); playSfx("click", 0.65); }} title="تفقد الطاقم">
                  <img src={actCrew} alt="" />
                  <span>الطاقم</span>
                </Button>
                <Button variant="ghost" role="menuitem" className="ship-action" onClick={() => { setSelected(null); setSellFor(ship.id); playSfx("click", 0.65); }} title="بيع السفينة">
                  <img src={actSell} alt="" />
                  <span>بيع</span>
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
              <span className={`ship-flip ${facingShore.includes(ship.state) ? "ship-flip-turned" : ""}`} aria-hidden="true">
                <span className="ship-bob">
                  {shipFrames.map(({ key, src }) => (
                    <img
                      key={key}
                      src={src}
                      className={`ship-frame ${frame === key ? "ship-frame-active" : ""}`}
                      alt=""
                      width={1536}
                      height={1024}
                      draggable={false}
                    />
                  ))}
                </span>
              </span>
              <span className="sr-only">سفينة الصيد {ship.id}</span>
              {ship.state === "fishing" && <span className="fishing-ripple" />}
            </Button>
          </div>
        );
      })}

      <FleetCalibrator lanes={lanes} onChange={setLanes} onTest={testSail} />

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
        <header><span className="crew-title-mark" aria-hidden="true">⚓</span><h2>طاقم السفينة {shipId}</h2><Button variant="ghost" size="icon" onClick={onClose} aria-label="إغلاق"><X /></Button></header>
        <ul>
          {CREWS.slice(0, 6).map((crew, index) => (
            <li key={crew.id}>
              <GameSprite atlas="crew" index={index} className="crew-portrait" />
              <span className="crew-copy"><strong>{crew.name}</strong><small>{crew.desc}</small></span>
              <Button disabled={active === crew.id} onClick={() => { setActive(crew.id); playSfx("click", 0.7); }}>
                {active === crew.id ? "يعمل الآن" : "استخدام"}<small>{active === crew.id ? "04:59:59" : `${crew.hours}H · ${fmt(crew.price)}`}</small>
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
