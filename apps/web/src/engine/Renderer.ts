// ============================================================
// AutoHarvest — Canvas Renderer (Farmer + Drones + Zones)
// ============================================================

import type { TileState, FarmerState, DroneState, FarmZone } from '@autoharvest/shared';
import {
  TILE_SIZE, TILE_GAP, TILE_DEFINITIONS, CROP_DEFINITIONS, GrowthStage,
} from '@autoharvest/shared';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private cameraX = 0;
  private cameraY = 0;
  private scale = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  centerOnGrid(gridWidth: number, gridHeight: number) {
    const totalW = gridWidth * (TILE_SIZE + TILE_GAP);
    const totalH = gridHeight * (TILE_SIZE + TILE_GAP);
    const canvasW = this.canvas.clientWidth;
    const canvasH = this.canvas.clientHeight;
    const scaleX = (canvasW - 40) / totalW;
    const scaleY = (canvasH - 40) / totalH;
    this.scale = Math.min(scaleX, scaleY, 1.5);
    this.cameraX = (canvasW - totalW * this.scale) / 2;
    this.cameraY = (canvasH - totalH * this.scale) / 2;
  }

  clear() {
    this.ctx.fillStyle = '#121110';
    this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  drawGrid(tiles: TileState[][]) {
    this.ctx.save();
    this.ctx.translate(this.cameraX, this.cameraY);
    this.ctx.scale(this.scale, this.scale);
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        this.drawTile(tiles[y][x]);
      }
    }
    this.ctx.restore();
  }

  private drawTile(tile: TileState) {
    const px = tile.x * (TILE_SIZE + TILE_GAP);
    const py = tile.y * (TILE_SIZE + TILE_GAP);
    const tileDef = TILE_DEFINITIONS[tile.type];

    this.ctx.fillStyle = tileDef.color;
    this.ctx.beginPath();
    this.roundRect(px, py, TILE_SIZE, TILE_SIZE, 4);
    this.ctx.fill();

    this.ctx.strokeStyle = tileDef.borderColor;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    if (tile.type === 'farmland') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let i = 0; i < 3; i++) {
        this.ctx.fillRect(px + 6, py + 15 + i * 15, TILE_SIZE - 12, 2);
      }
    }

    if (tile.crop) this.drawCrop(tile, px, py);
  }

  private drawCrop(tile: TileState, px: number, py: number) {
    const crop = tile.crop!;
    const def = CROP_DEFINITIONS[crop.type];
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;

    let color: string, size: number;
    switch (crop.stage) {
      case GrowthStage.SEED: color = def.color.seed; size = 6; break;
      case GrowthStage.SPROUT: color = def.color.sprout; size = 10; break;
      case GrowthStage.GROWING: color = def.color.growing; size = 16; break;
      case GrowthStage.MATURE: color = def.color.mature; size = 20; break;
      case GrowthStage.HARVESTABLE:
        color = def.color.harvestable; size = 24;
        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10 * pulse;
        break;
      default: color = def.color.seed; size = 6;
    }

    // Early stages are the same for all crops
    if (crop.stage <= GrowthStage.SPROUT) {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy + 8, size / 2, 0, Math.PI * 2);
      this.ctx.fill();
      if (crop.stage === GrowthStage.SPROUT) {
        this.ctx.strokeStyle = '#90BE6D'; this.ctx.lineWidth = 2;
        this.ctx.beginPath(); this.ctx.moveTo(cx, cy + 8); this.ctx.lineTo(cx, cy - 2); this.ctx.stroke();
        this.ctx.fillStyle = '#90BE6D'; this.ctx.beginPath();
        this.ctx.ellipse(cx + 4, cy, 4, 2, 0.3, 0, Math.PI * 2); this.ctx.fill();
      }
    } else {
      // Mature stages: draw crop-specific shapes
      this.drawCropShape(crop.type, cx, cy, px, py, size, color, crop.stage);
    }

    this.ctx.shadowBlur = 0; this.ctx.shadowColor = 'transparent';

    // Growth progress bar
    if (crop.stage !== GrowthStage.HARVESTABLE) {
      const barW = TILE_SIZE - 16, barH = 4, barX = px + 8, barY = py + TILE_SIZE - 10;
      this.ctx.fillStyle = 'rgba(0,0,0,0.4)'; this.ctx.fillRect(barX, barY, barW, barH);
      this.ctx.fillStyle = color; this.ctx.fillRect(barX, barY, barW * (crop.growthProgress / 100), barH);
    }
  }

  private drawCropShape(cropType: string, cx: number, cy: number, px: number, py: number, size: number, color: string, stage: number) {
    const ctx = this.ctx;

    // Draw stem (shared for most crops)
    const drawStem = () => {
      ctx.strokeStyle = '#5A7D3A'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, cy + TILE_SIZE / 2 - 10); ctx.lineTo(cx, cy - size / 2 + 4); ctx.stroke();
    };

    // Draw leaves (shared)
    const drawLeaves = () => {
      ctx.fillStyle = '#6B8E3D';
      ctx.beginPath(); ctx.ellipse(cx - 6, cy + 4, 8, 4, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 6, cy + 8, 7, 3, 0.5, 0, Math.PI * 2); ctx.fill();
    };

    switch (cropType) {
      case 'wheat': {
        // Wheat: multiple stalks with grain heads
        drawStem();
        // Extra stalks
        ctx.strokeStyle = '#5A7D3A'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 6, cy + TILE_SIZE / 2 - 10); ctx.lineTo(cx - 4, cy - size / 2 + 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 6, cy + TILE_SIZE / 2 - 10); ctx.lineTo(cx + 4, cy - size / 2 + 8); ctx.stroke();
        // Grain heads (small ellipses)
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(cx, cy - size / 3, size / 5, size / 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx - 4, cy - size / 4 + 2, size / 6, size / 4, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 4, cy - size / 4 + 2, size / 6, size / 4, 0.2, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'corn': {
        // Corn: tall thick stalk with corn cob
        ctx.strokeStyle = '#4A7D2A'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cx, cy + TILE_SIZE / 2 - 10); ctx.lineTo(cx, cy - size / 2); ctx.stroke();
        // Big leaves
        ctx.fillStyle = '#6B8E3D';
        ctx.beginPath(); ctx.ellipse(cx - 8, cy + 2, 12, 4, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 8, cy + 6, 11, 3.5, 0.4, 0, Math.PI * 2); ctx.fill();
        // Corn cob (rounded rectangle)
        ctx.fillStyle = color;
        ctx.beginPath();
        this.roundRect(cx - size / 5, cy - size / 3, size / 2.5, size / 2, 3);
        ctx.fill();
        // Husk leaves on cob
        ctx.fillStyle = '#7DA84E';
        ctx.beginPath(); ctx.ellipse(cx - size / 4, cy - size / 5, 4, 7, -0.3, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'carrot': {
        // Carrot: leafy green top, orange triangle root
        // Feathery green top
        ctx.fillStyle = '#5A8E3D';
        ctx.beginPath(); ctx.ellipse(cx - 3, cy - 4, 3, 8, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 3, cy - 4, 3, 8, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, cy - 6, 2.5, 9, 0, 0, Math.PI * 2); ctx.fill();
        // Carrot body (triangle pointing down)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx - size / 4, cy + 2);
        ctx.lineTo(cx + size / 4, cy + 2);
        ctx.lineTo(cx, cy + size / 1.5);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'potato': {
        // Potato: small bush on top, oval potato showing from soil
        drawStem();
        // Bushy leaves
        ctx.fillStyle = '#6B8E3D';
        ctx.beginPath(); ctx.ellipse(cx - 4, cy - 2, 9, 5, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 4, cy, 8, 4.5, 0.3, 0, Math.PI * 2); ctx.fill();
        // Potato tuber (lumpy oval)
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(cx, cy + 10, size / 3, size / 4.5, 0.1, 0, Math.PI * 2); ctx.fill();
        // Dirt specks
        ctx.fillStyle = 'rgba(90,70,50,0.4)';
        ctx.beginPath(); ctx.arc(cx - 3, cy + 11, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 4, cy + 9, 1, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'tomato': {
        // Tomato: vine/stem with round fruit
        drawStem();
        drawLeaves();
        // Tomato fruit (circle with star cap)
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(cx, cy - size / 5, size / 3, 0, Math.PI * 2); ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.arc(cx - size / 10, cy - size / 4, size / 8, 0, Math.PI * 2); ctx.fill();
        // Small star top
        ctx.fillStyle = '#5A8E3D';
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const sx = cx + Math.cos(angle) * 4;
          const sy = cy - size / 3 + Math.sin(angle) * 3;
          ctx.beginPath(); ctx.ellipse(sx, sy, 2, 3, angle, 0, Math.PI * 2); ctx.fill();
        }
        break;
      }
      case 'pumpkin': {
        // Pumpkin: large ribbed gourd with curly vine
        // Vine
        ctx.strokeStyle = '#5A7D3A'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size / 3);
        ctx.quadraticCurveTo(cx + 8, cy - size / 2 - 5, cx + 12, cy - size / 2);
        ctx.stroke();
        // Curly tendril
        ctx.beginPath();
        ctx.arc(cx + 14, cy - size / 2, 3, 0, Math.PI * 1.5);
        ctx.stroke();
        // Pumpkin body (overlapping ovals for ridged look)
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(cx, cy + 3, size / 2.5, size / 3, 0, 0, Math.PI * 2); ctx.fill();
        // Side ribs
        const ribColor = stage >= GrowthStage.HARVESTABLE ? '#E05500' : '#D08040';
        ctx.fillStyle = ribColor;
        ctx.beginPath(); ctx.ellipse(cx - size / 4, cy + 3, size / 5, size / 3.2, -0.15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + size / 4, cy + 3, size / 5, size / 3.2, 0.15, 0, Math.PI * 2); ctx.fill();
        // Overlay center rib
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(cx, cy + 3, size / 4, size / 3.1, 0, 0, Math.PI * 2); ctx.fill();
        // Small leaf
        ctx.fillStyle = '#6B8E3D';
        ctx.beginPath(); ctx.ellipse(cx - 2, cy - size / 3.5, 5, 3, -0.5, 0, Math.PI * 2); ctx.fill();
        break;
      }
      default: {
        // Fallback generic crop
        drawStem();
        drawLeaves();
        ctx.fillStyle = color; ctx.beginPath();
        ctx.arc(cx, cy - size / 4, size / 3, 0, Math.PI * 2); ctx.fill();
        break;
      }
    }
  }

  // ─── Farmer (Green hat character) ─────────────────────

  drawFarmer(farmer: FarmerState, isActive: boolean) {
    this.ctx.save();
    this.ctx.translate(this.cameraX, this.cameraY);
    this.ctx.scale(this.scale, this.scale);

    const px = farmer.visualX * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;
    const py = farmer.visualY * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;
    const size = TILE_SIZE * 0.4;
    
    // Calculate simple walk animation based on visual movement
    const isMoving = Math.abs(farmer.visualX - farmer.x) > 0.05 || Math.abs(farmer.visualY - farmer.y) > 0.05;
    const walkCycle = isMoving ? Math.sin(Date.now() / 150) * 0.5 : 0;

    // Active glow
    if (isActive) {
      this.ctx.shadowColor = '#90BE6D';
      this.ctx.shadowBlur = 14;
    }

    this.ctx.translate(px, py);

    // Directional offsets
    let bodyRot = 0;
    let headOffY = 0;
    let headOffX = 0;
    
    if (farmer.direction === 'left') { bodyRot = -0.1; headOffX = -2; }
    if (farmer.direction === 'right') { bodyRot = 0.1; headOffX = 2; }
    if (farmer.direction === 'up') headOffY = -2;
    if (farmer.direction === 'down') headOffY = 2;

    this.ctx.rotate(bodyRot);

    // --- LEGS (Denim Blue) ---
    this.ctx.fillStyle = '#2A4B7C';
    // Left leg
    this.ctx.beginPath();
    this.roundRect(-size * 0.4, size * 0.1, size * 0.35, size * 0.6 + walkCycle * size * 0.3, 2);
    this.ctx.fill();
    // Right leg
    this.ctx.beginPath();
    this.roundRect(size * 0.05, size * 0.1, size * 0.35, size * 0.6 - walkCycle * size * 0.3, 2);
    this.ctx.fill();

    // --- SHOES (Brown) ---
    this.ctx.fillStyle = '#4A2511';
    this.ctx.beginPath();
    this.roundRect(-size * 0.45, size * 0.7 + walkCycle * size * 0.3, size * 0.4, size * 0.25, 3);
    this.ctx.fill();
    this.ctx.beginPath();
    this.roundRect(size * 0.05, size * 0.7 - walkCycle * size * 0.3, size * 0.4, size * 0.25, 3);
    this.ctx.fill();

    // --- TORSO (Plaid Shirt & Overalls) ---
    // Shirt (Red/Black Plaid abstract)
    this.ctx.fillStyle = '#A32828';
    this.ctx.beginPath();
    this.roundRect(-size * 0.6, -size * 0.5, size * 1.2, size * 0.8, 4);
    this.ctx.fill();
    
    // Overalls (Denim Blue)
    this.ctx.fillStyle = '#3A5B8C';
    this.ctx.beginPath();
    this.roundRect(-size * 0.5, -size * 0.1, size * 1.0, size * 0.5, 3);
    this.ctx.fill();
    // Overall Straps
    this.ctx.fillRect(-size * 0.4, -size * 0.4, size * 0.15, size * 0.4);
    this.ctx.fillRect(size * 0.25, -size * 0.4, size * 0.15, size * 0.4);
    // Buttons
    this.ctx.fillStyle = '#F39C12';
    this.ctx.beginPath(); this.ctx.arc(-size * 0.32, -size * 0.1, 2, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.beginPath(); this.ctx.arc(size * 0.32, -size * 0.1, 2, 0, Math.PI * 2); this.ctx.fill();

    // --- ARMS (Shirt sleeves & Hands) ---
    this.ctx.fillStyle = '#A32828';
    // Left arm
    this.ctx.beginPath();
    this.ctx.ellipse(-size * 0.65, -size * 0.1 - walkCycle * size * 0.2, size * 0.2, size * 0.4, 0.2, 0, Math.PI * 2);
    this.ctx.fill();
    // Right arm
    this.ctx.beginPath();
    this.ctx.ellipse(size * 0.65, -size * 0.1 + walkCycle * size * 0.2, size * 0.2, size * 0.4, -0.2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Hands (Skin color)
    this.ctx.fillStyle = '#F5CBA7';
    this.ctx.beginPath(); this.ctx.arc(-size * 0.7, size * 0.2 - walkCycle * size * 0.2, size * 0.15, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.beginPath(); this.ctx.arc(size * 0.7, size * 0.2 + walkCycle * size * 0.2, size * 0.15, 0, Math.PI * 2); this.ctx.fill();

    // Reset rotation for head so it stays upright
    this.ctx.rotate(-bodyRot);

    // --- HEAD ---
    this.ctx.translate(headOffX, headOffY);
    
    // Skin
    this.ctx.fillStyle = '#F5CBA7';
    this.ctx.beginPath();
    this.ctx.arc(0, -size * 0.7, size * 0.45, 0, Math.PI * 2);
    this.ctx.fill();

    // Beard
    if (farmer.direction !== 'up') {
      this.ctx.fillStyle = '#6E2C00';
      this.ctx.beginPath();
      this.ctx.ellipse(0, -size * 0.45, size * 0.4, size * 0.25, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Eyes
    const eyeOff = size * 0.15;
    let exOff = 0, eyOff = 0;
    if (farmer.direction === 'up') eyOff = -eyeOff;
    if (farmer.direction === 'down') eyOff = eyeOff;
    if (farmer.direction === 'left') exOff = -eyeOff;
    if (farmer.direction === 'right') exOff = eyeOff;
    
    if (farmer.direction !== 'up') {
      this.ctx.fillStyle = '#111';
      this.ctx.beginPath(); this.ctx.arc(-size * 0.15 + exOff, -size * 0.75 + eyOff, 2.5, 0, Math.PI * 2); this.ctx.fill();
      this.ctx.beginPath(); this.ctx.arc(size * 0.15 + exOff, -size * 0.75 + eyOff, 2.5, 0, Math.PI * 2); this.ctx.fill();
    }

    // --- HAT (Detailed Straw Hat) ---
    // Brim
    this.ctx.fillStyle = '#E5C07B';
    this.ctx.beginPath();
    this.ctx.ellipse(0, -size * 0.9, size * 0.8, size * 0.25, 0, 0, Math.PI * 2);
    this.ctx.fill();
    // Crown
    this.ctx.fillStyle = '#D4AC0D';
    this.ctx.beginPath();
    this.ctx.ellipse(0, -size * 1.05, size * 0.45, size * 0.35, 0, 0, Math.PI * 2);
    this.ctx.fill();
    // Hat band
    this.ctx.fillStyle = '#A32828';
    this.ctx.beginPath();
    this.ctx.ellipse(0, -size * 0.95, size * 0.46, size * 0.15, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Clean up transforms
    this.ctx.translate(-headOffX, -headOffY);
    this.ctx.translate(-px, -py);
    this.ctx.shadowBlur = 0;

    // Active indicator (dashed border)
    if (isActive) {
      this.ctx.strokeStyle = '#90BE6D';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([3, 3]);
      this.ctx.beginPath();
      const tx = farmer.x * (TILE_SIZE + TILE_GAP);
      const ty = farmer.y * (TILE_SIZE + TILE_GAP);
      this.roundRect(tx - 1, ty - 1, TILE_SIZE + 2, TILE_SIZE + 2, 5);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Energy bar
    this.drawEnergyBar(px - size, py + size + 8, size * 2, farmer.energy, farmer.maxEnergy);

    // Label
    if (isActive) {
      this.ctx.fillStyle = 'rgba(144,190,109,0.8)';
      this.ctx.font = '9px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('🧑‍🌾 You', px, py + size + 20);
    }

    this.ctx.restore();
  }

  // ─── Drone ────────────────────────────────────────────

  drawDrone(drone: DroneState, isActive: boolean) {
    this.ctx.save();
    this.ctx.translate(this.cameraX, this.cameraY);
    this.ctx.scale(this.scale, this.scale);

    const px = drone.visualX * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;
    const py = drone.visualY * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;
    const size = TILE_SIZE * 0.35;

    // Hover animation
    const hoverY = Math.sin(Date.now() / 200 + drone.id.charCodeAt(0)) * 3;
    this.ctx.translate(px, py + hoverY);

    // Color based on status
    const statusColors = {
      idle: { body: '#B0BEC5', accent: '#78909C', light: '#546E7A', glow: '#546E7A' },
      manual: { body: '#E0E0E0', accent: '#64B5F6', light: '#2196F3', glow: '#2196F3' },
      scripted: { body: '#E0E0E0', accent: '#FFD54F', light: '#FFB300', glow: '#FFB300' },
    };
    const colors = statusColors[drone.status];

    // Glow
    if (isActive || drone.status === 'scripted') {
      this.ctx.shadowColor = colors.glow;
      this.ctx.shadowBlur = drone.status === 'scripted' ? 10 + Math.sin(Date.now() / 150) * 5 : 15;
    }

    // --- ROTOR ARMS ---
    this.ctx.strokeStyle = '#455A64';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    
    const armLength = size * 0.9;
    const drawArm = (angleX: number, angleY: number) => {
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(angleX * armLength, angleY * armLength);
      this.ctx.stroke();
    };

    drawArm(-1, -1); // Top Left
    drawArm(1, -1);  // Top Right
    drawArm(-1, 1);  // Bottom Left
    drawArm(1, 1);   // Bottom Right

    this.ctx.shadowBlur = 0;

    // --- PROPELLERS ---
    const propAngle = (Date.now() / 50) % (Math.PI * 2);
    const drawPropeller = (x: number, y: number, offsetAngle: number) => {
      this.ctx.save();
      this.ctx.translate(x, y);
      
      // Motor base
      this.ctx.fillStyle = '#37474F';
      this.ctx.beginPath(); this.ctx.arc(0, 0, 4, 0, Math.PI * 2); this.ctx.fill();

      // Spinning blades
      if (drone.status !== 'idle') {
        this.ctx.rotate(propAngle + offsetAngle);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath(); this.ctx.ellipse(0, 0, 12, 3, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.ellipse(0, 0, 3, 12, 0, 0, Math.PI * 2); this.ctx.fill();
      } else {
        // Static blades
        this.ctx.rotate(offsetAngle);
        this.ctx.fillStyle = '#CFD8DC';
        this.ctx.beginPath(); this.ctx.ellipse(0, 0, 12, 2, 0, 0, Math.PI * 2); this.ctx.fill();
      }
      this.ctx.restore();
    };

    drawPropeller(-armLength, -armLength, 0);
    drawPropeller(armLength, -armLength, Math.PI / 4);
    drawPropeller(-armLength, armLength, Math.PI / 4);
    drawPropeller(armLength, armLength, 0);

    // --- CENTRAL CHASSIS ---
    // Outer shell
    this.ctx.fillStyle = colors.body;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = colors.accent;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Top detail plate
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
    this.ctx.fill();

    // --- CAMERA EYE ---
    // Pivot offset based on direction
    const eyeMaxOff = size * 0.2;
    let ex = 0, ey = 0;
    if (drone.direction === 'up') ey = -eyeMaxOff;
    if (drone.direction === 'down') ey = eyeMaxOff;
    if (drone.direction === 'left') ex = -eyeMaxOff;
    if (drone.direction === 'right') ex = eyeMaxOff;

    // Lens housing
    this.ctx.fillStyle = '#263238';
    this.ctx.beginPath();
    this.ctx.arc(ex, ey, size * 0.3, 0, Math.PI * 2);
    this.ctx.fill();

    // Lens glass
    this.ctx.fillStyle = colors.light;
    this.ctx.beginPath();
    this.ctx.arc(ex, ey, size * 0.15, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Lens reflection
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(ex - size * 0.05, ey - size * 0.05, size * 0.05, 0, Math.PI * 2);
    this.ctx.fill();

    // --- STATUS LIGHT ---
    this.ctx.fillStyle = colors.light;
    this.ctx.shadowColor = colors.light;
    this.ctx.shadowBlur = 5;
    this.ctx.beginPath(); this.ctx.arc(0, size * 0.5, 2.5, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Restore translate so highlighting aligns
    this.ctx.translate(-px, -(py + hoverY));

    // Active tile highlight
    if (isActive) {
      this.ctx.strokeStyle = colors.light + '80';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      const tx = drone.x * (TILE_SIZE + TILE_GAP);
      const ty = drone.y * (TILE_SIZE + TILE_GAP);
      this.roundRect(tx - 1, ty - 1, TILE_SIZE + 2, TILE_SIZE + 2, 5);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Energy bar
    this.drawEnergyBar(px - size, py + size + 8, size * 2, drone.energy, drone.maxEnergy);

    // Status label
    this.ctx.font = '8px sans-serif';
    this.ctx.textAlign = 'center';
    const label = drone.status === 'scripted' ? '⟳ Auto' : drone.status === 'manual' ? '🎮' : '';
    if (label) {
      this.ctx.fillStyle = colors.light;
      this.ctx.fillText(label, px, py - size - 8);
    }

    // Name label
    this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
    this.ctx.font = 'bold 9px sans-serif';
    this.ctx.fillText(drone.name, px, py + size + 22);

    this.ctx.restore();
  }

  // ─── Farm Zone overlay ────────────────────────────────

  drawFarmZones(zones: FarmZone[]) {
    this.ctx.save();
    this.ctx.translate(this.cameraX, this.cameraY);
    this.ctx.scale(this.scale, this.scale);

    for (const zone of zones) {
      const x1 = zone.x1 * (TILE_SIZE + TILE_GAP);
      const y1 = zone.y1 * (TILE_SIZE + TILE_GAP);
      const w = (zone.x2 - zone.x1 + 1) * (TILE_SIZE + TILE_GAP) - TILE_GAP;
      const h = (zone.y2 - zone.y1 + 1) * (TILE_SIZE + TILE_GAP) - TILE_GAP;

      this.ctx.fillStyle = zone.color + '15';
      this.ctx.fillRect(x1, y1, w, h);

      this.ctx.strokeStyle = zone.color + '60';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([6, 4]);
      this.ctx.strokeRect(x1, y1, w, h);
      this.ctx.setLineDash([]);

      // Zone label
      this.ctx.fillStyle = zone.color + 'AA';
      this.ctx.font = 'bold 10px sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(zone.name, x1 + 4, y1 - 4);
    }

    this.ctx.restore();
  }

  // ─── Energy bar helper ────────────────────────────────

  private drawEnergyBar(x: number, y: number, width: number, energy: number, maxEnergy: number) {
    const ratio = energy / maxEnergy;
    const barH = 3;
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.fillRect(x, y, width, barH);
    this.ctx.fillStyle = ratio > 0.3 ? '#FFD700' : '#E74C3C';
    this.ctx.fillRect(x, y, width * ratio, barH);
  }

  // ─── Main render ──────────────────────────────────────

  render(
    tiles: TileState[][],
    farmer: FarmerState,
    drones: DroneState[],
    zones: FarmZone[],
    gridWidth: number,
    gridHeight: number,
    controlMode: 'farmer' | 'drone',
    activeDroneId: string | null,
  ) {
    this.clear();
    this.centerOnGrid(gridWidth, gridHeight);
    this.drawGrid(tiles);
    this.drawFarmZones(zones);
    this.drawFarmer(farmer, controlMode === 'farmer');
    for (const drone of drones) {
      this.drawDrone(drone, controlMode === 'drone' && drone.id === activeDroneId);
    }
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
  }
}
