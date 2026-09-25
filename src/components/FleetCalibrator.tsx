import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { defaultLanes, publishLanes, type Lane } from "@/lib/fleetLayout";
import { playSfx } from "@/lib/sound";

const SECRET = "123";

type Props = {
  lanes: Lane[];
  onChange: (lanes: Lane[]) => void;
  onTest: () => void;
};

type Grab = { index: number; kind: "dock" | "fish" };

/** Hidden owner tool: tap the invisible corner, enter 123, then drag each ship's
 *  berth and fishing mark. Publishing stores the layout for every player. */
export function FleetCalibrator({ lanes, onChange, onTest }: Props) {
  const [stage, setStage] = useState<"hidden" | "gate" | "open">("hidden");
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState("");
  const layer = useRef<HTMLDivElement>(null);
  const grab = useRef<Grab | null>(null);

  const move = (event: React.PointerEvent) => {
    const held = grab.current;
    const box = layer.current?.getBoundingClientRect();
    if (!held || !box || box.width === 0) return;
    const x = Math.min(100, Math.max(0, ((event.clientX - box.left) / box.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - box.top) / box.height) * 100));
    onChange(
      lanes.map((lane, index) =>
        index !== held.index
          ? lane
          : held.kind === "dock"
            ? { ...lane, dockX: Math.round(x * 10) / 10, dockY: Math.round(y * 10) / 10 }
            : { ...lane, fishX: Math.round(x * 10) / 10, fishY: Math.round(y * 10) / 10 },
      ),
    );
  };

  const start = (event: React.PointerEvent, index: number, kind: "dock" | "fish") => {
    grab.current = { index, kind };
    setActive(index);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resize = (index: number, size: number) => {
    onChange(lanes.map((lane, i) => (i === index ? { ...lane, size } : lane)));
  };

  const publish = async () => {
    setStatus("جاري النشر…");
    const ok = await publishLanes(lanes);
    setStatus(ok ? "تم النشر لكل اللاعبين ✔" : "لم يتم النشر، حاول مرة أخرى");
  };

  if (stage === "hidden") {
    return (
      <button
        type="button"
        className="calib-key"
        aria-label="أداة المالك"
        onClick={() => setStage("gate")}
      />
    );
  }

  if (stage === "gate") {
    return (
      <div className="calib-gate" dir="rtl">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim() === SECRET) {
              setStage("open");
              setWrong(false);
              playSfx("click", 0.6);
            } else {
              setWrong(true);
            }
            setCode("");
          }}
        >
          <strong>أدخل كلمة السر</strong>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={8}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-label="كلمة السر"
          />
          {wrong && <span className="calib-note">كلمة السر غير صحيحة</span>}
          <Button type="submit">فتح</Button>
          <Button type="button" variant="secondary" onClick={() => setStage("hidden")}>
            إلغاء
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div
      className="calib-layer"
      ref={layer}
      dir="rtl"
      onPointerMove={move}
      onPointerUp={() => {
        grab.current = null;
      }}
      onPointerCancel={() => {
        grab.current = null;
      }}
    >
      {lanes.map((lane) => (
        <div key={lane.id} className="calib-lane" aria-hidden="true">
          <span
            className="calib-line"
            style={{
              left: `${lane.dockX}%`,
              top: `${lane.dockY}%`,
              width: `${Math.hypot(lane.fishX - lane.dockX, lane.fishY - lane.dockY)}%`,
              rotate: `${(Math.atan2(lane.fishY - lane.dockY, lane.fishX - lane.dockX) * 180) / Math.PI}deg`,
            }}
          />
        </div>
      ))}

      {lanes.map((lane, index) => (
        <div key={`pins-${lane.id}`}>
          <button
            type="button"
            className={`calib-pin calib-pin-dock ${active === index ? "calib-pin-active" : ""}`}
            style={{ left: `${lane.dockX}%`, top: `${lane.dockY}%` }}
            onPointerDown={(event) => start(event, index, "dock")}
            aria-label={`نقطة رسو السفينة ${lane.id}`}
          >
            {lane.id}م
          </button>
          <button
            type="button"
            className={`calib-pin calib-pin-fish ${active === index ? "calib-pin-active" : ""}`}
            style={{ left: `${lane.fishX}%`, top: `${lane.fishY}%` }}
            onPointerDown={(event) => start(event, index, "fish")}
            aria-label={`نقطة صيد السفينة ${lane.id}`}
          >
            {lane.id}ص
          </button>
        </div>
      ))}

      <section className="calib-panel">
        <h3>معايرة الأسطول</h3>
        <p className="calib-note">اسحب الدائرة الذهبية لمكان الرسو والزرقاء لمكان الصيد.</p>
        <div className="calib-row">
          {lanes.map((lane, index) => (
            <Button
              key={lane.id}
              size="sm"
              variant={active === index ? "default" : "secondary"}
              onClick={() => setActive(index)}
            >
              سفينة {lane.id}
            </Button>
          ))}
        </div>
        <div className="calib-row">
          <label>
            الحجم
            <input
              type="range"
              min={8}
              max={60}
              step={1}
              value={lanes[active]?.size ?? 26}
              onChange={(event) => resize(active, Number(event.target.value))}
            />
          </label>
          <span className="calib-note">{lanes[active]?.size ?? 26}%</span>
        </div>
        <div className="calib-row">
          <Button size="sm" onClick={onTest}>
            تجربة الإبحار
          </Button>
          <Button size="sm" onClick={() => void publish()}>
            حفظ ونشر للجميع
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onChange(defaultLanes)}>
            استرجاع الافتراضي
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setStage("hidden")}>
            إغلاق
          </Button>
        </div>
        {status && <span className="calib-note">{status}</span>}
      </section>
    </div>
  );
}
