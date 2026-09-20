import { useEffect, useState } from "react";

import { playSfx } from "@/lib/sound";

const loot = [
  "/img/fish-sardine.png",
  "/img/fish-mackerel.png",
  "/img/fish-tuna.png",
  "/img/fish-swordfish.png",
  "/img/fish-turtle.png",
  "/img/fish-pearl.png",
];

/** Multi-frame net cast: throw → splash → haul, then a small loot burst. */
export function NetCast({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<"throw" | "splash" | "haul">("throw");
  const catchList = loot.slice(0, 3 + Math.floor(Math.random() * 3));

  useEffect(() => {
    playSfx("click", 0.7);
    const a = window.setTimeout(() => setStage("splash"), 750);
    const b = window.setTimeout(() => setStage("haul"), 1500);
    const c = window.setTimeout(onDone, 3200);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.clearTimeout(c);
    };
  }, [onDone]);

  return (
    <div className="net-stage" role="status" aria-live="polite">
      <div className="net-water" />
      <img src="/img/net.png" alt="" className={`net-img net-${stage}`} />

      {stage !== "throw" && (
        <>
          <span className="net-ripple" />
          <span className="net-ripple net-ripple-2" />
        </>
      )}

      {stage === "haul" && (
        <ul className="net-loot">
          {catchList.map((src, i) => (
            <li key={src} style={{ animationDelay: `${i * 110}ms` }}>
              <img src={src} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
      )}

      <p className="net-caption">
        {stage === "throw" ? "رمي الشباك..." : stage === "splash" ? "الشباك في الماء..." : "صيد وفير!"}
      </p>
    </div>
  );
}
