import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CelestialBody } from '../types/simulation';
import { createInitialBodies, stepSimulation, computeSystemEnergy } from '../utils/physics';
import { Play, Pause, RotateCcw, FastForward, ZoomIn, ZoomOut, Compass, Activity, Eye } from 'lucide-react';

interface OrbitVisualizerProps {
  onEnergyUpdate?: (energy: { kinetic: number; potential: number; total: number }) => void;
}

export const OrbitVisualizer: React.FC<OrbitVisualizerProps> = ({ onEnergyUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [bodies, setBodies] = useState<CelestialBody[]>(createInitialBodies);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(10);
  const [zoom, setZoom] = useState<number>(14);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [timeElapsedDays, setTimeElapsedDays] = useState<number>(0);
  const [energy, setEnergy] = useState(() => computeSystemEnergy(createInitialBodies()));
  const [initialEnergy] = useState(() => computeSystemEnergy(createInitialBodies()).total);

  const trailsRef = useRef<{ [name: string]: [number, number][] }>({
    sun: [],
    jupiter: [],
    saturn: [],
    uranus: [],
    neptune: [],
  });

  const bodiesRef = useRef<CelestialBody[]>(bodies);
  bodiesRef.current = bodies;

  const resetSimulation = useCallback(() => {
    const init = createInitialBodies();
    setBodies(init);
    bodiesRef.current = init;
    trailsRef.current = { sun: [], jupiter: [], saturn: [], uranus: [], neptune: [] };
    setTimeElapsedDays(0);
    const e = computeSystemEnergy(init);
    setEnergy(e);
    if (onEnergyUpdate) onEnergyUpdate(e);
  }, [onEnergyUpdate]);

  // Animation Loop
  useEffect(() => {
    let animId: number;
    const dt = 0.01; // matches Python advance(0.01)
    const daysPerStep = dt * 365.24;

    const tick = () => {
      if (isPlaying) {
        const currentBodies = bodiesRef.current;
        // Step physics multiple times according to speed multiplier
        const subSteps = Math.max(1, Math.min(speedMultiplier, 50));
        for (let s = 0; s < subSteps; s++) {
          stepSimulation(currentBodies, dt);
        }

        // Record trails
        for (const b of currentBodies) {
          const trail = trailsRef.current[b.name];
          if (trail) {
            trail.push([b.r[0], b.r[1]]);
            if (trail.length > 500) trail.shift();
          }
        }

        setTimeElapsedDays((prev) => prev + daysPerStep * subSteps);
        const e = computeSystemEnergy(currentBodies);
        setEnergy(e);
        if (onEnergyUpdate) onEnergyUpdate(e);
        setBodies([...currentBodies]);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speedMultiplier, onEnergyUpdate]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2 + pan.x;
    const centerY = height / 2 + pan.y;

    // Clear Canvas with deep space gradient
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid lines (distance circles in Astronomical Units)
    ctx.lineWidth = 1;
    const auCircles = [5, 10, 15, 20, 25, 30];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    for (const rAU of auCircles) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, rAU * zoom, 0, Math.PI * 2);
      ctx.stroke();

      // AU distance label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '10px ui-monospace, monospace';
      ctx.fillText(`${rAU} AU`, centerX + rAU * zoom + 4, centerY - 4);
    }

    // Coordinate crosshair at origin
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY);
    ctx.lineTo(centerX + 12, centerY);
    ctx.moveTo(centerX, centerY - 12);
    ctx.lineTo(centerX, centerY + 12);
    ctx.stroke();

    // Draw Orbit Trails
    if (showTrails) {
      for (const b of bodies) {
        const trail = trailsRef.current[b.name];
        if (!trail || trail.length < 2) continue;

        ctx.beginPath();
        for (let i = 0; i < trail.length; i++) {
          const [tx, ty] = trail[i];
          const px = centerX + tx * zoom;
          const py = centerY + ty * zoom;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = b.color;
        ctx.globalAlpha = b.name === 'sun' ? 0.3 : 0.45;
        ctx.lineWidth = b.name === 'sun' ? 1 : 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }

    // Draw Bodies and Velocity Vectors
    for (const b of bodies) {
      const bx = centerX + b.r[0] * zoom;
      const by = centerY + b.r[1] * zoom;

      // Glow effect for Sun and planets
      const glowRad = b.name === 'sun' ? 24 : b.size * 2;
      const gradient = ctx.createRadialGradient(bx, by, 1, bx, by, glowRad);
      gradient.addColorStop(0, b.color);
      gradient.addColorStop(0.3, b.color + '66');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bx, by, glowRad, 0, Math.PI * 2);
      ctx.fill();

      // Core planet sphere
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(bx, by, b.size, 0, Math.PI * 2);
      ctx.fill();

      // Saturn Rings
      if (b.name === 'saturn') {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(bx, by, b.size * 2.2, b.size * 0.8, -0.4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Velocity Vector (scaled for visibility)
      if (showVectors && (Math.abs(b.v[0]) > 0.001 || Math.abs(b.v[1]) > 0.001)) {
        const vScale = 1.8;
        const vxEnd = bx + b.v[0] * vScale;
        const vyEnd = by + b.v[1] * vScale;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(vxEnd, vyEnd);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(b.v[1], b.v[0]);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(vxEnd, vyEnd);
        ctx.lineTo(vxEnd - 5 * Math.cos(angle - Math.PI / 6), vyEnd - 5 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(vxEnd - 5 * Math.cos(angle + Math.PI / 6), vyEnd - 5 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }

      // Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = '11px sans-serif';
      ctx.fillText(b.name.charAt(0).toUpperCase() + b.name.slice(1), bx + b.size + 4, by + 4);
    }
  }, [bodies, pan, zoom, showTrails, showVectors]);

  // Handle Drag to Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => Math.max(4, Math.min(prev * zoomFactor, 60)));
  };

  const energyDelta = Math.abs(energy.total - initialEnergy);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header & Simulation Controls */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 text-sm gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-semibold text-slate-100 tracking-tight">Astrophysical Orbit Engine</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            T = {(timeElapsedDays / 365.24).toFixed(2)} yrs ({Math.round(timeElapsedDays).toLocaleString()} days)
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 rounded-lg p-1">
            {[1, 5, 10, 25].map((multiplier) => (
              <button
                key={multiplier}
                onClick={() => setSpeedMultiplier(multiplier)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  speedMultiplier === multiplier
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {multiplier}x
              </button>
            ))}
          </div>

          {/* View options */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => setShowTrails(!showTrails)}
              title="Toggle Trails"
              className={`p-1.5 rounded-lg border text-xs transition ${
                showTrails ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowVectors(!showVectors)}
              title="Toggle Velocity Vectors"
              className={`p-1.5 rounded-lg border text-xs transition ${
                showVectors ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(z * 1.25, 60))}
              title="Zoom In"
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z * 0.8, 4))}
              title="Zoom Out"
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full h-[440px] bg-slate-950 cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={900}
          height={440}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Floating Telemetry Box */}
        <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 space-y-1.5 shadow-xl max-w-xs pointer-events-none">
          <div className="flex items-center justify-between gap-4 pb-1 border-b border-slate-800/80">
            <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">Total Energy E(t)</span>
            <span className="text-emerald-400 font-bold">{energy.total.toFixed(8)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[11px]">
            <span className="text-slate-400">Kinetic (K):</span>
            <span className="text-amber-300">{energy.kinetic.toFixed(6)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[11px]">
            <span className="text-slate-400">Potential (U):</span>
            <span className="text-cyan-300">{energy.potential.toFixed(6)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[11px] pt-1 border-t border-slate-800/60">
            <span className="text-slate-400">Energy Drift (ΔE):</span>
            <span className={`font-semibold ${energyDelta < 1e-4 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {energyDelta.toExponential(2)}
            </span>
          </div>
        </div>

        {/* Legend / Planet Readout Strip */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-lg px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xl">
          <div className="flex items-center gap-4 flex-wrap">
            {bodies.map((b) => {
              const dist = Math.sqrt(b.r[0] ** 2 + b.r[1] ** 2 + b.r[2] ** 2);
              const speed = Math.sqrt(b.v[0] ** 2 + b.v[1] ** 2 + b.v[2] ** 2);
              return (
                <div key={b.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                  <span className="font-medium text-slate-200 capitalize">{b.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {dist > 0.05 ? `${dist.toFixed(1)} AU` : 'Origin'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Scroll to zoom · Drag to pan
          </div>
        </div>
      </div>
    </div>
  );
};
