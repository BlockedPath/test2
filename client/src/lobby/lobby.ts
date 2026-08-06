export type LobbyState = {
  lobby: boolean;
  countdown: number;
  players: Map<string, boolean>;
};

export function createLobbyUI(
  container: HTMLElement,
  onReadyToggle: (ready: boolean) => void,
): {
  update: (state: LobbyState, selfId: string) => void;
  setCountdown: (n: number) => void;
} {
  const wrap = document.createElement("div");
  wrap.style.cssText = "background:#222;padding:12px;border:1px solid #333;max-width:800px;margin:12px auto;";
  const title = document.createElement("h3");
  title.textContent = "Lobby — 10 ready to start (≥6 after 30s)";
  title.style.margin = "0 0 8px";
  const playersEl = document.createElement("div");
  playersEl.id = "lobby-players";
  playersEl.style.cssText = "font-size:14px;min-height:24px;";
  const countdownEl = document.createElement("div");
  countdownEl.id = "lobby-countdown";
  countdownEl.style.cssText = "font-weight:bold;margin:8px 0;";
  const btn = document.createElement("button");
  btn.id = "lobby-ready";
  btn.textContent = "Ready";
  btn.style.cssText = "padding:8px 16px;cursor:pointer;";
  const statusEl = document.createElement("span");
  statusEl.id = "lobby-status";
  statusEl.style.cssText = "margin-left:12px;font-size:12px;opacity:0.7;";
  wrap.append(title, playersEl, countdownEl, btn, statusEl);
  container.appendChild(wrap);

  let ready = false;
  btn.addEventListener("click", () => {
    ready = !ready;
    btn.textContent = ready ? "Unready" : "Ready";
    btn.style.background = ready ? "#2a6" : "";
    onReadyToggle(ready);
    statusEl.textContent = ready ? "You are READY" : "You are not ready";
  });

  return {
    update: (state, selfId) => {
      const entries = [...state.players.entries()];
      const readyCount = entries.filter(([, v]) => v).length;
      playersEl.textContent = `Players ${entries.length}/20 — Ready ${readyCount}/10 — ${entries
        .map(([id, v]) => `${id.slice(0, 4)}${id === selfId ? " (you)" : ""}:${v ? "✓" : "·"}`)
        .join("  ")}`;
    },
    setCountdown: (n) => {
      countdownEl.textContent = n > 0 ? `Match starting in ${n}…` : "";
    },
  };
}
