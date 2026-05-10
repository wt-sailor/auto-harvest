// ============================================================
// AutoHarvest — Drone Manager Panel (Rename + Per-Drone Scripts)
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  selectDrones, selectActiveDrone,
  selectDrone as selectDroneAction,
  setDroneStatus, renameDrone,
} from '../../store/slices/gameSlice';
import { selectTier, selectCanAutomate } from '../../store/slices/progressionSlice';
import { setSelectedDroneForScript, setActivePanel } from '../../store/slices/uiSlice';
import { Bot, Play, Square, Crosshair, Code2, Zap, Pencil, Check, X } from 'lucide-react';

export function DroneManagerPanel() {
  const dispatch = useAppDispatch();
  const drones = useAppSelector(selectDrones);
  const activeDrone = useAppSelector(selectActiveDrone);
  const tier = useAppSelector(selectTier);
  const canAutomate = useAppSelector(selectCanAutomate);

  const [renamingDroneId, setRenamingDroneId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  if (drones.length === 0) {
    return (
      <div className="h-full glass-panel flex items-center justify-center p-6">
        <div className="text-center">
          <Bot className="w-10 h-10 text-farm-700 mx-auto mb-3" />
          <p className="text-farm-400 text-sm font-display font-semibold">No Drones Yet</p>
          <p className="text-farm-600 text-xs mt-1">Buy your first drone from the Shop!</p>
        </div>
      </div>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'manual': return '🎮';
      case 'scripted': return '⟳';
      default: return '💤';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'manual': return 'text-blue-400';
      case 'scripted': return 'text-amber-400';
      default: return 'text-farm-600';
    }
  };

  const handleStartRename = (droneId: string, currentName: string) => {
    setRenamingDroneId(droneId);
    setRenameValue(currentName);
  };

  const handleConfirmRename = (droneId: string) => {
    if (renameValue.trim()) {
      dispatch(renameDrone({ droneId, name: renameValue }));
    }
    setRenamingDroneId(null);
    setRenameValue('');
  };

  const handleCancelRename = () => {
    setRenamingDroneId(null);
    setRenameValue('');
  };

  const handleEditScript = (droneId: string) => {
    dispatch(setSelectedDroneForScript(droneId));
    dispatch(setActivePanel('editor'));
  };

  return (
    <div className="h-full flex flex-col glass-panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-farm-800/40">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          <span className="font-display font-semibold text-sm text-farm-200">Drones ({drones.length})</span>
        </div>
        <span className="text-xs text-farm-500">Tab to switch</span>
      </div>

      {/* Drone list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {drones.map((drone, i) => {
          const isActive = activeDrone?.id === drone.id;
          const isRenaming = renamingDroneId === drone.id;

          return (
            <motion.div
              key={drone.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-lg border p-3 transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-600/50 bg-blue-900/15'
                  : 'border-farm-800/40 bg-farm-900/40 hover:border-farm-700/40'
              }`}
              onClick={() => dispatch(selectDroneAction(drone.id))}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-lg shrink-0">🤖</span>
                  {isRenaming ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRename(drone.id);
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        autoFocus
                        maxLength={20}
                        className="flex-1 min-w-0 bg-farm-800/60 border border-farm-700/50 rounded px-2 py-0.5 text-sm text-farm-100 font-display font-semibold focus:border-blue-500/50 focus:outline-none"
                      />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleConfirmRename(drone.id)}
                        className="p-0.5 rounded text-green-400 hover:bg-green-600/20"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCancelRename}
                        className="p-0.5 rounded text-red-400 hover:bg-red-600/20"
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  ) : (
                    <>
                      <span className="font-display font-semibold text-sm text-farm-100 truncate">{drone.name}</span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleStartRename(drone.id, drone.name); }}
                        className="p-0.5 rounded text-farm-600 hover:text-farm-300 hover:bg-farm-800/40 shrink-0"
                        title="Rename drone"
                      >
                        <Pencil className="w-3 h-3" />
                      </motion.button>
                    </>
                  )}
                </div>
                <span className={`text-xs font-mono shrink-0 ml-2 ${statusColor(drone.status)}`}>
                  {statusIcon(drone.status)} {drone.status}
                </span>
              </div>

              {/* Position & energy */}
              <div className="flex items-center gap-3 text-farm-500 text-xs mb-2">
                <span className="flex items-center gap-1">
                  <Crosshair className="w-3 h-3" /> ({drone.x}, {drone.y})
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" /> {Math.round(drone.energy)}/{drone.maxEnergy}
                </span>
              </div>

              {/* Energy bar */}
              <div className="w-full h-1.5 rounded-full bg-farm-800/50 overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full bg-yellow-500"
                  animate={{ width: `${(drone.energy / drone.maxEnergy) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Script indicator */}
              <div className="flex items-center gap-1 text-farm-600 text-[10px] mb-2">
                <Code2 className="w-3 h-3" />
                <span className="truncate">{drone.script ? `${drone.script.split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).length} lines of code` : 'No script'}</span>
              </div>

              {/* Actions */}
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-farm-800/30"
                >
                  {drone.status !== 'manual' && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); dispatch(setDroneStatus({ droneId: drone.id, status: 'manual' })); }}
                      className="flex-1 py-1 text-xs rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 flex items-center justify-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Control
                    </motion.button>
                  )}
                  {canAutomate && drone.status !== 'scripted' && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(setDroneStatus({ droneId: drone.id, status: 'scripted' }));
                        dispatch(setSelectedDroneForScript(drone.id));
                      }}
                      className="flex-1 py-1 text-xs rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 flex items-center justify-center gap-1"
                    >
                      <Code2 className="w-3 h-3" /> Auto
                    </motion.button>
                  )}
                  {drone.status !== 'idle' && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); dispatch(setDroneStatus({ droneId: drone.id, status: 'idle' })); }}
                      className="flex-1 py-1 text-xs rounded bg-farm-800/40 text-farm-400 hover:bg-farm-800/60 flex items-center justify-center gap-1"
                    >
                      <Square className="w-3 h-3" /> Stop
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); handleEditScript(drone.id); }}
                    className="flex-1 py-1 text-xs rounded bg-olive-600/20 text-olive-400 hover:bg-olive-600/30 flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit Script
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
