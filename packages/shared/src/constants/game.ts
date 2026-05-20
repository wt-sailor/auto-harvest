// ============================================================
// AutoHarvest — Game Constants
// ============================================================

/** Default grid dimensions */
export const DEFAULT_GRID_WIDTH = 10;
export const DEFAULT_GRID_HEIGHT = 10;

/** Maximum grid size */
export const MAX_GRID_WIDTH = 50;
export const MAX_GRID_HEIGHT = 50;

/** Engine tick rate (ticks per second) */
export const TICK_RATE = 10;

/** Farmer defaults */
export const FARMER_MAX_ENERGY = 100;
export const FARMER_MOVE_ENERGY_COST = 1;
export const FARMER_PLANT_ENERGY_COST = 2;
export const FARMER_HARVEST_ENERGY_COST = 2;
export const FARMER_ENERGY_REGEN_RATE = 0.5; // per tick

// Legacy aliases
export const ROBOT_MAX_ENERGY = FARMER_MAX_ENERGY;
export const ROBOT_MOVE_ENERGY_COST = FARMER_MOVE_ENERGY_COST;
export const ROBOT_PLANT_ENERGY_COST = FARMER_PLANT_ENERGY_COST;
export const ROBOT_HARVEST_ENERGY_COST = FARMER_HARVEST_ENERGY_COST;
export const ROBOT_ENERGY_REGEN_RATE = FARMER_ENERGY_REGEN_RATE;

/** Drone defaults */
export const DRONE_MAX_ENERGY = 80;
export const DRONE_MOVE_ENERGY_COST = 1;
export const DRONE_PLANT_ENERGY_COST = 1; // Drones are more efficient
export const DRONE_HARVEST_ENERGY_COST = 1;
export const DRONE_ENERGY_REGEN_RATE = 0.3;

/** Scripting limits */
export const MAX_INSTRUCTIONS_PER_RUN = 10000;
export const SCRIPT_TIMEOUT_MS = 5000;
export const AUTO_DRONE_SCRIPT_INTERVAL = 50; // ticks between auto-runs

/** Inventory */
export const DEFAULT_MAX_INVENTORY_SLOTS = 20;

/** Starting resources */
export const STARTING_GOLD = 30; // Reduced — player must earn more
export const STARTING_SEEDS = {
  seed_wheat: 10,
  seed_carrot: 5,
};

/** Tile rendering */
export const TILE_SIZE = 64; // pixels
export const TILE_GAP = 1; // pixels between tiles

/** Growth stages thresholds (as % of total growth ticks) */
export const GROWTH_THRESHOLDS = {
  SPROUT: 0.15,
  GROWING: 0.4,
  MATURE: 0.75,
  HARVESTABLE: 1.0,
};

// ─── Progression ──────────────────────────────────────────

/** Gold thresholds to reach each tier */
export const TIER_THRESHOLDS = [0, 50, 200, 500, 1500];

/** Tier display info */
export const TIER_INFO = [
  { name: 'Manual Farmer', icon: '🧑‍🌾', description: 'Farm by hand with WASD' },
  { name: 'Drone Pilot', icon: '🎮', description: 'Control your first drone' },
  { name: 'Script Writer', icon: '💻', description: 'Write code to control drones' },
  { name: 'Auto Farmer', icon: '🤖', description: 'Drones farm automatically' },
  { name: 'Farm Tycoon', icon: '🏗️', description: 'Expand your farming empire' },
];

/** Drone costs */
export const DRONE_BASE_COST = 100;
export const DRONE_COST_MULTIPLIER = 1.8;
export const MAX_DRONES = 4;

/** Farm expansion */
export const FARM_EXPAND_COST = 300;
export const FARM_EXPAND_ROWS = 2;
export const FARM_EXPAND_COLS = 2;

// ─── Shop ─────────────────────────────────────────────────

import type { ShopItem } from '../types/game';

export const SHOP_ITEMS: ShopItem[] = [
  // --- Drones ---
  {
    id: 'drone-1', name: 'Worker Drone', description: 'Your first farming drone. Control it with keyboard or scripts.',
    cost: 100, category: 'drone', icon: '🤖', requiredTier: 1, maxPurchases: 1,
  },
  {
    id: 'drone-2', name: 'Worker Drone II', description: 'A second drone for more farming power.',
    cost: 180, category: 'drone', icon: '🤖', requiredTier: 3, maxPurchases: 1,
  },
  {
    id: 'drone-3', name: 'Worker Drone III', description: 'Third drone. You\'re building a fleet!',
    cost: 320, category: 'drone', icon: '🤖', requiredTier: 3, maxPurchases: 1,
  },
  {
    id: 'drone-4', name: 'Worker Drone IV', description: 'Maximum drone capacity reached.',
    cost: 580, category: 'drone', icon: '🤖', requiredTier: 4, maxPurchases: 1,
  },

  // --- Farm ---
  {
    id: 'farm-expand-1', name: 'Unlock Plot 2', description: 'Purchase a second plot to double your farming capacity.',
    cost: 300, category: 'farm', icon: '🏗️', requiredTier: 4, maxPurchases: 1,
  },

  // --- Crops ---
  {
    id: 'unlock-corn', name: 'Corn Seeds', description: 'Unlock corn farming. Slow but valuable.',
    cost: 50, category: 'crop', icon: '🌽', requiredTier: 1, maxPurchases: 1,
  },
  {
    id: 'unlock-potato', name: 'Potato Seeds', description: 'Unlock potato farming.',
    cost: 80, category: 'crop', icon: '🥔', requiredTier: 2, maxPurchases: 1,
  },
  {
    id: 'unlock-tomato', name: 'Tomato Seeds', description: 'Unlock tomato farming. High yield!',
    cost: 120, category: 'crop', icon: '🍅', requiredTier: 2, maxPurchases: 1,
  },
  {
    id: 'unlock-pumpkin', name: 'Pumpkin Seeds', description: 'Unlock pumpkins. Slow but very profitable.',
    cost: 200, category: 'crop', icon: '🎃', requiredTier: 3, maxPurchases: 1,
  },

  // --- Upgrades ---
  {
    id: 'energy-upgrade-1', name: 'Battery Pack I', description: 'Increase max energy by 50 for farmer and all drones.',
    cost: 80, category: 'upgrade', icon: '🔋', requiredTier: 1, maxPurchases: 1,
  },
  {
    id: 'energy-upgrade-2', name: 'Battery Pack II', description: 'Increase max energy by another 50.',
    cost: 200, category: 'upgrade', icon: '🔋', requiredTier: 2, maxPurchases: 1,
  },
  {
    id: 'speed-upgrade', name: 'Turbo Regen', description: 'Double energy regeneration rate.',
    cost: 150, category: 'upgrade', icon: '⚡', requiredTier: 2, maxPurchases: 1,
  },
  {
    id: 'seed-pack-wheat', name: 'Wheat Seed Pack', description: 'Get 20 wheat seeds.',
    cost: 15, category: 'crop', icon: '🌾', requiredTier: 0, maxPurchases: 99,
  },
  {
    id: 'seed-pack-carrot', name: 'Carrot Seed Pack', description: 'Get 15 carrot seeds.',
    cost: 12, category: 'crop', icon: '🥕', requiredTier: 0, maxPurchases: 99,
  },
  {
    id: 'seed-pack-corn', name: 'Corn Seed Pack', description: 'Get 10 corn seeds.',
    cost: 25, category: 'crop', icon: '🌽', requiredTier: 1, maxPurchases: 99,
  },
  {
    id: 'seed-pack-potato', name: 'Potato Seed Pack', description: 'Get 12 potato seeds.',
    cost: 20, category: 'crop', icon: '🥔', requiredTier: 2, maxPurchases: 99,
  },
  {
    id: 'seed-pack-tomato', name: 'Tomato Seed Pack', description: 'Get 8 tomato seeds.',
    cost: 30, category: 'crop', icon: '🍅', requiredTier: 2, maxPurchases: 99,
  },
  {
    id: 'seed-pack-pumpkin', name: 'Pumpkin Seed Pack', description: 'Get 5 pumpkin seeds.',
    cost: 50, category: 'crop', icon: '🎃', requiredTier: 3, maxPurchases: 99,
  },
  {
    id: 'unlock-strawberry', name: 'Strawberry Seeds', description: 'Unlock strawberry farming. Fast growth, good profit.',
    cost: 100, category: 'crop', icon: '🍓', requiredTier: 2, maxPurchases: 1,
  },
  {
    id: 'unlock-sunflower', name: 'Sunflower Seeds', description: 'Unlock sunflowers. Beautiful and profitable!',
    cost: 160, category: 'crop', icon: '🌻', requiredTier: 3, maxPurchases: 1,
  },
  {
    id: 'unlock-melon', name: 'Melon Seeds', description: 'Unlock melon farming. Very slow but massive profit.',
    cost: 250, category: 'crop', icon: '🍈', requiredTier: 4, maxPurchases: 1,
  },
  {
    id: 'seed-pack-strawberry', name: 'Strawberry Seed Pack', description: 'Get 10 strawberry seeds.',
    cost: 25, category: 'crop', icon: '🍓', requiredTier: 2, maxPurchases: 99,
  },
  {
    id: 'seed-pack-sunflower', name: 'Sunflower Seed Pack', description: 'Get 6 sunflower seeds.',
    cost: 40, category: 'crop', icon: '🌻', requiredTier: 3, maxPurchases: 99,
  },
  {
    id: 'seed-pack-melon', name: 'Melon Seed Pack', description: 'Get 3 melon seeds.',
    cost: 70, category: 'crop', icon: '🍈', requiredTier: 4, maxPurchases: 99,
  },
];
