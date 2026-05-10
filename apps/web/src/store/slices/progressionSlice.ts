// ============================================================
// AutoHarvest — Progression Slice (Redux Toolkit)
// ============================================================

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Tier, CropType, ProgressionState } from '@autoharvest/shared';
import { TIER_THRESHOLDS, SHOP_ITEMS } from '@autoharvest/shared';

const initialState: ProgressionState = {
  tier: 0 as Tier,
  totalGoldEarned: 0,
  totalCropsHarvested: 0,
  purchasedItems: [],
  unlockedCrops: ['wheat', 'carrot'] as CropType[],
};

const progressionSlice = createSlice({
  name: 'progression',
  initialState,
  reducers: {
    earnGold(state, action: PayloadAction<number>) {
      state.totalGoldEarned += action.payload;
      // Auto tier-up
      for (let t = TIER_THRESHOLDS.length - 1; t >= 0; t--) {
        if (state.totalGoldEarned >= TIER_THRESHOLDS[t] && state.tier < t) {
          state.tier = t as Tier;
          break;
        }
      }
    },

    incrementHarvests(state, action: PayloadAction<number>) {
      state.totalCropsHarvested += action.payload;
    },

    purchaseItem(state, action: PayloadAction<string>) {
      const itemId = action.payload;
      if (!state.purchasedItems.includes(itemId)) {
        state.purchasedItems.push(itemId);
      } else {
        // For items with maxPurchases > 1, allow duplicates
        state.purchasedItems.push(itemId);
      }

      // Handle crop unlocks
      const item = SHOP_ITEMS.find((i) => i.id === itemId);
      if (item) {
        const cropMap: Record<string, CropType> = {
          'unlock-corn': 'corn' as CropType,
          'unlock-potato': 'potato' as CropType,
          'unlock-tomato': 'tomato' as CropType,
          'unlock-pumpkin': 'pumpkin' as CropType,
          'unlock-strawberry': 'strawberry' as CropType,
          'unlock-sunflower': 'sunflower' as CropType,
          'unlock-melon': 'melon' as CropType,
        };
        if (cropMap[itemId] && !state.unlockedCrops.includes(cropMap[itemId])) {
          state.unlockedCrops.push(cropMap[itemId]);
        }
      }
    },

    resetProgression() {
      return initialState;
    },

    loadProgression(_state, action: PayloadAction<ProgressionState>) {
      return action.payload;
    },
  },
});

export const {
  earnGold,
  incrementHarvests,
  purchaseItem,
  resetProgression,
  loadProgression,
} = progressionSlice.actions;
export const progressionReducer = progressionSlice.reducer;

// ─── Selectors ────────────────────────────────────────────

export const selectTier = (s: { progression: ProgressionState }) => s.progression.tier;
export const selectTotalGoldEarned = (s: { progression: ProgressionState }) => s.progression.totalGoldEarned;
export const selectUnlockedCrops = (s: { progression: ProgressionState }) => s.progression.unlockedCrops;
export const selectPurchasedItems = (s: { progression: ProgressionState }) => s.progression.purchasedItems;

export const selectIsScriptUnlocked = (s: { progression: ProgressionState }) => s.progression.tier >= 2;
export const selectCanBuyDrone = (s: { progression: ProgressionState }) => s.progression.tier >= 1;
export const selectCanAutomate = (s: { progression: ProgressionState }) => s.progression.tier >= 3;
export const selectCanExpandFarm = (s: { progression: ProgressionState }) => s.progression.tier >= 4;

export const selectNextTierThreshold = (s: { progression: ProgressionState }) => {
  const nextTier = Math.min(s.progression.tier + 1, TIER_THRESHOLDS.length - 1);
  return TIER_THRESHOLDS[nextTier];
};

export const selectPurchaseCount = (s: { progression: ProgressionState }, itemId: string) =>
  s.progression.purchasedItems.filter((id) => id === itemId).length;
