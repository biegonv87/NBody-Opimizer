import { CelestialBody } from '../types/simulation';

export const PI = 3.14159265358979323;
export const SOLAR_MASS = 4 * PI * PI;
export const DAYS_PER_YEAR = 365.24;

export const INITIAL_BODIES_CONFIG: Record<string, { r: [number, number, number]; v: [number, number, number]; m: number; color: string; size: number }> = {
  sun: {
    r: [0.0, 0.0, 0.0],
    v: [0.0, 0.0, 0.0],
    m: SOLAR_MASS,
    color: '#fbbf24', // Amber/Yellow
    size: 14,
  },
  jupiter: {
    r: [4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01],
    v: [1.66007664274403694e-03 * DAYS_PER_YEAR, 7.69901118419740425e-03 * DAYS_PER_YEAR, -6.90460016972063023e-05 * DAYS_PER_YEAR],
    m: 9.54791938424326609e-04 * SOLAR_MASS,
    color: '#f97316', // Orange
    size: 9,
  },
  saturn: {
    r: [8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01],
    v: [-2.76742510726862411e-03 * DAYS_PER_YEAR, 4.99852801234917238e-03 * DAYS_PER_YEAR, 2.30417297573763929e-05 * DAYS_PER_YEAR],
    m: 2.85885980666130812e-04 * SOLAR_MASS,
    color: '#eab308', // Gold
    size: 8,
  },
  uranus: {
    r: [1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01],
    v: [2.96460137564761618e-03 * DAYS_PER_YEAR, 2.37847173959480950e-03 * DAYS_PER_YEAR, -2.96589568540237556e-05 * DAYS_PER_YEAR],
    m: 4.36624404335156298e-05 * SOLAR_MASS,
    color: '#06b6d4', // Cyan
    size: 6,
  },
  neptune: {
    r: [1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01],
    v: [2.68067772490389322e-03 * DAYS_PER_YEAR, 1.62824170038242295e-03 * DAYS_PER_YEAR, -9.51592254519715870e-05 * DAYS_PER_YEAR],
    m: 5.15138902046611451e-05 * SOLAR_MASS,
    color: '#3b82f6', // Blue
    size: 6,
  },
};

export function createInitialBodies(): CelestialBody[] {
  const bodies: CelestialBody[] = Object.entries(INITIAL_BODIES_CONFIG).map(([name, conf]) => ({
    name,
    color: conf.color,
    size: conf.size,
    r: [...conf.r],
    v: [...conf.v],
    m: conf.m,
  }));

  // Offset momentum relative to Sun
  let px = 0;
  let py = 0;
  let pz = 0;

  for (const b of bodies) {
    px -= b.v[0] * b.m;
    py -= b.v[1] * b.m;
    pz -= b.v[2] * b.m;
  }

  const sun = bodies.find((b) => b.name === 'sun')!;
  sun.v[0] = px / sun.m;
  sun.v[1] = py / sun.m;
  sun.v[2] = pz / sun.m;

  return bodies;
}

export function computeSystemEnergy(bodies: CelestialBody[]): {
  kinetic: number;
  potential: number;
  total: number;
} {
  let potential = 0;
  let kinetic = 0;

  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    const b1 = bodies[i];
    for (let j = i + 1; j < n; j++) {
      const b2 = bodies[j];
      const dx = b1.r[0] - b2.r[0];
      const dy = b1.r[1] - b2.r[1];
      const dz = b1.r[2] - b2.r[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      potential -= (b1.m * b2.m) / dist;
    }
    const speedSq = b1.v[0] * b1.v[0] + b1.v[1] * b1.v[1] + b1.v[2] * b1.v[2];
    kinetic += 0.5 * b1.m * speedSq;
  }

  return {
    kinetic,
    potential,
    total: kinetic + potential,
  };
}

export function stepSimulation(bodies: CelestialBody[], dt: number): void {
  const n = bodies.length;

  // Optimized pairwise velocity update
  for (let i = 0; i < n; i++) {
    const b1 = bodies[i];
    for (let j = i + 1; j < n; j++) {
      const b2 = bodies[j];
      const dx = b1.r[0] - b2.r[0];
      const dy = b1.r[1] - b2.r[1];
      const dz = b1.r[2] - b2.r[2];

      const distSq = dx * dx + dy * dy + dz * dz;
      const mag = dt * Math.pow(distSq, -1.5);

      const bm2 = b2.m * mag;
      const bm1 = b1.m * mag;

      b1.v[0] -= dx * bm2;
      b1.v[1] -= dy * bm2;
      b1.v[2] -= dz * bm2;

      b2.v[0] += dx * bm1;
      b2.v[1] += dy * bm1;
      b2.v[2] += dz * bm1;
    }
  }

  // Position update
  for (let i = 0; i < n; i++) {
    const b = bodies[i];
    b.r[0] += dt * b.v[0];
    b.r[1] += dt * b.v[1];
    b.r[2] += dt * b.v[2];
  }
}
