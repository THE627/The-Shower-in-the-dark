import * as THREE from 'three';

/**
 * Procedural HTML5 2D Canvas Textures
 * High fidelity, zero external assets, SRGBColorSpace compliant.
 */

// 1. Bathroom Floor Tile
export function createTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e242b';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 64;
  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#2d3748' : '#232c38';
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Subtle marble streak
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 15);
      ctx.bezierCurveTo(x + 20, y + 45, x + 40, y + 20, x + 58, y + 50);
      ctx.stroke();

      // Grout line
      ctx.strokeStyle = '#0e1217';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, tileSize, tileSize);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 2. Bathroom Wall Tile
export function createWallTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#15191f';
  ctx.fillRect(0, 0, 512, 512);

  const w = 64;
  const h = 32;
  let row = 0;
  for (let y = 0; y < 512; y += h) {
    const offset = (row % 2) * (w / 2);
    for (let x = -offset; x < 512; x += w) {
      ctx.fillStyle = '#222933';
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

      // Highlight bevel
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.beginPath();
      ctx.moveTo(x + 1, y + h - 1);
      ctx.lineTo(x + 1, y + 1);
      ctx.lineTo(x + w - 1, y + 1);
      ctx.stroke();

      // Grout
      ctx.strokeStyle = '#0d1014';
      ctx.strokeRect(x, y, w, h);
    }
    row++;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 3. J*b Application / Resume Texture
export function createResumeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Off-white aged corporate letter
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  // Corporate Header
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(20, 20, 472, 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('MANDATORY JOB OFFER: 24/7 INTERN', 36, 54);

  // Fake resume text lines
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('REQUIREMENTS:', 36, 100);

  ctx.font = '13px monospace';
  const lines = [
    '• 10+ years experience in Swift 6.0',
    '• Ready to surrender all weekends & sanity',
    '• Synergy, deliverables, dynamic agility',
    '• Minimum wage (unpaid probation 12 mo)',
    '• Must love mandatory team-building pizzas',
    '• We work hard and panic harder',
    '• Ability to answer emails at 3:45 AM',
    '• SIGN ON DOTTED LINE IMMEDIATELY'
  ];

  lines.forEach((line, idx) => {
    ctx.fillText(line, 40, 130 + idx * 24);
  });

  // Huge menacing RED STAMP
  ctx.save();
  ctx.translate(256, 360);
  ctx.rotate(-0.25);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 6;
  ctx.strokeRect(-180, -45, 360, 90);

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('APPLY OR DIE', 0, 12);
  ctx.restore();

  // Barcode at bottom
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < 40; i++) {
    const bx = 40 + i * 10;
    const bw = Math.random() > 0.5 ? 4 : 8;
    ctx.fillRect(bx, 450, bw, 40);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 4. Suburban Road Asphalt Texture
export function createRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1f2421';
  ctx.fillRect(0, 0, 512, 512);

  // Asphalt noise speckles
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const c = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)';
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 2, 2);
  }

  // Yellow dashed lane divider in center
  ctx.fillStyle = '#eab308';
  for (let y = 10; y < 512; y += 70) {
    ctx.fillRect(250, y, 12, 40);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 5. Sidewalk Concrete Texture
export function createSidewalkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6b7280';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle concrete noise
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.15)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  // Expansion seams
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 256, 256);
  ctx.beginPath();
  ctx.moveTo(0, 128);
  ctx.lineTo(256, 128);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 6. House Front Door Texture
export function createDoorTexture(doorColor = '#881337', number = '101'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Main door body
  ctx.fillStyle = doorColor;
  ctx.fillRect(0, 0, 256, 512);

  // 6 recessed wood panels
  const panelY = [40, 140, 240, 340];
  panelY.forEach((py) => {
    // Left panel
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(28, py, 90, 75);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, py + 2, 86, 71);

    // Right panel
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(138, py, 90, 75);
    ctx.strokeRect(140, py + 2, 86, 71);
  });

  // Brass House Number
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(number, 128, 30);

  // Brass Door knob
  ctx.beginPath();
  ctx.arc(215, 275, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Brass Mail Slot
  ctx.fillStyle = '#d97706';
  ctx.fillRect(78, 440, 100, 20);
  ctx.strokeStyle = '#78350f';
  ctx.strokeRect(78, 440, 100, 20);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 7. Jack-o-Lantern Carved Face
export function createPumpkinFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ea580c'; // Vibrant pumpkin orange
  ctx.fillRect(0, 0, 256, 256);

  // Glowing carved eyes
  ctx.fillStyle = '#fef08a'; // Inner candle glow
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 12;

  // Left Eye (triangle)
  ctx.beginPath();
  ctx.moveTo(60, 90);
  ctx.lineTo(95, 125);
  ctx.lineTo(40, 125);
  ctx.closePath();
  ctx.fill();

  // Right Eye (triangle)
  ctx.beginPath();
  ctx.moveTo(196, 90);
  ctx.lineTo(216, 125);
  ctx.lineTo(161, 125);
  ctx.closePath();
  ctx.fill();

  // Nose (small triangle)
  ctx.beginPath();
  ctx.moveTo(128, 120);
  ctx.lineTo(142, 145);
  ctx.lineTo(114, 145);
  ctx.closePath();
  ctx.fill();

  // Jagged toothy grin
  ctx.beginPath();
  ctx.moveTo(45, 175);
  ctx.lineTo(75, 205);
  ctx.lineTo(95, 185);
  ctx.lineTo(128, 215);
  ctx.lineTo(161, 185);
  ctx.lineTo(181, 205);
  ctx.lineTo(211, 175);
  ctx.lineTo(185, 225);
  ctx.lineTo(128, 235);
  ctx.lineTo(71, 225);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
