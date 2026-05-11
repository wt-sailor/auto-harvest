// ============================================================
// AutoHarvest — Sandboxed Script Execution (Drone-aware)
// ============================================================

import { store } from '../store';
import { moveRobot, moveDrone, plantCrop, harvestCrop, setDroneStatus } from '../store/slices/gameSlice';
import { earnGold } from '../store/slices/progressionSlice';
import { addConsoleLog, setScriptRunning } from '../store/slices/uiSlice';
import type { CropType, ConsoleEntry } from '@autoharvest/shared';
import { MAX_INSTRUCTIONS_PER_RUN, SCRIPT_TIMEOUT_MS, CROP_DEFINITIONS } from '@autoharvest/shared';
import { v4 as uuid } from 'uuid';

interface ExecutionResult {
  success: boolean;
  logs: string[];
  error?: string;
  instructionsExecuted: number;
}

async function sleep(ms: number, droneId?: string): Promise<void> {
  const step = 50;
  let elapsed = 0;
  while (elapsed < ms) {
    if (droneId && stopSignals.get(droneId)) {
      throw new Error('Script stopped by user.');
    }
    if (!droneId && stopSignals.get('manual')) {
      throw new Error('Script stopped by user.');
    }
    await new Promise((r) => setTimeout(r, Math.min(step, ms - elapsed)));
    elapsed += step;
  }
}

/**
 * Execute a script targeting either the active entity (farmer/drone)
 * or a specific drone by ID.
 */
export async function executeScript(code: string, options?: { targetDroneId?: string; isAutonomous?: boolean }): Promise<ExecutionResult> {
  const logs: string[] = [];
  let instructionCount = 0;
  const commandDelay = 150;

  const addLog = (message: string, type: ConsoleEntry['type'] = 'info') => {
    const entry: ConsoleEntry = { id: uuid(), message, type, timestamp: Date.now() };
    store.dispatch(addConsoleLog(entry));
    logs.push(message);
  };

  const checkLimit = () => {
    instructionCount++;
    // We allow infinite loops now since transformLoops yields to the event loop
    // and manual termination is handled via stopSignals.

    if (options?.targetDroneId && stopSignals.get(options.targetDroneId)) {
      throw new Error('Script stopped by user.');
    }
    if (!options?.isAutonomous && stopSignals.get('manual')) {
      throw new Error('Script stopped by user.');
    }
  };

  // Resolve which entity to target
  const getTarget = () => {
    const state = store.getState().game;
    if (options?.targetDroneId) {
      return state.drones.find((d) => d.id === options.targetDroneId) || null;
    }
    if (state.controlMode === 'drone' && state.activeDroneId) {
      return state.drones.find((d) => d.id === state.activeDroneId) || null;
    }
    return state.farmer;
  };

  const isDroneTarget = () => {
    if (options?.targetDroneId) return true;
    return store.getState().game.controlMode === 'drone';
  };

  const getDroneId = (): string | undefined => {
    if (options?.targetDroneId) return options.targetDroneId;
    return store.getState().game.activeDroneId || undefined;
  };

  // ── Movement helpers ──

  const doMove = async (dir: 'up' | 'down' | 'left' | 'right') => {
    checkLimit();
    const target = getTarget();
    if (!target) { addLog('⚠ No active entity', 'warn'); return false; }
    const bx = target.x, by = target.y;

    if (isDroneTarget()) {
      const droneId = getDroneId();
      if (droneId) store.dispatch(moveDrone({ droneId, direction: dir }));
    } else {
      store.dispatch(moveRobot(dir));
    }

    const after = getTarget();
    const moved = after ? (after.x !== bx || after.y !== by) : false;
    if (!moved) addLog(`⚠ Cannot move ${dir}`, 'warn');
    await sleep(commandDelay, getDroneId());
    return moved;
  };

  // ── Sandboxed API ──
  const api = {
    moveUp: () => doMove('up'),
    moveDown: () => doMove('down'),
    moveLeft: () => doMove('left'),
    moveRight: () => doMove('right'),

    plant: async (cropType: string) => {
      checkLimit();
      const before = store.getState().game.totalPlanted;
      const droneId = getDroneId();
      store.dispatch(plantCrop({
        cropType: cropType as CropType,
        entityType: isDroneTarget() ? 'drone' : 'farmer',
        droneId,
      }));
      const after = store.getState().game.totalPlanted;
      const planted = after > before;
      if (planted) addLog(`🌱 Planted ${cropType}`, 'success');
      else addLog(`⚠ Cannot plant ${cropType}`, 'warn');
      await sleep(commandDelay, getDroneId());
      return planted;
    },

    harvest: async () => {
      checkLimit();
      const beforeGold = store.getState().game.inventory.items.gold || 0;
      const before = store.getState().game.totalHarvested;
      const droneId = getDroneId();
      store.dispatch(harvestCrop({
        entityType: isDroneTarget() ? 'drone' : 'farmer',
        droneId,
      }));
      const after = store.getState().game.totalHarvested;
      const harvested = after > before;
      if (harvested) {
        const afterGold = store.getState().game.inventory.items.gold || 0;
        const goldEarned = afterGold - beforeGold;
        if (goldEarned > 0) {
          store.dispatch(earnGold(goldEarned));
        }
        addLog(`🌾 Harvested! +${goldEarned}g`, 'success');
      } else {
        addLog('⚠ Nothing to harvest here', 'warn');
      }
      await sleep(commandDelay, getDroneId());
      return harvested;
    },

    getTile: () => {
      checkLimit();
      const target = getTarget();
      if (!target) return null;
      return store.getState().game.tiles[target.y]?.[target.x] || null;
    },

    getTileAt: (x: number, y: number) => {
      checkLimit();
      const { tiles, gridWidth, gridHeight } = store.getState().game;
      if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return null;
      return { ...tiles[y][x] };
    },

    getPosition: () => {
      checkLimit();
      const target = getTarget();
      if (!target) return { x: 0, y: 0, direction: 'right' };
      return { x: target.x, y: target.y, direction: target.direction };
    },

    getInventory: () => {
      checkLimit();
      return { ...store.getState().game.inventory.items };
    },

    getEnergy: () => {
      checkLimit();
      const target = getTarget();
      if (!target) return { current: 0, max: 0 };
      return { current: target.energy, max: target.maxEnergy };
    },

    getDrones: () => {
      checkLimit();
      return store.getState().game.drones.map((d) => ({
        id: d.id, name: d.name, x: d.x, y: d.y, status: d.status, energy: d.energy,
      }));
    },

    log: (message: unknown) => {
      checkLimit();
      const msg = typeof message === 'object' ? JSON.stringify(message) : String(message);
      addLog(msg, 'info');
    },

    getItemCount: (itemType: string) => {
      checkLimit();
      return store.getState().game.inventory.items[itemType] || 0;
    },

    moveTo: async (targetX: number, targetY: number) => {
      checkLimit();
      let target = getTarget();
      if (!target) return false;
      
      const { gridWidth, gridHeight } = store.getState().game;
      if (targetX < 0 || targetX >= gridWidth || targetY < 0 || targetY >= gridHeight) {
        addLog(`⚠ Target (${targetX}, ${targetY}) out of bounds`, 'warn');
        return false;
      }

      let steps = 0;
      const maxSteps = 100;
      
      while ((target.x !== targetX || target.y !== targetY) && steps < maxSteps) {
        checkLimit();
        if (options?.targetDroneId && stopSignals.get(options.targetDroneId)) throw new Error('Script stopped by user.');
        
        let dir: 'up' | 'down' | 'left' | 'right' | null = null;
        if (target.x < targetX) dir = 'right';
        else if (target.x > targetX) dir = 'left';
        else if (target.y < targetY) dir = 'down';
        else if (target.y > targetY) dir = 'up';
        
        if (dir) {
          const success = await doMove(dir);
          if (!success) {
            let altDir: 'up' | 'down' | 'left' | 'right' | null = null;
            if (dir === 'left' || dir === 'right') {
              if (target.y < targetY) altDir = 'down';
              else if (target.y > targetY) altDir = 'up';
              else altDir = target.y > 0 ? 'up' : 'down';
            } else {
              if (target.x < targetX) altDir = 'right';
              else if (target.x > targetX) altDir = 'left';
              else altDir = target.x > 0 ? 'left' : 'right';
            }
            if (altDir) {
              const altSuccess = await doMove(altDir);
              if (!altSuccess) {
                 addLog(`⚠ Path to (${targetX}, ${targetY}) completely blocked`, 'warn');
                 return false;
              }
            } else {
              return false;
            }
          }
        }
        target = getTarget()!;
        steps++;
      }
      
      if (target.x === targetX && target.y === targetY) {
        addLog(`📍 Reached (${targetX}, ${targetY})`, 'info');
        return true;
      }
      return false;
    },

    wait: async (ticks: number) => {
      checkLimit();
      await sleep(Math.min(ticks * 100, 5000), getDroneId());
    },

    getGridSize: () => {
      checkLimit();
      const { gridWidth, gridHeight } = store.getState().game;
      return { width: gridWidth, height: gridHeight };
    },
  };

  // ── Transform loops for safety ──
  const transformedCode = transformLoops(code);

  try {
    if (!options?.isAutonomous) {
      stopSignals.set('manual', false);
      addLog('▶ Script started...', 'info');
      store.dispatch(setScriptRunning(true));
    }

    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    const sandboxedFn = new AsyncFunction(
      ...Object.keys(api),
      '__checkLimit__',
      `"use strict";\n${transformedCode}`,
    );

    await sandboxedFn(...Object.values(api), checkLimit);

    if (!options?.isAutonomous) {
      addLog(`✅ Script completed (${instructionCount} instructions)`, 'success');
    }
    return { success: true, logs, instructionsExecuted: instructionCount };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    addLog(`❌ Error: ${errorMsg}`, 'error');
    return { success: false, logs, error: errorMsg, instructionsExecuted: instructionCount };
  } finally {
    if (!options?.isAutonomous) {
      store.dispatch(setScriptRunning(false));
    }
  }
}

function transformLoops(code: string): string {
  let transformed = code.replace(
    /while\s*\(([^)]*)\)\s*\{/g,
    'while ($1) { __checkLimit__(); await new Promise(r => setTimeout(r, 50));',
  );
  transformed = transformed.replace(
    /for\s*\(([^)]*)\)\s*\{/g,
    'for ($1) { __checkLimit__(); await new Promise(r => setTimeout(r, 50));',
  );
  return transformed;
}

export function stopScript() {
  stopSignals.set('manual', true);
  store.dispatch(setScriptRunning(false));
}

const activeAutonomousLoops = new Set<string>();
const stopSignals = new Map<string, boolean>();

export async function runAutonomousDroneLoop(droneId: string, code: string) {
  if (activeAutonomousLoops.has(droneId)) return;
  activeAutonomousLoops.add(droneId);
  stopSignals.set(droneId, false);

  const drone = store.getState().game.drones.find(d => d.id === droneId);
  if (!drone || drone.status !== 'scripted') {
    activeAutonomousLoops.delete(droneId);
    return;
  }

  const result = await executeScript(code, { targetDroneId: droneId, isAutonomous: true });

  if (!result.success && result.error !== 'Script stopped by user.') {
    store.dispatch(addConsoleLog({ id: uuid(), message: `⚠ Drone ${drone.name} script error.`, type: 'warn', timestamp: Date.now() }));
  }

  // Once script finishes or errors out, set status back to idle if it's still scripted
  const currentDrone = store.getState().game.drones.find(d => d.id === droneId);
  if (currentDrone && currentDrone.status === 'scripted') {
    store.dispatch(setDroneStatus({ droneId, status: 'idle' }));
  }

  activeAutonomousLoops.delete(droneId);
  stopSignals.delete(droneId);
}

export function stopAutonomousDroneLoop(droneId: string) {
  stopSignals.set(droneId, true);
}
