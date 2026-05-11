// ============================================================
// AutoHarvest — Game Engine (Tick Loop + Render Loop)
// ============================================================

import { Renderer } from './Renderer';
import { store } from '../store';
import { gameTick, updateEntityVisuals } from '../store/slices/gameSlice';

export class GameEngine {
  private renderer: Renderer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private isDestroyed = false;

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.isDestroyed = false;
  }

  start() {
    if (this.isDestroyed) return;
    this.startTickLoop();
    this.lastFrameTime = performance.now();
    this.renderLoop(this.lastFrameTime);
  }

  stop() {
    if (this.tickInterval) { clearInterval(this.tickInterval); this.tickInterval = null; }
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }

  destroy() {
    this.stop();
    this.isDestroyed = true;
    this.renderer = null;
    this.canvas = null;
  }

  resize(width: number, height: number) {
    this.renderer?.resize(width, height);
  }

  private startTickLoop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    const state = store.getState().game;
    const interval = 1000 / state.tickRate;
    this.tickInterval = setInterval(() => {
      store.dispatch(gameTick());
    }, interval);
  }

  private renderLoop = (now: number) => {
    if (this.isDestroyed) return;
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    const state = store.getState().game;

    // Only dispatch visual updates if something is actually moving
    let needsInterpolation = false;
    const isMoving = (vX: number, vY: number, tX: number, tY: number) => 
      Math.abs(vX - tX) > 0.001 || Math.abs(vY - tY) > 0.001;

    if (isMoving(state.farmer.visualX, state.farmer.visualY, state.farmer.x, state.farmer.y)) {
      needsInterpolation = true;
    } else {
      for (const drone of state.drones) {
        if (isMoving(drone.visualX, drone.visualY, drone.x, drone.y)) {
          needsInterpolation = true;
          break;
        }
      }
    }

    if (needsInterpolation) {
      store.dispatch(updateEntityVisuals(dt));
    }

    if (this.renderer) {
      const state = store.getState().game;
      this.renderer.render(
        state.tiles,
        state.farmer,
        state.drones,
        state.farmZones,
        state.gridWidth,
        state.gridHeight,
        state.controlMode,
        state.activeDroneId,
      );
    }

    this.rafId = requestAnimationFrame(this.renderLoop);
  };
}

export const gameEngine = new GameEngine();
