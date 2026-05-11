// ============================================================
// AutoHarvest — Playing Guide Page
// ============================================================

import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Link } from 'react-router-dom';
import {
  Sprout, Bot, Code2, Wheat, Zap, ArrowRight, Gamepad2,
  Keyboard, Terminal, Lightbulb, ChevronRight, Layers,
} from 'lucide-react';
import { CROP_DEFINITIONS } from '@autoharvest/shared';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, type: 'spring', stiffness: 400, damping: 30 },
  }),
};

const controls = [
  { keys: 'W / ↑', action: 'Move Up', icon: '⬆️' },
  { keys: 'S / ↓', action: 'Move Down', icon: '⬇️' },
  { keys: 'A / ←', action: 'Move Left', icon: '⬅️' },
  { keys: 'D / →', action: 'Move Right', icon: '➡️' },
  { keys: 'Space', action: 'Harvest or Plant', icon: '🌱' },
  { keys: 'P', action: 'Plant Wheat', icon: '🌾' },
  { keys: 'H', action: 'Harvest Crop', icon: '✂️' },
];

const apiCommands = [
  { name: 'await moveUp()', desc: 'Move robot one tile up', category: 'movement' },
  { name: 'await moveDown()', desc: 'Move robot one tile down', category: 'movement' },
  { name: 'await moveLeft()', desc: 'Move robot one tile left', category: 'movement' },
  { name: 'await moveRight()', desc: 'Move robot one tile right', category: 'movement' },
  { name: 'await moveTo(x, y)', desc: 'Navigate to exact coordinates', category: 'movement' },
  { name: 'await plant("wheat")', desc: 'Plant a crop on current tile', category: 'farming' },
  { name: 'await harvest()', desc: 'Harvest ready crop', category: 'farming' },
  { name: 'getTile()', desc: 'Get info about current tile', category: 'info' },
  { name: 'getTileAt(x, y)', desc: 'Get tile at coordinates', category: 'info' },
  { name: 'getPosition()', desc: 'Get robot position & direction', category: 'info' },
  { name: 'getInventory()', desc: 'Get all items in inventory', category: 'info' },
  { name: 'getItemCount("item")', desc: 'Get quantity of a specific item', category: 'info' },
  { name: 'getEnergy()', desc: 'Get current/max energy', category: 'info' },
  { name: 'getDrones()', desc: 'Get array of all drones', category: 'info' },
  { name: 'getGridSize()', desc: 'Get farm {width, height}', category: 'info' },
  { name: 'log("msg")', desc: 'Print message to console', category: 'utility' },
  { name: 'await wait(n)', desc: 'Wait for n game ticks', category: 'utility' },
];

const crops = Object.values(CROP_DEFINITIONS).map(c => ({
  emoji: c.emoji,
  name: c.name,
  growth: `${c.growthTicks} ticks`,
  yield: c.yield,
  cost: c.seedCost,
  sell: c.sellPrice,
}));

const tips = [
  'Start with wheat — it\'s cheap and grows fast',
  'Harvesting has a 50% chance to return a seed',
  'Watch your energy — it regens at 0.5/tick',
  'Use for loops to automate repetitive planting',
  'Pumpkins are slow but very profitable',
  'Use getTile() to check before planting',
  'Save your progress often with the Save button',
  'Scripts are sandboxed — safe to experiment!',
];

export function GuidePage() {
  return (
    <div className="min-h-screen bg-farm-975">
      <Navbar />

      <div className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-olive-500 to-olive-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-olive-900/30"
          >
            <Gamepad2 className="w-9 h-9 text-white" />
          </motion.div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-farm-100 mb-4">
            How to <span className="text-gradient-hero">Play</span>
          </h1>
          <p className="text-farm-400 text-lg max-w-2xl mx-auto">
            Learn to control your farming robot, write automation scripts, and grow the most efficient farm.
          </p>
        </motion.div>

        {/* Quick Start */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl text-farm-100 mb-6 flex items-center gap-2">
            <Bot className="w-6 h-6 text-olive-400" /> Quick Start
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Move Your Robot', desc: 'Use WASD or arrow keys to navigate the farm grid. The robot can walk on farmland, dirt, and grass.', icon: Keyboard },
              { step: '2', title: 'Plant & Harvest', desc: 'Stand on farmland, press P to plant wheat. Wait for it to grow (glowing = ready), then press H to harvest.', icon: Sprout },
              { step: '3', title: 'Write Code', desc: 'Open the Script Editor and write automation code. Click Run to execute. Your robot will follow your commands.', icon: Code2 },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={i + 1}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-panel p-5 relative overflow-hidden group"
              >
                <div className="absolute top-3 right-3 text-4xl font-display font-extrabold text-farm-800/30 group-hover:text-olive-800/20 transition-colors">
                  {item.step}
                </div>
                <item.icon className="w-8 h-8 text-olive-400 mb-3" />
                <h3 className="font-display font-semibold text-lg text-farm-100 mb-2">{item.title}</h3>
                <p className="text-farm-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Keyboard Controls */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl text-farm-100 mb-6 flex items-center gap-2">
            <Keyboard className="w-6 h-6 text-olive-400" /> Keyboard Controls
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {controls.map((ctrl, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                whileHover={{ scale: 1.05 }}
                className="glass-panel p-3 flex items-center gap-3"
              >
                <span className="text-xl">{ctrl.icon}</span>
                <div>
                  <kbd className="px-2 py-0.5 bg-farm-800 border border-farm-700/50 rounded text-xs font-mono text-olive-300">
                    {ctrl.keys}
                  </kbd>
                  <p className="text-farm-400 text-xs mt-1">{ctrl.action}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Crops Table */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl text-farm-100 mb-6 flex items-center gap-2">
            <Wheat className="w-6 h-6 text-harvest-400" /> Crop Guide
          </motion.h2>
          <motion.div variants={fadeUp} custom={1} className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-farm-800/40 text-farm-400">
                    <th className="text-left px-4 py-3 font-medium">Crop</th>
                    <th className="text-left px-4 py-3 font-medium">Growth</th>
                    <th className="text-center px-4 py-3 font-medium">Yield</th>
                    <th className="text-center px-4 py-3 font-medium">Seed Cost</th>
                    <th className="text-center px-4 py-3 font-medium">Sell Price</th>
                    <th className="text-center px-4 py-3 font-medium">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {crops.map((crop, i) => (
                    <motion.tr key={i} variants={fadeUp} custom={i + 2}
                      className="border-b border-farm-800/20 hover:bg-farm-900/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-farm-100">
                        <span className="mr-2">{crop.emoji}</span>{crop.name}
                      </td>
                      <td className="px-4 py-3 text-farm-400">{crop.growth}</td>
                      <td className="px-4 py-3 text-center text-farm-300">{crop.yield}</td>
                      <td className="px-4 py-3 text-center text-yellow-400">{crop.cost}g</td>
                      <td className="px-4 py-3 text-center text-growth">{crop.sell}g</td>
                      <td className="px-4 py-3 text-center font-mono text-olive-300">
                        {(crop.sell * crop.yield - crop.cost)}g
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.section>

        {/* API Reference */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl text-farm-100 mb-6 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-olive-400" /> Script API Reference
          </motion.h2>

          <motion.div variants={fadeUp} custom={0} className="glass-panel p-5 mb-6 border-l-4 border-l-olive-500">
            <h3 className="font-display font-semibold text-lg text-farm-100 mb-2">JavaScript Supported!</h3>
            <p className="text-farm-400 text-sm leading-relaxed">
              You can use standard JavaScript syntax in your scripts. This includes <code className="text-olive-300 bg-farm-900/60 px-1 py-0.5 rounded">for</code> loops, <code className="text-olive-300 bg-farm-900/60 px-1 py-0.5 rounded">while</code> loops, <code className="text-olive-300 bg-farm-900/60 px-1 py-0.5 rounded">if/else</code> conditions, and variables. Drone scripts containing infinite loops (e.g., <code className="text-olive-300 bg-farm-900/60 px-1 py-0.5 rounded">while(true)</code>) will run indefinitely in the background until manually stopped.
            </p>
          </motion.div>
          <div className="space-y-3">
            {['movement', 'farming', 'info', 'utility'].map((cat) => (
              <motion.div key={cat} variants={fadeUp} custom={0} className="glass-panel p-4">
                <h3 className="font-display font-semibold text-sm text-olive-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> {cat}
                </h3>
                <div className="space-y-2">
                  {apiCommands.filter((c) => c.category === cat).map((cmd, i) => (
                    <motion.div key={i} whileHover={{ x: 4 }} className="flex items-center gap-3 group">
                      <ChevronRight className="w-3 h-3 text-farm-600 group-hover:text-olive-400 transition-colors" />
                      <code className="font-mono text-sm text-harvest-300 bg-farm-900/60 px-2 py-0.5 rounded">
                        {cmd.name}
                      </code>
                      <span className="text-farm-500 text-sm">— {cmd.desc}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Example Scripts */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl text-farm-100 mb-6 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-olive-400" /> Example Scripts
          </motion.h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={fadeUp} custom={1} className="glass-panel-dark p-5 flex flex-col h-full">
              <h3 className="font-display font-semibold text-farm-200 mb-3 text-sm uppercase tracking-wider">Linear Row Farming</h3>
              <pre className="font-mono text-[13px] text-farm-300 leading-relaxed overflow-x-auto bg-[#141312] p-4 rounded-lg flex-1 border border-farm-800/40">
                <code>{`// Auto-plant a row and harvest
for (let i = 0; i < 8; i++) {
  await moveRight();
  await plant("wheat");
}

log("Row planted! Waiting for growth...");
await wait(55);

// Go back and harvest
for (let i = 0; i < 8; i++) {
  await moveLeft();
  await harvest();
}

log("Harvest complete!");`}</code>
              </pre>
            </motion.div>

            <motion.div variants={fadeUp} custom={2} className="glass-panel-dark p-5 flex flex-col h-full">
              <h3 className="font-display font-semibold text-farm-200 mb-3 text-sm uppercase tracking-wider">Continuous Autonomous Drone</h3>
              <pre className="font-mono text-[13px] text-farm-300 leading-relaxed overflow-x-auto bg-[#141312] p-4 rounded-lg flex-1 border border-farm-800/40">
                <code>{`// Continuous background farming loop
while (true) {
  // Check if we have seeds
  if (getItemCount("seed_wheat") == 0) {
    log("Out of seeds! Stopping.");
    break; // Stop the script
  }

  // Go to starting position
  await moveTo(2, 2);
  
  // Plant and harvest a 3x3 grid
  for(let y = 0; y < 3; y++) {
    for(let x = 0; x < 3; x++) {
      await moveTo(2 + x, 2 + y);
      await harvest();
      await plant("wheat");
    }
  }
  
  // Wait before the next cycle
  await wait(50);
}`}</code>
              </pre>
            </motion.div>
          </div>
        </motion.section>

        {/* Tips */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
          <motion.h2 variants={fadeUp} custom={0} className="font-display font-bold text-2xl text-farm-100 mb-6 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-energy" /> Tips & Tricks
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tips.map((tip, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                whileHover={{ scale: 1.02, x: 4 }}
                className="glass-panel px-4 py-3 flex items-start gap-3"
              >
                <span className="text-olive-400 font-bold shrink-0">{i + 1}.</span>
                <p className="text-farm-300 text-sm">{tip}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/game" className="btn-primary text-lg !px-10 !py-4 inline-flex items-center gap-2">
              <Sprout className="w-5 h-5" />
              Start Playing
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
