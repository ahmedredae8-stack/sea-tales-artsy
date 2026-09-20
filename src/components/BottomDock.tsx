import { Button } from "@/components/ui/button";
import dockChat from "@/assets/dock/chat.png";
import dockStats from "@/assets/dock/stats.png";
import dockBag from "@/assets/dock/bag.png";
import dockStore from "@/assets/dock/store.png";
import dockQuests from "@/assets/dock/quests.png";
import dockBattle from "@/assets/dock/battle.png";
import dockTribe from "@/assets/dock/tribe.png";
import { playSfx } from "@/lib/sound";

export type DockAction = "chat" | "stats" | "bag" | "store" | "quests" | "battle" | "tribe";

const items: { id: DockAction; label: string; image: string }[] = [
  { id: "chat", label: "الدردشة", image: dockChat },
  { id: "stats", label: "الإحصائيات", image: dockStats },
  { id: "bag", label: "الحقيبة", image: dockBag },
  { id: "store", label: "المتجر", image: dockStore },
  { id: "quests", label: "المهام", image: dockQuests },
  { id: "battle", label: "المعركة", image: dockBattle },
  { id: "tribe", label: "القبيلة", image: dockTribe },
];

export function BottomDock({ onAction }: { onAction: (action: DockAction) => void }) {
  return (
    <nav className="game-dock" aria-label="قائمة اللعبة">
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Button
              variant="ghost"
              className="game-dock-button"
              aria-label={item.label}
              title={item.label}
              onPointerEnter={() => playSfx("hover", 0.3)}
              onClick={() => {
                playSfx("click", 0.72);
                onAction(item.id);
              }}
            >
              <img src={item.image} alt="" width={256} height={264} draggable={false} />
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
