import { ACTIONS } from "@/components/keyboard/layout";
import type { ActionId } from "@/components/keyboard/layout";

export function performAction(id: ActionId): void {
  const action = ACTIONS[id];
  if (action.download) {
    const link = document.createElement("a");
    link.href = action.href;
    link.download = "";
    document.body.append(link);
    link.click();
    link.remove();
    return;
  }
  if (action.external) {
    window.open(action.href, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.href = action.href;
}
