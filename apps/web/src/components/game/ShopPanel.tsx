// ============================================================
// AutoHarvest — Shop Panel (Upgrade Store)
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../store';
import { selectTier, selectPurchasedItems, purchaseItem, earnGold } from '../../store/slices/progressionSlice';
import { addDrone, addItem, upgradeEnergy } from '../../store/slices/gameSlice';
import { ShoppingCart, Lock, Check, Zap, Sprout, Bot, Warehouse, ChevronRight } from 'lucide-react';
import { SHOP_ITEMS, TIER_INFO } from '@autoharvest/shared';
import type { ShopCategory } from '@autoharvest/shared';

const categoryConfig: { key: ShopCategory; label: string; icon: typeof Bot }[] = [
  { key: 'drone', label: 'Drones', icon: Bot },
  { key: 'crop', label: 'Seeds', icon: Sprout },
  { key: 'upgrade', label: 'Upgrades', icon: Zap },
  { key: 'farm', label: 'Farm', icon: Warehouse },
];

export function ShopPanel() {
  const dispatch = useAppDispatch();
  const tier = useAppSelector(selectTier);
  const purchasedItems = useAppSelector(selectPurchasedItems);
  const gold = useAppSelector((s) => s.game.inventory.items.gold || 0);
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('crop');
  const [justBought, setJustBought] = useState<string | null>(null);

  const filteredItems = SHOP_ITEMS.filter((item) => item.category === activeCategory);

  const getPurchaseCount = (itemId: string) => purchasedItems.filter((id) => id === itemId).length;
  const canAfford = (cost: number) => gold >= cost;
  const isUnlocked = (requiredTier: number) => tier >= requiredTier;
  const isMaxed = (itemId: string, maxPurchases: number) => getPurchaseCount(itemId) >= maxPurchases;

  const handleBuy = (item: typeof SHOP_ITEMS[0]) => {
    if (!canAfford(item.cost) || !isUnlocked(item.requiredTier) || isMaxed(item.id, item.maxPurchases)) return;

    // Deduct gold
    dispatch(addItem({ type: 'gold', quantity: -item.cost }));
    dispatch(purchaseItem(item.id));

    // Apply effect
    switch (item.id) {
      case 'drone-1': case 'drone-2': case 'drone-3': case 'drone-4':
        dispatch(addDrone({ name: item.name }));
        break;
      case 'energy-upgrade-1': dispatch(upgradeEnergy(50)); break;
      case 'energy-upgrade-2': dispatch(upgradeEnergy(50)); break;
      case 'speed-upgrade':
        // Handled via progression state
        break;
      case 'unlock-corn': dispatch(addItem({ type: 'seed_corn', quantity: 10 })); break;
      case 'unlock-potato': dispatch(addItem({ type: 'seed_potato', quantity: 8 })); break;
      case 'unlock-tomato': dispatch(addItem({ type: 'seed_tomato', quantity: 6 })); break;
      case 'unlock-pumpkin': dispatch(addItem({ type: 'seed_pumpkin', quantity: 3 })); break;
      case 'unlock-strawberry': dispatch(addItem({ type: 'seed_strawberry', quantity: 10 })); break;
      case 'unlock-sunflower': dispatch(addItem({ type: 'seed_sunflower', quantity: 6 })); break;
      case 'unlock-melon': dispatch(addItem({ type: 'seed_melon', quantity: 3 })); break;
      default: {
        // Handle seed packs generically: seed-pack-{crop} → seed_{crop}
        if (item.id.startsWith('seed-pack-')) {
          const seedPackQuantities: Record<string, number> = {
            'seed-pack-wheat': 20,
            'seed-pack-carrot': 15,
            'seed-pack-corn': 10,
            'seed-pack-potato': 12,
            'seed-pack-tomato': 8,
            'seed-pack-pumpkin': 5,
            'seed-pack-strawberry': 10,
            'seed-pack-sunflower': 6,
            'seed-pack-melon': 3,
          };
          const cropName = item.id.replace('seed-pack-', '');
          const qty = seedPackQuantities[item.id] || 10;
          dispatch(addItem({ type: `seed_${cropName}`, quantity: qty }));
        }
        break;
      }
    }

    // Flash feedback
    setJustBought(item.id);
    setTimeout(() => setJustBought(null), 800);
  };

  return (
    <div className="h-full flex flex-col glass-panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-farm-800/40">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-harvest-400" />
          <span className="font-display font-semibold text-sm text-farm-200">Shop</span>
        </div>
        <span className="text-xs font-mono text-yellow-400">💰 {gold}g</span>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-farm-800/40">
        {categoryConfig.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex-1 py-1.5 text-xs flex items-center justify-center gap-1 transition-all ${
              activeCategory === key
                ? 'text-olive-300 border-b-2 border-olive-500 bg-farm-900/40'
                : 'text-farm-500 hover:text-farm-300'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <AnimatePresence mode="wait">
          {filteredItems.map((item, i) => {
            const locked = !isUnlocked(item.requiredTier);
            const maxed = isMaxed(item.id, item.maxPurchases);
            const affordable = canAfford(item.cost);
            const bought = justBought === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative rounded-lg border p-3 transition-all ${
                  locked
                    ? 'border-farm-800/30 bg-farm-900/30 opacity-50'
                    : maxed
                      ? 'border-olive-800/30 bg-olive-900/10'
                      : 'border-farm-800/40 bg-farm-900/40 hover:border-olive-700/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-semibold text-sm text-farm-100">{item.name}</span>
                      {locked && <Lock className="w-3 h-3 text-farm-600" />}
                      {maxed && <Check className="w-3 h-3 text-growth" />}
                    </div>
                    <p className="text-farm-500 text-xs mt-0.5 leading-relaxed">{item.description}</p>
                    {locked && (
                      <p className="text-farm-600 text-xs mt-1">
                        🔒 Requires {TIER_INFO[item.requiredTier]?.icon} Tier {item.requiredTier}: {TIER_INFO[item.requiredTier]?.name}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {maxed ? (
                      <span className="text-xs text-growth font-medium">Owned</span>
                    ) : (
                      <motion.button
                        whileHover={!locked && affordable ? { scale: 1.05 } : {}}
                        whileTap={!locked && affordable ? { scale: 0.95 } : {}}
                        onClick={() => handleBuy(item)}
                        disabled={locked || !affordable}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                          locked
                            ? 'bg-farm-800/40 text-farm-600 cursor-not-allowed'
                            : affordable
                              ? 'bg-olive-600 hover:bg-olive-500 text-white shadow-sm'
                              : 'bg-farm-800/40 text-farm-500 cursor-not-allowed'
                        }`}
                      >
                        {bought ? '✓' : `${item.cost}g`}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Purchase flash */}
                <AnimatePresence>
                  {bought && (
                    <motion.div
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 rounded-lg bg-growth/20 pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
