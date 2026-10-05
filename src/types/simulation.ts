export interface CelestialBody {
  name: string;
  color: string;
  size: number;
  r: [number, number, number]; // x, y, z in AU
  v: [number, number, number]; // vx, vy, vz in AU/year
  m: number; // mass in solar masses
}

export interface BodyInitialState {
  r: [number, number, number];
  v: [number, number, number];
  m: number;
}

export interface BenchmarkResultItem {
  filename: string;
  label: string;
  durationSec: number;
  durationMs: number;
  startEnergy: number;
  endEnergy: number;
  speedup: number;
  pctReduction: number;
}

export interface BenchmarkResponse {
  iterations: number;
  results: BenchmarkResultItem[];
}

export interface SolutionFile {
  filename: string;
  title: string;
  rank: number | null;
  rankText: string;
  category: string;
  description: string;
  content?: string;
}
