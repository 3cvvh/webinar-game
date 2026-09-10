import { StageConfig } from '../../types';

export const STAGES: Record<1 | 2 | 3, StageConfig> = {
  1: {
    id: 1,
    name: 'Stage 1: Hutan Pinggiran (The Outskirts)',
    subtitle: 'Pengenalan Kontrol & Anak Naga',
    worldWidth: 1600,
    worldHeight: 550,
    ambientColor: 'rgba(21, 128, 61, 0.08)',
    skyGradient: ['#0f172a', '#1e293b'],
    groundColor: '#166534',
    objective: 'Kalahkan seluruh anak naga (Hatchling) untuk membuka gerbang ke sarang naga!',
    hazards: [],
    platforms: [
      // Main ground floor
      { x: 0, y: 460, width: 1600, height: 90, type: 'SOLID' },
      // Elevated training ledges
      { x: 260, y: 360, width: 130, height: 18, type: 'SOLID' },
      { x: 500, y: 310, width: 150, height: 18, type: 'SOLID' },
      { x: 800, y: 350, width: 140, height: 18, type: 'SOLID' },
      { x: 1100, y: 320, width: 150, height: 18, type: 'SOLID' },
    ],
    enemies: [
      { type: 'HATCHLING', x: 420, y: 400, patrolRange: 100 },
      { type: 'HATCHLING', x: 740, y: 400, patrolRange: 120 },
      { type: 'HATCHLING', x: 1050, y: 400, patrolRange: 110 },
      { type: 'HATCHLING', x: 1350, y: 400, patrolRange: 130 },
    ],
  },
  2: {
    id: 2,
    name: 'Stage 2: Gua Wyvern & Jurang Lahar',
    subtitle: 'Naga Terbang & Rintangan Lahar',
    worldWidth: 1800,
    worldHeight: 550,
    ambientColor: 'rgba(239, 68, 68, 0.12)',
    skyGradient: ['#1c1917', '#451a03'],
    groundColor: '#78350f',
    objective: 'Hindari semburan bola api naga terbang dan jangan jatuh ke danau lahar membara!',
    hazards: [
      // Lava pits on ground level
      { x: 380, y: 490, width: 180, height: 60, type: 'LAVA' },
      { x: 860, y: 490, width: 220, height: 60, type: 'LAVA' },
      { x: 1320, y: 490, width: 200, height: 60, type: 'LAVA' },
    ],
    platforms: [
      // Safe islands
      { x: 0, y: 460, width: 380, height: 90, type: 'SOLID' },
      { x: 560, y: 460, width: 300, height: 90, type: 'SOLID' },
      { x: 1080, y: 460, width: 240, height: 90, type: 'SOLID' },
      { x: 1520, y: 460, width: 280, height: 90, type: 'SOLID' },

      // Floating rock ledges over lava
      { x: 390, y: 360, width: 140, height: 18, type: 'SOLID' },
      { x: 880, y: 350, width: 160, height: 18, type: 'SOLID' },
      { x: 1330, y: 340, width: 150, height: 18, type: 'SOLID' },
      { x: 680, y: 260, width: 120, height: 18, type: 'SOLID' },
    ],
    enemies: [
      { type: 'FLYING_WYVERN', x: 450, y: 220, patrolRange: 160 },
      { type: 'HATCHLING', x: 680, y: 400, patrolRange: 80 },
      { type: 'FLYING_WYVERN', x: 950, y: 200, patrolRange: 180 },
      { type: 'FLYING_WYVERN', x: 1400, y: 210, patrolRange: 160 },
      { type: 'HATCHLING', x: 1150, y: 400, patrolRange: 70 },
    ],
  },
  3: {
    id: 3,
    name: 'Stage 3: Ruang Tahta Naga Purba',
    subtitle: 'Pertarungan Terakhir & Penyelamatan Putri',
    worldWidth: 1200,
    worldHeight: 550,
    ambientColor: 'rgba(127, 29, 29, 0.18)',
    skyGradient: ['#0f051d', '#3b0764'],
    groundColor: '#312e81',
    objective: 'Tumbangkan Ignis Sang Naga Purba (2 Fase) dan selamatkan Sang Putri dari sangkar!',
    princessPosition: { x: 1080, y: 360 },
    hazards: [],
    platforms: [
      // Boss Arena Floor
      { x: 0, y: 460, width: 1200, height: 90, type: 'SOLID' },
      // Boss arena elevated pillars for dodging
      { x: 180, y: 350, width: 130, height: 18, type: 'SOLID' },
      { x: 420, y: 280, width: 140, height: 18, type: 'SOLID' },
      { x: 720, y: 340, width: 140, height: 18, type: 'SOLID' },
    ],
    enemies: [
      { type: 'BOSS_ELDER', x: 780, y: 375, patrolRange: 160 },
    ],
  },
};
