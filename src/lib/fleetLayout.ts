import { supabase } from "@/integrations/supabase/client";

/** One ship lane: where it waits, where it fishes, and how big the hull draws. */
export type Lane = {
  id: number;
  dockX: number;
  dockY: number;
  fishX: number;
  fishY: number;
  size: number;
};

export const defaultLanes: Lane[] = [
  { id: 1, dockX: 50, dockY: 57, fishX: 74, fishY: 57, size: 26 },
  { id: 2, dockX: 39, dockY: 68, fishX: 68, fishY: 68, size: 28 },
  { id: 3, dockX: 41, dockY: 79, fishX: 69, fishY: 79, size: 30 },
];

const CACHE_KEY = "ib.fleet.layout.v2";
const ROW_ID = "default";

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function normalizeLanes(input: unknown): Lane[] {
  if (!Array.isArray(input)) return defaultLanes;
  return defaultLanes.map((fallback, index) => {
    const raw = (input[index] ?? {}) as Record<string, unknown>;
    return {
      id: fallback.id,
      dockX: clamp(raw["dockX"], 0, 100, fallback.dockX),
      dockY: clamp(raw["dockY"], 0, 100, fallback.dockY),
      fishX: clamp(raw["fishX"], 0, 100, fallback.fishX),
      fishY: clamp(raw["fishY"], 0, 100, fallback.fishY),
      size: clamp(raw["size"], 8, 60, fallback.size),
    };
  });
}

/** Instant lanes from the last visit so ships never wait on the network. */
export function cachedLanes(): Lane[] {
  if (typeof window === "undefined") return defaultLanes;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? normalizeLanes(JSON.parse(raw)) : defaultLanes;
  } catch {
    return defaultLanes;
  }
}

function cache(lanes: Lane[]) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(lanes));
  } catch {
    /* storage may be unavailable */
  }
}

/** The published layout every player sees. */
export async function fetchLanes(): Promise<Lane[]> {
  const { data, error } = await supabase
    .from("fleet_layout")
    .select("lanes")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error || !data) return cachedLanes();
  const lanes = normalizeLanes(data.lanes);
  cache(lanes);
  return lanes;
}

/** Publish the layout for everyone, on every device. */
export async function publishLanes(lanes: Lane[]): Promise<boolean> {
  const clean = normalizeLanes(lanes);
  cache(clean);
  const { error } = await supabase
    .from("fleet_layout")
    .upsert({ id: ROW_ID, lanes: clean }, { onConflict: "id" });
  return !error;
}
