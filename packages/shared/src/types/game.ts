// ============================================================
// AutoHarvest — Game Types
// ============================================================

/** Direction the robot can face / move */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** Types of terrain tiles */
export enum TileType {
  DIRT = 'dirt',
  GRASS = 'grass',
  WATER = 'water',
  STONE = 'stone',
  FARMLAND = 'farmland',
}

/** Crop species */
export enum CropType {
  WHEAT = 'wheat',
  CORN = 'corn',
  CARROT = 'carrot',
  POTATO = 'potato',
  TOMATO = 'tomato',
  PUMPKIN = 'pumpkin',
  STRAWBERRY = 'strawberry',
  SUNFLOWER = 'sunflower',
  MELON = 'melon',
}

/** Growth stage of a crop */
export enum GrowthStage {
  SEED = 0,
  SPROUT = 1,
  GROWING = 2,
  MATURE = 3,
  HARVESTABLE = 4,
}

/** A single crop instance on a tile */
export interface CropState {
  type: CropType;
  stage: GrowthStage;
  growthProgress: number; // 0–100 %
  plantedAt: number; // tick number
}

/** A single tile on the grid */
export interface TileState {
  x: number;
  y: number;
  type: TileType;
  crop: CropState | null;
}

// ─── Entity Types ─────────────────────────────────────────

/** The player character (always present from Tier 0) */
export interface FarmerState {
  x: number;
  y: number;
  direction: Direction;
  visualX: number;
  visualY: number;
  energy: number;
  maxEnergy: number;
}

/** Drone status */
export type DroneStatus = 'idle' | 'manual' | 'scripted';

/** A single drone entity */
export interface DroneState {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: Direction;
  visualX: number;
  visualY: number;
  energy: number;
  maxEnergy: number;
  status: DroneStatus;
  assignedZoneId: string | null;
  script: string | null;
}

/** A farm zone that a drone can be assigned to */
export interface FarmZone {
  id: string;
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

// ─── Legacy compat: RobotState maps to FarmerState ────────
export type RobotState = FarmerState;

// ─── Progression ──────────────────────────────────────────

/** Player progression tier */
export type Tier = 0 | 1 | 2 | 3 | 4;

/** Progression tracking */
export interface ProgressionState {
  tier: Tier;
  totalGoldEarned: number;
  totalCropsHarvested: number;
  purchasedItems: string[];
  unlockedCrops: CropType[];
}

/** Categories for shop items */
export type ShopCategory = 'drone' | 'farm' | 'crop' | 'upgrade';

/** Shop item definition */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: ShopCategory;
  icon: string;
  requiredTier: number;
  maxPurchases: number;
}

/** Resource types the player can collect */
export enum ResourceType {
  WHEAT = 'wheat',
  CORN = 'corn',
  CARROT = 'carrot',
  POTATO = 'potato',
  TOMATO = 'tomato',
  PUMPKIN = 'pumpkin',
  STRAWBERRY = 'strawberry',
  SUNFLOWER = 'sunflower',
  MELON = 'melon',
  SEED_WHEAT = 'seed_wheat',
  SEED_CORN = 'seed_corn',
  SEED_CARROT = 'seed_carrot',
  SEED_POTATO = 'seed_potato',
  SEED_TOMATO = 'seed_tomato',
  SEED_PUMPKIN = 'seed_pumpkin',
  SEED_STRAWBERRY = 'seed_strawberry',
  SEED_SUNFLOWER = 'seed_sunflower',
  SEED_MELON = 'seed_melon',
  GOLD = 'gold',
  WOOD = 'wood',
}

/** A single inventory item */
export interface InventoryItem {
  type: ResourceType;
  quantity: number;
}

/** Full inventory */
export interface Inventory {
  items: Record<string, number>;
  maxSlots: number;
}

/** Control mode — who the player is driving */
export type ControlMode = 'farmer' | 'drone';

/** The complete world state (serializable) */
export interface WorldState {
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
  totalHarvested: number;
  totalPlanted: number;
}

/** Script execution result */
export interface ScriptResult {
  success: boolean;
  logs: string[];
  error?: string;
  instructionsExecuted: number;
}

/** Console log entry */
export interface ConsoleEntry {
  id: string;
  message: string;
  type: 'info' | 'error' | 'warn' | 'success';
  timestamp: number;
}
