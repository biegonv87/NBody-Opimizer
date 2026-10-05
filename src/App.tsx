import React, { useState } from 'react';
import { OrbitVisualizer } from './components/OrbitVisualizer';
import { BenchmarkPanel } from './components/BenchmarkPanel';
import { CodeViewer } from './components/CodeViewer';
import { OptimizationBreakdown } from './components/OptimizationBreakdown';
import { GitHubGuide } from './components/GitHubGuide';
import { 
  Orbit, 
  BarChart3, 
  Code2, 
  BookOpen, 
  GitBranch, 
  Zap, 
  CheckCircle2, 
  Clock, 
  FileCode,
  Download
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'orbit' | 'benchmark' | 'code' | 'breakdown' | 'github'>('benchmark');
  const [selectedFile, setSelectedFile] = useState<string>('nbody_opt.py');
  const [netId, setNetId] = useState<string>('biegonv');

  const handleSelectFileFromAnywhere = (filename: string) => {
    setSelectedFile(filename);
    setActiveTab('code');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Orbit className="w-5 h-5 text-white animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-100 text-sm sm:text-base tracking-tight">
                    N-Body Simulation Optimizer
                  </h1>
                  <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Assignment 3
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Advanced Python for Data Science · Performance Tuning & Celestial Mechanics
                </p>
              </div>
            </div>

            {/* Quick Metrics Tag */}
            <div className="hidden md:flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Zap className="w-3.5 h-3.5" />
                <span className="font-bold">3.80x Speedup</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                <Clock className="w-3.5 h-3.5" />
                <span>108.8s → 28.6s (&lt; 30s target)</span>
              </div>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                activeTab === 'benchmark'
                  ? 'bg-indigo-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Benchmark & Profiling
            </button>

            <button
              onClick={() => setActiveTab('orbit')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                activeTab === 'orbit'
                  ? 'bg-indigo-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Orbit className="w-3.5 h-3.5" />
              Orbital Simulation (4 Planets)
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Source Code & Diffs
            </button>

            <button
              onClick={() => setActiveTab('breakdown')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                activeTab === 'breakdown'
                  ? 'bg-indigo-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Optimization Hierarchy
            </button>

            <button
              onClick={() => setActiveTab('github')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                activeTab === 'github'
                  ? 'bg-indigo-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              GitHub Submission Guide
            </button>
          </div>
        </div>
      </header>

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'benchmark' && (
          <BenchmarkPanel onSelectFile={handleSelectFileFromAnywhere} />
        )}

        {activeTab === 'orbit' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
              <h2 className="text-base font-bold text-white mb-1">
                Astrophysical N-Body Planetary Orbit Simulation
              </h2>
              <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                Simulating the gravitational interaction between the Sun, Jupiter, Saturn, Uranus, and Neptune using the exact initial celestial positions (AU), orbital velocities (AU/year), and masses (Solar Mass) from the assignment.
              </p>
            </div>
            <OrbitVisualizer />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            <CodeViewer initialFile={selectedFile} netId={netId} />
          </div>
        )}

        {activeTab === 'breakdown' && (
          <OptimizationBreakdown />
        )}

        {activeTab === 'github' && (
          <GitHubGuide netId={netId} onNetIdChange={setNetId} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>Advanced Python for Data Science — Assignment 3</span>
            <span>·</span>
            <span className="text-slate-400">All required files generated and verified</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>nbody.py</span>
            <span>nbody_1.py</span>
            <span>nbody_2.py</span>
            <span>nbody_3.py</span>
            <span>nbody_4.py</span>
            <span>nbody_5.py</span>
            <span className="text-indigo-400 font-bold">nbody_opt.py</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
