// ============================================================
// AutoHarvest — Resource Bar (Tier-aware + Dynamic seeds)
// ============================================================

import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  selectFarmer, selectDrones, selectControlMode, selectActiveDrone,
  selectGameStats, selectInventory, selectActivePlotId, switchPlot
} from '../../store/slices/gameSlice';
import { selectTier, selectUnlockedCrops, selectPurchasedItems } from '../../store/slices/progressionSlice';
import { TierProgressBar } from './TierProgressBar';
import { Zap, Bot } from 'lucide-react';
import { CROP_DEFINITIONS } from '@autoharvest/shared';
import type { CropType } from '@autoharvest/shared';

function formatTime(ticks: number, tickRate: number) {
  const totalSeconds = Math.floor(ticks / (tickRate || 10));
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function ResourceBar() {
  const dispatch = useAppDispatch();
  const farmer = useAppSelector(selectFarmer);
  const drones = useAppSelector(selectDrones);
  const controlMode = useAppSelector(selectControlMode);
  const activeDrone = useAppSelector(selectActiveDrone);
  const stats = useAppSelector(selectGameStats);
  const inventory = useAppSelector(selectInventory);
  const tier = useAppSelector(selectTier);
  const unlockedCrops = useAppSelector(selectUnlockedCrops);
  const activePlotId = useAppSelector(selectActivePlotId);
  const purchasedItems = useAppSelector(selectPurchasedItems);

  const gold = inventory.items.gold || 0;
  const isPlot2Unlocked = purchasedItems.includes('farm-expand-1');

  // Get active entity energy
  const activeEntity = controlMode === 'drone' && activeDrone ? activeDrone : farmer;
  const energyPercent = (activeEntity.energy / activeEntity.maxEnergy) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 text-xs overflow-x-auto"
    >
      {/* Tier Progress */}
      <TierProgressBar />

      <div className="w-px h-5 bg-farm-800/40 shrink-0" />

      {/* Control mode indicator */}
      <motion.div
        key={controlMode}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-farm-900/40 border border-farm-800/40 shrink-0"
      >
        <span className="text-sm">{controlMode === 'farmer' ? '🧑‍🌾' : '🤖'}</span>
        <span className="text-farm-300 font-medium">
          {controlMode === 'farmer' ? 'Farmer' : activeDrone?.name || 'Drone'}
        </span>
      </motion.div>

      {/* Plot Switcher */}
      <div className="flex items-center gap-1 bg-farm-900/40 border border-farm-800/40 p-0.5 rounded-lg shrink-0">
        <button
          onClick={() => dispatch(switchPlot(1))}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
            activePlotId === 1
              ? 'bg-olive-500 text-farm-100 font-semibold shadow-sm shadow-olive-950/20'
              : 'text-farm-400 hover:text-farm-200 hover:bg-farm-800/40'
          }`}
        >
          Plot 1
        </button>
        <button
          onClick={() => {
            if (isPlot2Unlocked) {
              dispatch(switchPlot(2));
            }
          }}
          disabled={!isPlot2Unlocked}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
            activePlotId === 2
              ? 'bg-olive-500 text-farm-100 font-semibold shadow-sm shadow-olive-950/20'
              : isPlot2Unlocked
              ? 'text-farm-400 hover:text-farm-200 hover:bg-farm-800/40'
              : 'text-farm-600 cursor-not-allowed opacity-60'
          }`}
          title={isPlot2Unlocked ? "Switch to Plot 2" : "Unlock Plot 2 in the Shop"}
        >
          Plot 2 {!isPlot2Unlocked && '🔒'}
        </button>
      </div>

      {/* Energy */}
      <div className="flex items-center gap-1.5 shrink-0">
        <motion.div
          animate={activeEntity.energy < 20 ? { x: [0, -2, 2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.4 }}
        >
          <Zap className="w-3.5 h-3.5 text-energy" />
        </motion.div>
        <div className="w-16 h-2 rounded-full bg-farm-800/50 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: energyPercent > 30 ? '#FFD700' : '#E74C3C' }}
            animate={{ width: `${energyPercent}%` }}
          />
        </div>
        <span className="text-farm-400 font-mono w-6">{Math.round(activeEntity.energy)}</span>
      </div>

      {/* Gold */}
      <span className="flex items-center gap-1 text-yellow-400 font-mono shrink-0">
        💰 {gold}
      </span>

      {/* Seeds — dynamically show all unlocked crops */}
      {unlockedCrops.map((cropType) => {
        const def = CROP_DEFINITIONS[cropType as CropType];
        if (!def) return null;
        const seedCount = inventory.items[`seed_${cropType}`] || 0;
        return (
          <span key={cropType} className="flex items-center gap-1 text-farm-400 shrink-0" title={`${def.name} Seeds`}>
            {def.emoji} {seedCount}
          </span>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Drone count */}
      {drones.length > 0 && (
        <div className="flex items-center gap-1 text-farm-500 shrink-0">
          <Bot className="w-3 h-3" />
          <span>{drones.length}</span>
        </div>
      )}

      {/* Stats */}
      <span className="text-farm-600 shrink-0 flex items-center gap-1 font-mono" title={`Tick: ${stats.tick}`}>
        ⏱ {formatTime(stats.tick, stats.tickRate)}
      </span>
      <span className="text-farm-600 shrink-0">
        Pos: ({activeEntity.x},{activeEntity.y})
      </span>

      {/* Tab hint */}
      {drones.length > 0 && (
        <span className="text-farm-700 shrink-0">Tab: Switch</span>
      )}
    </motion.div>
  );
}
