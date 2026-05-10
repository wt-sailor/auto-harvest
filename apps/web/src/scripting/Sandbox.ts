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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
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
    if (instructionCount > MAX_INSTRUCTIONS_PER_RUN) {
      throw new Error(`Instruction limit exceeded (${MAX_INSTRUCTIONS_PER_RUN}). Script stopped.`);
    }
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
    await sleep(commandDelay);
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
      await sleep(commandDelay);
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
      await sleep(commandDelay);
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

    wait: async (ticks: number) => {
      checkLimit();
      await sleep(Math.min(ticks * 100, 5000));
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

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Script timed out after ${SCRIPT_TIMEOUT_MS}ms`)), SCRIPT_TIMEOUT_MS);
    });

    await Promise.race([sandboxedFn(...Object.values(api), checkLimit), timeoutPromise]);

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

  while (!stopSignals.get(droneId)) {
    const drone = store.getState().game.drones.find(d => d.id === droneId);
    if (!drone || drone.status !== 'scripted') {
      break;
    }

    const result = await executeScript(code, { targetDroneId: droneId, isAutonomous: true });

    if (!result.success) {
      store.dispatch(addConsoleLog({ id: uuid(), message: `⚠ Drone ${drone.name} script error, stopping auto mode.`, type: 'warn', timestamp: Date.now() }));
      store.dispatch(setDroneStatus({ droneId, status: 'idle' }));
      break;
    }
    await sleep(500); // Wait briefly before restarting script loop
  }

  activeAutonomousLoops.delete(droneId);
  stopSignals.delete(droneId);
}

export function stopAutonomousDroneLoop(droneId: string) {
  stopSignals.set(droneId, true);
}
