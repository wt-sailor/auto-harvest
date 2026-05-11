// ============================================================
// AutoHarvest — Game Page (Server sync + auto-save)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GameCanvas } from '../components/game/GameCanvas';
import { ResourceBar } from '../components/game/ResourceBar';
import { CodeEditorPanel } from '../components/game/CodeEditorPanel';
import { ConsolePanel } from '../components/game/ConsolePanel';
import { ShopPanel } from '../components/game/ShopPanel';
import { DroneManagerPanel } from '../components/game/DroneManagerPanel';
import { store, useAppSelector, useAppDispatch } from '../store';
import {
  selectTier,
  selectIsScriptUnlocked,
  loadProgression,
  resetProgression,
} from '../store/slices/progressionSlice';
import { selectDrones, loadSerializedState, initWorld } from '../store/slices/gameSlice';
import { setActivePanel, type ActivePanel, addConsoleLog } from '../store/slices/uiSlice';
import { runAutonomousDroneLoop, stopAutonomousDroneLoop } from '../scripting/Sandbox';
import { worldsApi } from '../api/apiClient';
import { Link } from 'react-router-dom';
import {
  Sprout,
  Home,
  Save,
  Download,
  Settings,
  ShoppingCart,
  Code2,
  Bot,
  Loader2,
  Cloud,
  CloudOff,
  Check,
} from 'lucide-react';
import { v4 as uuid } from 'uuid';

const AUTO_SAVE_INTERVAL_MS = 60_000; // Auto-save every 60 seconds

export function GamePage() {
  const dispatch = useAppDispatch();
  const { worldId } = useParams<{ worldId?: string }>();
  const tier = useAppSelector(selectTier);
  const isScriptUnlocked = useAppSelector(selectIsScriptUnlocked);
  const drones = useAppSelector(selectDrones);
  const activePanel = useAppSelector((s) => s.ui.activePanel);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const [loadingWorld, setLoadingWorld] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [worldName, setWorldName] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isServerMode = !!worldId && isAuthenticated;

  // ── Load world from server on mount ──
  useEffect(() => {
    if (!worldId || !isAuthenticated) return;

    const loadWorld = async () => {
      setLoadingWorld(true);
      
      // Clear old state before loading
      dispatch(initWorld());
      dispatch(resetProgression());

      try {
        // Get world info
        const world = await worldsApi.get(worldId);
        setWorldName(world.name);

        // Try to load saved game state
        try {
          const save = await worldsApi.load(worldId);
          if (save.serializedState) {
            const parsed = JSON.parse(save.serializedState);
            if (parsed.game) {
              store.dispatch(loadSerializedState(JSON.stringify(parsed.game)));
            }
            if (parsed.progression) {
              store.dispatch(loadProgression(parsed.progression));
            }
            dispatch(
              addConsoleLog({
                id: uuid(),
                message: `☁️ World "${world.name}" loaded from server`,
                type: 'success',
                timestamp: Date.now(),
              }),
            );
          }
        } catch {
          // No save found — fresh world, that's okay
          dispatch(
            addConsoleLog({
              id: uuid(),
              message: `🌱 New world "${world.name}" — start farming!`,
              type: 'info',
              timestamp: Date.now(),
            }),
          );
        }
      } catch (err: any) {
        dispatch(
          addConsoleLog({
            id: uuid(),
            message: `❌ Failed to load world: ${err.response?.data?.message || err.message}`,
            type: 'error',
            timestamp: Date.now(),
          }),
        );
      } finally {
        setLoadingWorld(false);
      }
    };

    loadWorld();
  }, [worldId, isAuthenticated, dispatch]);

  // ── Serialize current state ──
  const serializeState = useCallback(() => {
    const state = store.getState();
    return JSON.stringify({
      game: state.game,
      progression: state.progression,
    });
  }, []);

  // ── Save to server ──
  const handleServerSave = useCallback(
    async (silent = false) => {
      if (!worldId || !isAuthenticated) return;
      setSaving(true);
      setSaveStatus('saving');
      try {
        await worldsApi.save(worldId, serializeState());
        setSaveStatus('saved');
        if (!silent) {
          dispatch(
            addConsoleLog({
              id: uuid(),
              message: '☁️ Game saved to server',
              type: 'success',
              timestamp: Date.now(),
            }),
          );
        }
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err: any) {
        setSaveStatus('error');
        dispatch(
          addConsoleLog({
            id: uuid(),
            message: `❌ Save failed: ${err.response?.data?.message || err.message}`,
            type: 'error',
            timestamp: Date.now(),
          }),
        );
        setTimeout(() => setSaveStatus('idle'), 3000);
      } finally {
        setSaving(false);
      }
    },
    [worldId, isAuthenticated, serializeState, dispatch],
  );

  // ── Local save (guest mode) ──
  const handleLocalSave = useCallback(() => {
    localStorage.setItem('autoharvest-save', serializeState());
    dispatch(
      addConsoleLog({
        id: uuid(),
        message: '💾 Game saved locally',
        type: 'success',
        timestamp: Date.now(),
      }),
    );
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [serializeState, dispatch]);

  // ── Local load (guest mode) ──
  const handleLocalLoad = useCallback(() => {
    const data = localStorage.getItem('autoharvest-save');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.game) store.dispatch(loadSerializedState(JSON.stringify(parsed.game)));
        if (parsed.progression) store.dispatch(loadProgression(parsed.progression));
        dispatch(
          addConsoleLog({
            id: uuid(),
            message: '💾 Game loaded from local save',
            type: 'success',
            timestamp: Date.now(),
          }),
        );
      } catch {
        dispatch(
          addConsoleLog({
            id: uuid(),
            message: '❌ Failed to load local save',
            type: 'error',
            timestamp: Date.now(),
          }),
        );
      }
    } else {
      dispatch(
        addConsoleLog({
          id: uuid(),
          message: '⚠ No local save found',
          type: 'warn',
          timestamp: Date.now(),
        }),
      );
    }
  }, [dispatch]);

  // ── Server load ──
  const handleServerLoad = useCallback(async () => {
    if (!worldId || !isAuthenticated) return;
    setLoadingWorld(true);
    try {
      const save = await worldsApi.load(worldId);
      if (save.serializedState) {
        const parsed = JSON.parse(save.serializedState);
        if (parsed.game) store.dispatch(loadSerializedState(JSON.stringify(parsed.game)));
        if (parsed.progression) store.dispatch(loadProgression(parsed.progression));
        dispatch(
          addConsoleLog({
            id: uuid(),
            message: '☁️ Game reloaded from server',
            type: 'success',
            timestamp: Date.now(),
          }),
        );
      }
    } catch (err: any) {
      dispatch(
        addConsoleLog({
          id: uuid(),
          message: `❌ Load failed: ${err.response?.data?.message || err.message}`,
          type: 'error',
          timestamp: Date.now(),
        }),
      );
    } finally {
      setLoadingWorld(false);
    }
  }, [worldId, isAuthenticated, dispatch]);

  // ── Combined save/load handlers ──
  const handleSave = isServerMode ? () => handleServerSave(false) : handleLocalSave;
  const handleLoad = isServerMode ? handleServerLoad : handleLocalLoad;

  // ── Auto-save (server mode only) ──
  useEffect(() => {
    if (!isServerMode) return;

    autoSaveTimer.current = setInterval(() => {
      handleServerSave(true); // silent auto-save
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [isServerMode, handleServerSave]);

  // ── Save on tab close (server mode) ──
  useEffect(() => {
    if (!isServerMode) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable save on tab close
      const token = store.getState().auth.accessToken;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      navigator.sendBeacon(
        `${apiUrl}/api/games/worlds/${worldId}/save`,
        new Blob([JSON.stringify({ serializedState: serializeState() })], {
          type: 'application/json',
        }),
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isServerMode, worldId, serializeState]);

  // ── Autonomous Drone Scripts ──
  const activeScriptedDrones = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentScripted = new Set<string>();
    drones.forEach(drone => {
      if (drone.status === 'scripted') {
        currentScripted.add(drone.id);
        // Only start if not already running
        if (!activeScriptedDrones.current.has(drone.id)) {
          runAutonomousDroneLoop(drone.id, drone.script || '');
        }
      }
    });

    // Stop any drones that were scripted but no longer are
    activeScriptedDrones.current.forEach(id => {
      if (!currentScripted.has(id)) {
        stopAutonomousDroneLoop(id);
      }
    });

    activeScriptedDrones.current = currentScripted;
  }, [drones]);

  // Cleanup all loops on unmount only
  useEffect(() => {
    return () => {
      activeScriptedDrones.current.forEach(id => stopAutonomousDroneLoop(id));
    };
  }, []);

  // Determine available tabs
  const tabs: { key: ActivePanel; label: string; icon: typeof ShoppingCart; enabled: boolean }[] = [
    { key: 'shop', label: 'Shop', icon: ShoppingCart, enabled: true },
    { key: 'editor', label: 'Script', icon: Code2, enabled: isScriptUnlocked },
    { key: 'drones', label: 'Drones', icon: Bot, enabled: drones.length > 0 },
  ];

  // Loading screen
  if (loadingWorld) {
    return (
      <div className="h-screen w-screen bg-farm-975 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 text-olive-400 animate-spin mx-auto mb-4" />
          <p className="font-display font-semibold text-farm-200 text-lg">Loading world...</p>
          <p className="text-farm-500 text-sm mt-1">{worldName || 'Connecting to server'}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-farm-975 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="flex items-center justify-between px-3 py-2 border-b border-farm-800/40 bg-farm-975/90 backdrop-blur-xl z-20"
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-olive-500 to-olive-700 flex items-center justify-center"
            >
              <Sprout className="w-4 h-4 text-white" />
            </motion.div>
            <span className="font-display font-bold text-sm text-farm-200 group-hover:text-olive-300 transition-colors">
              AutoHarvest
            </span>
          </Link>
          <div className="w-px h-5 bg-farm-700/40" />
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="btn-ghost !py-1 !px-2 text-xs flex items-center gap-1"
          >
            <Home className="w-3 h-3" /> {isAuthenticated ? 'Dashboard' : 'Home'}
          </Link>
          {/* World name */}
          {worldName && (
            <>
              <div className="w-px h-5 bg-farm-700/40" />
              <span className="text-farm-400 text-xs">{worldName}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Save status indicator */}
          {isServerMode && (
            <motion.div
              key={saveStatus}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 mr-2"
            >
              {saveStatus === 'saving' && (
                <Loader2 className="w-3 h-3 text-farm-500 animate-spin" />
              )}
              {saveStatus === 'saved' && <Check className="w-3 h-3 text-growth" />}
              {saveStatus === 'error' && <CloudOff className="w-3 h-3 text-red-400" />}
              {saveStatus === 'idle' && <Cloud className="w-3 h-3 text-farm-600" />}
              <span
                className={`text-[10px] ${
                  saveStatus === 'saved'
                    ? 'text-growth'
                    : saveStatus === 'error'
                      ? 'text-red-400'
                      : 'text-farm-600'
                }`}
              >
                {saveStatus === 'saving'
                  ? 'Saving...'
                  : saveStatus === 'saved'
                    ? 'Saved'
                    : saveStatus === 'error'
                      ? 'Save failed'
                      : 'Cloud'}
              </span>
            </motion.div>
          )}
          {!isServerMode && isAuthenticated && (
            <span className="text-farm-600 text-[10px] mr-2 flex items-center gap-1">
              <CloudOff className="w-3 h-3" /> Guest mode
            </span>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="btn-ghost !py-1 !px-2 text-xs flex items-center gap-1"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}{' '}
            Save
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLoad}
            className="btn-ghost !py-1 !px-2 text-xs flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Load
          </motion.button>
          <button className="btn-ghost !py-1 !px-2 text-xs flex items-center gap-1 text-farm-500">
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

      {/* Resource Bar */}
      <div className="px-3 py-1.5">
        <ResourceBar />
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex gap-3 px-3 pb-3 overflow-hidden min-h-0">
        {/* Left: Game Canvas */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          className="flex-1 flex flex-col gap-2 min-w-0"
        >
          <div className="flex-1 glass-panel overflow-hidden">
            <GameCanvas />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-farm-600 text-xs px-2 flex gap-3"
          >
            <span>WASD: Move</span>
            <span>Space: Harvest/Plant</span>
            <span>Q/E: Cycle Crop</span>
            {drones.length > 0 && <span>Tab: Switch Control</span>}
            {drones.length > 0 && <span>1-{Math.min(drones.length, 4)}: Select Drone</span>}
          </motion.div>
        </motion.div>

        {/* Right: Panel Tabs + Content */}
        <div className="w-[380px] flex flex-col gap-2 shrink-0">
          {/* Panel tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex border border-farm-800/40 rounded-lg overflow-hidden bg-farm-900/40"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => tab.enabled && dispatch(setActivePanel(tab.key))}
                disabled={!tab.enabled}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-all ${
                  activePanel === tab.key && tab.enabled
                    ? 'bg-olive-600/20 text-olive-300 border-b-2 border-olive-500'
                    : tab.enabled
                      ? 'text-farm-500 hover:text-farm-300 hover:bg-farm-800/30'
                      : 'text-farm-700 cursor-not-allowed'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
                {!tab.enabled && tab.key === 'editor' && (
                  <span className="text-[9px] text-farm-700">T2</span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Panel content */}
          <div className="flex-1 min-h-0">
            {activePanel === 'shop' && <ShopPanel />}
            {activePanel === 'editor' && isScriptUnlocked && <CodeEditorPanel />}
            {activePanel === 'drones' && drones.length > 0 && <DroneManagerPanel />}
            {activePanel === 'editor' && !isScriptUnlocked && (
              <div className="h-full glass-panel flex items-center justify-center p-6">
                <div className="text-center">
                  <span className="text-4xl mb-3 block">🔒</span>
                  <p className="font-display font-semibold text-farm-300">Script Editor Locked</p>
                  <p className="text-farm-500 text-xs mt-1">Earn 200 gold to unlock Tier 2</p>
                </div>
              </div>
            )}
            {activePanel === 'drones' && drones.length === 0 && (
              <div className="h-full glass-panel flex items-center justify-center p-6">
                <div className="text-center">
                  <span className="text-4xl mb-3 block">🤖</span>
                  <p className="font-display font-semibold text-farm-300">No Drones</p>
                  <p className="text-farm-500 text-xs mt-1">Buy drones from the Shop tab</p>
                </div>
              </div>
            )}
          </div>

          {/* Console (always visible) */}
          <ConsolePanel />
        </div>
      </div>
    </div>
  );
}
