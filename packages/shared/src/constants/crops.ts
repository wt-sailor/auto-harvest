// ============================================================
// AutoHarvest — Crop Definitions
// ============================================================

import { CropType } from '../types/game';

export interface CropDefinition {
  type: CropType;
  name: string;
  growthTicks: number; // ticks to go from seed to harvestable
  yield: number; // how many items harvested
  seedCost: number; // gold cost to buy seeds
  sellPrice: number; // gold per item sold
  color: {
    seed: string;
    sprout: string;
    growing: string;
    mature: string;
    harvestable: string;
  };
  emoji: string;
}

export const CROP_DEFINITIONS: Record<CropType, CropDefinition> = {
  [CropType.WHEAT]: {
    type: CropType.WHEAT,
    name: 'Wheat',
    growthTicks: 50,
    yield: 3,
    seedCost: 5,
    sellPrice: 4,
    color: {
      seed: '#8B7355',
      sprout: '#90BE6D',
      growing: '#F9C74F',
      mature: '#F4A261',
      harvestable: '#E6B422',
    },
    emoji: '🌾',
  },
  [CropType.CORN]: {
    type: CropType.CORN,
    name: 'Corn',
    growthTicks: 80,
    yield: 2,
    seedCost: 10,
    sellPrice: 8,
    color: {
      seed: '#8B7355',
      sprout: '#90BE6D',
      growing: '#B5D233',
      mature: '#FFD700',
      harvestable: '#FFB800',
    },
    emoji: '🌽',
  },
  [CropType.CARROT]: {
    type: CropType.CARROT,
    name: 'Carrot',
    growthTicks: 40,
    yield: 4,
    seedCost: 3,
    sellPrice: 3,
    color: {
      seed: '#8B7355',
      sprout: '#90BE6D',
      growing: '#F4845F',
      mature: '#FF6B35',
      harvestable: '#FF4500',
    },
    emoji: '🥕',
  },
  [CropType.POTATO]: {
    type: CropType.POTATO,
    name: 'Potato',
    growthTicks: 60,
    yield: 3,
    seedCost: 4,
    sellPrice: 5,
    color: {
      seed: '#8B7355',
      sprout: '#90BE6D',
      growing: '#C9B97A',
      mature: '#B8860B',
      harvestable: '#D4A574',
    },
    emoji: '🥔',
  },
  [CropType.TOMATO]: {
    type: CropType.TOMATO,
    name: 'Tomato',
    growthTicks: 70,
    yield: 5,
    seedCost: 8,
    sellPrice: 6,
    color: {
      seed: '#8B7355',
      sprout: '#90BE6D',
      growing: '#F08080',
      mature: '#DC143C',
      harvestable: '#FF2400',
    },
    emoji: '🍅',
  },
  [CropType.PUMPKIN]: {
    type: CropType.PUMPKIN,
    name: 'Pumpkin',
    growthTicks: 120,
    yield: 1,
    seedCost: 20,
    sellPrice: 30,
    color: {
      seed: '#8B7355',
      sprout: '#90BE6D',
      growing: '#E8A850',
      mature: '#FF7518',
      harvestable: '#FF6600',
    },
    emoji: '🎃',
  },
  [CropType.STRAWBERRY]: {
    type: CropType.STRAWBERRY,
    name: 'Strawberry',
    growthTicks: 35,
    yield: 6,
    seedCost: 6,
    sellPrice: 4,
    color: {
      seed: '#8B7355',
      sprout: '#90BE6D',
      growing: '#E8707A',
      mature: '#DC143C',
      harvestable: '#FF1744',
    },
    emoji: '🍓',
  },
  [CropType.SUNFLOWER]: {
    type: CropType.SUNFLOWER,
    name: 'Sunflower',
    growthTicks: 90,
    yield: 2,
    seedCost: 15,
    sellPrice: 12,
    color: {
      seed: '#8B7355',
      sprout: '#90BE6D',
      growing: '#F4D03F',
      mature: '#F1C40F',
      harvestable: '#F39C12',
    },
    emoji: '🌻',
  },
  [CropType.MELON]: {
    type: CropType.MELON,
    name: 'Melon',
    growthTicks: 150,
    yield: 1,
    seedCost: 30,
    sellPrice: 50,
    color: {
      seed: '#8B7355',
      sprout: '#90BE6D',
      growing: '#7DCEA0',
      mature: '#27AE60',
      harvestable: '#2ECC71',
    },
    emoji: '🍈',
  },
};
