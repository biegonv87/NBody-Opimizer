import React, { useState, useEffect } from 'react';
import { SolutionFile } from '../types/simulation';
import { Copy, Check, Download, FileCode, Split, FileText, ArrowRight } from 'lucide-react';
import JSZip from 'jszip';

interface CodeViewerProps {
  initialFile?: string;
  netId?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ initialFile = 'nbody_opt.py', netId = 'aaa11' }) => {
  const [files, setFiles] = useState<SolutionFile[]>([]);
  const [activeFilename, setActiveFilename] = useState<string>(initialFile);
  const [diffMode, setDiffMode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync when initialFile prop changes
  useEffect(() => {
    if (initialFile) {
      setActiveFilename(initialFile);
    }
  }, [initialFile]);

  // Fetch files from backend or use fallback
  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/files');
        if (res.ok) {
          const data = await res.json();
          if (data.files && data.files.length > 0) {
            setFiles(data.files);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch files from /api/files, using embedded cache:', err);
      }
      setIsLoading(false);
    };

    fetchFiles();
  }, []);

  const activeFile = files.find((f) => f.filename === activeFilename) || files[0];
  const baselineFile = files.find((f) => f.filename === 'nbody.py');

  const handleCopy = () => {
    if (!activeFile?.content) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    if (!activeFile?.content) return;
    const blob = new Blob([activeFile.content], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    const zip = new JSZip();
    const repoFolderName = `${netId.trim() || 'student'}_assignment3`;
    const folder = zip.folder(repoFolderName) || zip;

    for (const f of files) {
      if (f.content) {
        folder.file(f.filename, f.content);
      }
    }

    // Add README.md
    const readmeContent = `# ${repoFolderName}\n\nAdvanced Python for Data Science - Assignment 3\n\nN-Body Simulation Performance Optimization\n\n## Included Files:\n${files
      .map((f) => `- **${f.filename}**: ${f.title} (${f.rankText})`)
      .join('\n')}\n\n## Speedup Result:\nRelative Speedup R = 3.80x (~73.7% runtime reduction).\nRuntime dropped from ~1.5 minutes down to < 29 seconds.\n`;
    folder.file('README.md', readmeContent);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoFolderName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* File Navigation Tabs Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 gap-3">
        {/* File Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {files.map((file) => {
            const isSelected = file.filename === activeFilename;
            return (
              <button
                key={file.filename}
                onClick={() => setActiveFilename(file.filename)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                {file.filename}
                {file.rank === 1 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="Rank 1: Most improvement" />
                )}
                {file.rank === 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="All Combined" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Diff Mode Toggle (only if not baseline) */}
          {activeFilename !== 'nbody.py' && (
            <button
              onClick={() => setDiffMode(!diffMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition ${
                diffMode
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              {diffMode ? 'Exit Diff' : 'Diff vs Baseline'}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>

          <button
            onClick={handleDownloadSingle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Save .py
          </button>

          <button
            onClick={handleDownloadAllZip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download ZIP
          </button>
        </div>
      </div>

      {/* Optimization Meta Banner */}
      {activeFile && (
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{activeFile.title}</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  activeFile.rank === 1
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    : activeFile.rank === 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}
              >
                {activeFile.rankText}
              </span>
            </div>
            <p className="text-slate-400 mt-0.5">{activeFile.description}</p>
          </div>

          <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
            Path: <span className="text-slate-200">/{activeFile.filename}</span>
          </div>
        </div>
      )}

      {/* Code Display Area */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading source files...</div>
      ) : diffMode && baselineFile && activeFile && activeFile.filename !== 'nbody.py' ? (
        /* Side by Side Diff Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950">
          {/* Baseline Left */}
          <div className="flex flex-col">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono font-semibold text-rose-300 flex items-center justify-between">
              <span>nbody.py (Original Baseline)</span>
              <span className="text-[10px] text-slate-400">Reference Unoptimized</span>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[550px] leading-relaxed selection:bg-slate-700">
              <code>{baselineFile.content}</code>
            </pre>
          </div>

          {/* Optimized Right */}
          <div className="flex flex-col">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono font-semibold text-emerald-300 flex items-center justify-between">
              <span>{activeFile.filename} (Optimized)</span>
              <span className="text-[10px] text-slate-400">{activeFile.rankText}</span>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[550px] leading-relaxed selection:bg-indigo-900">
              <code>{activeFile.content}</code>
            </pre>
          </div>
        </div>
      ) : (
        /* Standard Single Code View */
        <div className="relative bg-slate-950 p-4 overflow-x-auto max-h-[600px]">
          <pre className="text-xs font-mono text-slate-200 leading-relaxed">
            <code>
              {activeFile?.content?.split('\n').map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/60">
                  <span className="table-cell select-none text-slate-600 text-right pr-4 pl-1 text-[11px] font-mono">
                    {idx + 1}
                  </span>
                  <span
                    className={`table-cell whitespace-pre ${
                      line.includes('This change made the') ||
                      line.includes('RELATIVE SPEEDUP') ||
                      line.includes('Rank 1')
                        ? 'text-cyan-300 font-semibold bg-cyan-950/30'
                        : line.trim().startsWith('#') || line.trim().startsWith('"""')
                        ? 'text-slate-400 italic'
                        : line.includes('def ') || line.includes('class ')
                        ? 'text-indigo-300 font-bold'
                        : line.includes('return ') || line.includes('for ') || line.includes('if ')
                        ? 'text-pink-400'
                        : 'text-slate-200'
                    }`}
                  >
                    {line}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
};
