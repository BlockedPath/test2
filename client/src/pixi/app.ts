import { Application } from "pixi.js";

export async function createPixiApp(
  container: HTMLElement,
  width = 800,
  height = 800,
): Promise<Application> {
  const app = new Application({
    width,
    height,
    backgroundColor: 0x1a1a1a,
    antialias: false,
    resolution: Math.min(window.devicePixelRatio, 1.5), // per §4 mobile guardrail
    autoDensity: true,
  });

  container.appendChild(app.view as HTMLCanvasElement);

  // Mobile tier: opaque BG, no AA already set; resolution capped above
  return app;
}
