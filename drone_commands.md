# Drone Commands & Examples

Welcome to the AutoHarvest Drone Scripting Guide! Below are some useful scripts that you can copy and paste into your drone's "Auto" mode to fully automate your farming.

## Basic Automation Scripts

### 1. The Simple Harvester
This script makes the drone continuously move right, harvesting any grown crops it encounters. When it reaches the edge, it loops back.

```javascript
// Simple Harvest Loop
const tile = getTile();

// Harvest if there's a grown crop
if (tile && tile.crop && tile.crop.stage === 4) { // 4 = HARVESTABLE
  await harvest();
} else {
  // Otherwise move right
  const moved = await moveRight();
  
  // If we hit an obstacle or the edge, move down and go left (or similar logic)
  if (!moved) {
    await moveDown();
    await moveLeft();
  }
}

// Small pause so we don't drain energy too fast if stuck
await wait(5);
```

### 2. Auto Planter
This script makes the drone constantly try to plant wheat wherever it walks.

```javascript
// Auto Planter
const pos = getPosition();
const tile = getTile();

// If it's farmland without a crop, plant wheat
if (tile && tile.type === 2 /* FARMLAND */ && !tile.crop) {
  await plant("wheat");
}

// Move in a simple pattern
const moved = await moveRight();
if (!moved) {
  await moveDown();
  await moveLeft();
}

await wait(5);
```

### 3. The Smart Farm Hand
A more complex script that checks its energy and decides whether to rest, plant, or harvest.

```javascript
// Smart Farm Hand
const energyInfo = getEnergy();

// Rest if energy is too low
if (energyInfo.current < 20) {
  log("Resting to regain energy...");
  await wait(50); // wait for 5 seconds to recharge
  return;
}

const tile = getTile();

if (tile && tile.crop) {
  if (tile.crop.stage === 4) { // 4 = HARVESTABLE
    log("Harvesting!");
    await harvest();
  } else {
    // Crop is still growing, just move past it
    await moveRight();
  }
} else if (tile && tile.type === 2) {
  // Empty farmland, plant a crop
  await plant("wheat");
} else {
  // Not farmland, keep looking
  await moveRight();
}

await wait(5);
```

## Available Commands Reference

- `await moveUp()` / `await moveDown()` / `await moveLeft()` / `await moveRight()`: Move the drone one tile. Returns `true` if successful.
- `await plant("crop_name")`: Plant a seed. Crops: `"wheat"`, `"corn"`, `"carrot"`, `"potato"`, `"tomato"`, `"pumpkin"`, `"strawberry"`, `"sunflower"`, `"melon"`.
- `await harvest()`: Harvest a fully grown crop on the current tile.
- `getTile()`: Returns information about the tile the drone is standing on.
- `getTileAt(x, y)`: Returns tile at specific coordinates.
- `getPosition()`: Returns `{ x, y, direction }`.
- `getInventory()`: Returns the current global inventory.
- `getEnergy()`: Returns `{ current, max }` energy of the drone.
- `getDrones()`: Returns array of all drone statuses.
- `getGridSize()`: Returns `{ width, height }` of the farm grid.
- `log("message")`: Prints a message to the drone console.
- `await wait(ticks)`: Pauses execution for a certain amount of time (1 tick = 100ms).

## Growth Stage Values

When checking `tile.crop.stage`, use these numeric values:
- `0` = SEED
- `1` = SPROUT
- `2` = GROWING
- `3` = MATURE
- `4` = HARVESTABLE (ready to harvest!)

## Tile Type Values

When checking `tile.type`:
- `"dirt"` = Walkable, not plantable
- `"grass"` = Walkable, not plantable
- `"farmland"` = Plantable land
- `"water"` / `"stone"` = Not walkable

*Tip: Always use `await` before movement, planting, harvesting, and waiting to ensure the action completes before the script continues.*
