// ============================================================
// AutoHarvest — Game Slice (Farmer + Drones + Zones)
// ============================================================

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  type TileState,
  type FarmerState,
  type DroneState,
  type DroneStatus,
  type Inventory,
  type CropType,
  type Direction,
  type CropState,
  type ControlMode,
  type FarmZone,
  TileType,
  GrowthStage,
  DEFAULT_GRID_WIDTH,
  DEFAULT_GRID_HEIGHT,
  FARMER_MAX_ENERGY,
  FARMER_ENERGY_REGEN_RATE,
  FARMER_MOVE_ENERGY_COST,
  FARMER_PLANT_ENERGY_COST,
  FARMER_HARVEST_ENERGY_COST,
  DRONE_MAX_ENERGY,
  DRONE_ENERGY_REGEN_RATE,
  DRONE_MOVE_ENERGY_COST,
  DRONE_PLANT_ENERGY_COST,
  DRONE_HARVEST_ENERGY_COST,
  STARTING_GOLD,
  STARTING_SEEDS,
  CROP_DEFINITIONS,
  TILE_DEFINITIONS,
  GROWTH_THRESHOLDS,
  ResourceType,
} from '@autoharvest/shared';

// ─── Helpers ──────────────────────────────────────────────

export const DEFAULT_DRONE_SCRIPT = `// AutoHarvest Drone Script
// This script runs continuously while the drone is in 'Auto' mode.
// Available commands:
//   moveUp(), moveDown(), moveLeft(), moveRight()
//   plant("wheat"), harvest(), getTile(), getInventory()
//   log("message"), wait(ticks)

// Example: Simple Harvest Loop
await moveRight();
await harvest();
await wait(5);
`;

function createInitialTiles(width: number, height: number): TileState[][] {
  const tiles: TileState[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      const isCorner =
        (x <= 1 && y <= 1) || (x >= width - 2 && y <= 1) ||
        (x <= 1 && y >= height - 2) || (x >= width - 2 && y >= height - 2);

      let type: TileType;
      if (isCorner) type = TileType.GRASS;
      else if (isBorder) type = TileType.DIRT;
      else type = TileType.FARMLAND;

      tiles[y][x] = { x, y, type, crop: null };
    }
  }
  return tiles;
}

function createInitialInventory(): Inventory {
  return {
    items: { [ResourceType.GOLD]: STARTING_GOLD, ...STARTING_SEEDS },
    maxSlots: 20,
  };
}

function createFarmer(): FarmerState {
  return {
    x: 1, y: 1, direction: 'right' as Direction,
    visualX: 1, visualY: 1,
    energy: FARMER_MAX_ENERGY, maxEnergy: FARMER_MAX_ENERGY,
  };
}

function createDrone(id: string, name: string, x: number, y: number): DroneState {
  return {
    id, name, x, y,
    direction: 'right' as Direction,
    visualX: x, visualY: y,
    energy: DRONE_MAX_ENERGY, maxEnergy: DRONE_MAX_ENERGY,
    status: 'idle' as DroneStatus,
    assignedZoneId: null,
    script: DEFAULT_DRONE_SCRIPT,
  };
}

// ─── Movement helper ──────────────────────────────────────

function tryMoveEntity(
  entity: { x: number; y: number; direction: Direction; energy: number },
  dir: Direction,
  tiles: TileState[][],
  gridWidth: number,
  gridHeight: number,
  energyCost: number,
): boolean {
  if (entity.energy < energyCost) return false;

  let newX = entity.x;
  let newY = entity.y;
  switch (dir) {
    case 'up': newY -= 1; break;
    case 'down': newY += 1; break;
    case 'left': newX -= 1; break;
    case 'right': newX += 1; break;
  }

  if (newX < 0 || newX >= gridWidth || newY < 0 || newY >= gridHeight) return false;

  const tileDef = TILE_DEFINITIONS[tiles[newY][newX].type];
  if (!tileDef.walkable) return false;

  entity.x = newX;
  entity.y = newY;
  entity.direction = dir;
  entity.energy -= energyCost;
  return true;
}

// ─── State Interface ──────────────────────────────────────

interface GameState {
  gridWidth: number;
  gridHeight: number;
  tiles: TileState[][];
  farmer: FarmerState;
  drones: DroneState[];
  activeDroneId: string | null;
  controlMode: ControlMode;
  farmZones: FarmZone[];
  inventory: Inventory;
  tick: number;
  isRunning: boolean;
  tickRate: number;
  totalHarvested: number;
  totalPlanted: number;
}

const initialState: GameState = {
  gridWidth: DEFAULT_GRID_WIDTH,
  gridHeight: DEFAULT_GRID_HEIGHT,
  tiles: createInitialTiles(DEFAULT_GRID_WIDTH, DEFAULT_GRID_HEIGHT),
  farmer: createFarmer(),
  drones: [],
  activeDroneId: null,
  controlMode: 'farmer',
  farmZones: [],
  inventory: createInitialInventory(),
  tick: 0,
  isRunning: true,
  tickRate: 10,
  totalHarvested: 0,
  totalPlanted: 0,
};

// ─── Slice ────────────────────────────────────────────────

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    initWorld(state, action: PayloadAction<{ width?: number; height?: number } | undefined>) {
      const w = action.payload?.width ?? DEFAULT_GRID_WIDTH;
      const h = action.payload?.height ?? DEFAULT_GRID_HEIGHT;
      state.gridWidth = w;
      state.gridHeight = h;
      state.tiles = createInitialTiles(w, h);
      state.farmer = createFarmer();
      state.drones = [];
      state.activeDroneId = null;
      state.controlMode = 'farmer';
      state.farmZones = [];
      state.inventory = createInitialInventory();
      state.tick = 0;
      state.totalHarvested = 0;
      state.totalPlanted = 0;
    },

    // ── Movement ──

    moveFarmer(state, action: PayloadAction<Direction>) {
      tryMoveEntity(state.farmer, action.payload, state.tiles, state.gridWidth, state.gridHeight, FARMER_MOVE_ENERGY_COST);
    },

    moveDrone(state, action: PayloadAction<{ droneId: string; direction: Direction }>) {
      const drone = state.drones.find((d) => d.id === action.payload.droneId);
      if (!drone) return;
      tryMoveEntity(drone, action.payload.direction, state.tiles, state.gridWidth, state.gridHeight, DRONE_MOVE_ENERGY_COST);
    },

    // Legacy: moveRobot dispatches to current control target
    moveRobot(state, action: PayloadAction<Direction>) {
      if (state.controlMode === 'farmer') {
        tryMoveEntity(state.farmer, action.payload, state.tiles, state.gridWidth, state.gridHeight, FARMER_MOVE_ENERGY_COST);
      } else if (state.activeDroneId) {
        const drone = state.drones.find((d) => d.id === state.activeDroneId);
        if (drone) tryMoveEntity(drone, action.payload, state.tiles, state.gridWidth, state.gridHeight, DRONE_MOVE_ENERGY_COST);
      }
    },

    // ── Control switching ──

    switchControlMode(state) {
      if (state.drones.length === 0) return;
      if (state.controlMode === 'farmer') {
        state.controlMode = 'drone';
        if (!state.activeDroneId && state.drones.length > 0) {
          state.activeDroneId = state.drones[0].id;
          state.drones[0].status = 'manual';
        }
      } else {
        // Set current drone back to previous status
        const activeDrone = state.drones.find((d) => d.id === state.activeDroneId);
        if (activeDrone && activeDrone.status === 'manual') activeDrone.status = 'idle';
        state.controlMode = 'farmer';
      }
    },

    selectDrone(state, action: PayloadAction<string>) {
      const drone = state.drones.find((d) => d.id === action.payload);
      if (!drone) return;
      // Reset old active drone
      if (state.activeDroneId) {
        const old = state.drones.find((d) => d.id === state.activeDroneId);
        if (old && old.status === 'manual') old.status = 'idle';
      }
      state.activeDroneId = action.payload;
      state.controlMode = 'drone';
      drone.status = 'manual';
    },

    // ── Planting & Harvesting (works on active entity) ──

    plantCrop(state, action: PayloadAction<{ cropType: CropType; entityType?: 'farmer' | 'drone'; droneId?: string }>) {
      const { cropType, entityType, droneId } = action.payload;

      // Determine which entity is planting
      let entity: { x: number; y: number; energy: number } | undefined;
      let energyCost: number;

      if (entityType === 'drone' && droneId) {
        entity = state.drones.find((d) => d.id === droneId);
        energyCost = DRONE_PLANT_ENERGY_COST;
      } else if (state.controlMode === 'drone' && state.activeDroneId) {
        entity = state.drones.find((d) => d.id === state.activeDroneId);
        energyCost = DRONE_PLANT_ENERGY_COST;
      } else {
        entity = state.farmer;
        energyCost = FARMER_PLANT_ENERGY_COST;
      }

      if (!entity || entity.energy < energyCost) return;

      const tile = state.tiles[entity.y]?.[entity.x];
      if (!tile || tile.type !== TileType.FARMLAND || tile.crop !== null) return;

      const seedKey = `seed_${cropType}`;
      const seedCount = state.inventory.items[seedKey] || 0;
      if (seedCount <= 0) return;

      tile.crop = {
        type: cropType,
        stage: GrowthStage.SEED,
        growthProgress: 0,
        plantedAt: state.tick,
      };
      state.inventory.items[seedKey] = seedCount - 1;
      if (state.inventory.items[seedKey] <= 0) delete state.inventory.items[seedKey];
      entity.energy -= energyCost;
      state.totalPlanted += 1;
    },

    harvestCrop(state, action: PayloadAction<{ entityType?: 'farmer' | 'drone'; droneId?: string } | undefined>) {
      let entity: { x: number; y: number; energy: number } | undefined;
      let energyCost: number;

      if (action.payload?.entityType === 'drone' && action.payload?.droneId) {
        entity = state.drones.find((d) => d.id === action.payload!.droneId);
        energyCost = DRONE_HARVEST_ENERGY_COST;
      } else if (state.controlMode === 'drone' && state.activeDroneId) {
        entity = state.drones.find((d) => d.id === state.activeDroneId);
        energyCost = DRONE_HARVEST_ENERGY_COST;
      } else {
        entity = state.farmer;
        energyCost = FARMER_HARVEST_ENERGY_COST;
      }

      if (!entity || entity.energy < energyCost) return;

      const tile = state.tiles[entity.y]?.[entity.x];
      if (!tile?.crop || tile.crop.stage !== GrowthStage.HARVESTABLE) return;

      const cropDef = CROP_DEFINITIONS[tile.crop.type];
      const resourceKey = tile.crop.type as string;
      const seedKey = `seed_${tile.crop.type}`;

      // Harvest yield
      state.inventory.items[resourceKey] = (state.inventory.items[resourceKey] || 0) + cropDef.yield;
      // Auto-sell: add gold based on sell price
      const goldEarned = cropDef.yield * cropDef.sellPrice;
      state.inventory.items[ResourceType.GOLD] = (state.inventory.items[ResourceType.GOLD] || 0) + goldEarned;

      // Seed chance
      if (Math.random() > 0.5) {
        state.inventory.items[seedKey] = (state.inventory.items[seedKey] || 0) + 1;
      }

      tile.crop = null;
      entity.energy -= energyCost;
      state.totalHarvested += 1;
    },

    // ── Drones ──

    addDrone(state, action: PayloadAction<{ name?: string }>) {
      const idx = state.drones.length + 1;
      const name = action.payload?.name || `Drone #${idx}`;
      // Spawn near farmer
      const drone = createDrone(`drone-${idx}-${Date.now()}`, name, state.farmer.x, state.farmer.y);
      state.drones.push(drone);
      if (!state.activeDroneId) state.activeDroneId = drone.id;
    },

    setDroneStatus(state, action: PayloadAction<{ droneId: string; status: DroneStatus }>) {
      const drone = state.drones.find((d) => d.id === action.payload.droneId);
      if (drone) drone.status = action.payload.status;
    },

    setDroneScript(state, action: PayloadAction<{ droneId: string; script: string }>) {
      const drone = state.drones.find((d) => d.id === action.payload.droneId);
      if (drone) drone.script = action.payload.script;
    },

    assignDroneToZone(state, action: PayloadAction<{ droneId: string; zoneId: string | null }>) {
      const drone = state.drones.find((d) => d.id === action.payload.droneId);
      if (drone) drone.assignedZoneId = action.payload.zoneId;
    },

    renameDrone(state, action: PayloadAction<{ droneId: string; name: string }>) {
      const drone = state.drones.find((d) => d.id === action.payload.droneId);
      if (drone) drone.name = action.payload.name.trim() || drone.name;
    },

    // ── Farm Zones ──

    addFarmZone(state, action: PayloadAction<FarmZone>) {
      state.farmZones.push(action.payload);
    },

    removeFarmZone(state, action: PayloadAction<string>) {
      state.farmZones = state.farmZones.filter((z) => z.id !== action.payload);
      // Unassign drones from removed zone
      for (const drone of state.drones) {
        if (drone.assignedZoneId === action.payload) drone.assignedZoneId = null;
      }
    },

    // ── Farm Expansion ──

    expandFarm(state, action: PayloadAction<{ addRows: number; addCols: number }>) {
      const { addRows, addCols } = action.payload;
      const newW = state.gridWidth + addCols;
      const newH = state.gridHeight + addRows;
      const newTiles = createInitialTiles(newW, newH);

      // Copy existing tiles
      for (let y = 0; y < state.gridHeight; y++) {
        for (let x = 0; x < state.gridWidth; x++) {
          if (state.tiles[y]?.[x]) {
            newTiles[y][x] = state.tiles[y][x];
          }
        }
      }

      state.tiles = newTiles;
      state.gridWidth = newW;
      state.gridHeight = newH;
    },

    // ── Game Loop ──

    gameTick(state) {
      if (!state.isRunning) return;

      // Update crop growth
      for (const row of state.tiles) {
        for (const tile of row) {
          if (!tile.crop) continue;
          const cropDef = CROP_DEFINITIONS[tile.crop.type];
          const ticksAlive = state.tick - tile.crop.plantedAt + 1;
          const progress = Math.min(ticksAlive / cropDef.growthTicks, 1);

          let stage = GrowthStage.SEED;
          if (progress >= GROWTH_THRESHOLDS.HARVESTABLE) stage = GrowthStage.HARVESTABLE;
          else if (progress >= GROWTH_THRESHOLDS.MATURE) stage = GrowthStage.MATURE;
          else if (progress >= GROWTH_THRESHOLDS.GROWING) stage = GrowthStage.GROWING;
          else if (progress >= GROWTH_THRESHOLDS.SPROUT) stage = GrowthStage.SPROUT;

          tile.crop.growthProgress = progress * 100;
          tile.crop.stage = stage;
        }
      }

      // Regen farmer energy
      state.farmer.energy = Math.min(
        state.farmer.energy + FARMER_ENERGY_REGEN_RATE,
        state.farmer.maxEnergy,
      );

      // Regen drone energy
      for (const drone of state.drones) {
        drone.energy = Math.min(drone.energy + DRONE_ENERGY_REGEN_RATE, drone.maxEnergy);
      }

      state.tick += 1;
    },

    updateEntityVisuals(state, action: PayloadAction<number>) {
      const dt = action.payload;
      const lerpSpeed = 10 * dt;
      const factor = Math.min(lerpSpeed, 1);

      // Farmer interpolation
      const f = state.farmer;
      f.visualX += (f.x - f.visualX) * factor;
      f.visualY += (f.y - f.visualY) * factor;

      // Drone interpolation
      for (const d of state.drones) {
        d.visualX += (d.x - d.visualX) * factor;
        d.visualY += (d.y - d.visualY) * factor;
      }
    },

    // ── Misc ──

    setRunning(state, action: PayloadAction<boolean>) {
      state.isRunning = action.payload;
    },
    setTickRate(state, action: PayloadAction<number>) {
      state.tickRate = action.payload;
    },
    addItem(state, action: PayloadAction<{ type: string; quantity: number }>) {
      state.inventory.items[action.payload.type] = (state.inventory.items[action.payload.type] || 0) + action.payload.quantity;
    },
    removeItem(state, action: PayloadAction<{ type: string; quantity: number }>) {
      const current = state.inventory.items[action.payload.type] || 0;
      if (current >= action.payload.quantity) {
        state.inventory.items[action.payload.type] = current - action.payload.quantity;
        if (state.inventory.items[action.payload.type] <= 0) delete state.inventory.items[action.payload.type];
      }
    },
    upgradeEnergy(state, action: PayloadAction<number>) {
      state.farmer.maxEnergy += action.payload;
      state.farmer.energy = state.farmer.maxEnergy;
      for (const drone of state.drones) {
        drone.maxEnergy += action.payload;
        drone.energy = drone.maxEnergy;
      }
    },

    loadSerializedState(state, action: PayloadAction<string>) {
      try {
        const p = JSON.parse(action.payload);
        Object.assign(state, p);
      } catch (e) {
        console.error('Failed to load save:', e);
      }
    },
  },
});

export const {
  initWorld, moveFarmer, moveDrone, moveRobot, switchControlMode, selectDrone,
  plantCrop, harvestCrop, addDrone, setDroneStatus, setDroneScript, renameDrone,
  assignDroneToZone, addFarmZone, removeFarmZone, expandFarm,
  gameTick, updateEntityVisuals, setRunning, setTickRate,
  addItem, removeItem, upgradeEnergy, loadSerializedState,
} = gameSlice.actions;
export const gameReducer = gameSlice.reducer;

// ─── Selectors ────────────────────────────────────────────

export const selectFarmer = (s: { game: GameState }) => s.game.farmer;
export const selectDrones = (s: { game: GameState }) => s.game.drones;
export const selectActiveDrone = (s: { game: GameState }) =>
  s.game.drones.find((d) => d.id === s.game.activeDroneId) || null;
export const selectControlMode = (s: { game: GameState }) => s.game.controlMode;
export const selectTiles = (s: { game: GameState }) => s.game.tiles;
export const selectInventory = (s: { game: GameState }) => s.game.inventory;
export const selectTick = (s: { game: GameState }) => s.game.tick;
export const selectFarmZones = (s: { game: GameState }) => s.game.farmZones;
export const selectGridSize = (s: { game: GameState }) => ({ width: s.game.gridWidth, height: s.game.gridHeight });
export const selectGameStats = (s: { game: GameState }) => ({
  totalHarvested: s.game.totalHarvested, totalPlanted: s.game.totalPlanted,
  tick: s.game.tick, tickRate: s.game.tickRate,
});

// Legacy compat
export const selectRobot = selectFarmer;
export const updateRobotVisuals = updateEntityVisuals;
