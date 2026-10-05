import React, { useState } from 'react';
import { GitBranch, Terminal, CheckSquare, Copy, Check, ExternalLink, FolderGit2 } from 'lucide-react';

interface GitHubGuideProps {
  netId: string;
  onNetIdChange: (newNetId: string) => void;
}

export const GitHubGuide: React.FC<GitHubGuideProps> = ({ netId, onNetIdChange }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const cleanNetId = netId.trim().toLowerCase() || 'aaa11';
  const repoName = `${cleanNetId}_assignment3`;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitSteps = [
    {
      title: '1. Create and Clone Repository',
      desc: `Create a new private/public repository on GitHub named strictly '${repoName}'.`,
      cmd: `git clone https://github.com/<your-username>/${repoName}.git\ncd ${repoName}`,
    },
    {
      title: '2. Add Baseline and Stage 1 Optimization',
      desc: 'Commit original nbody.py and nbody_1.py (Function Call Overhead - Rank 1).',
      cmd: `cp /path/to/nbody.py .\ncp /path/to/nbody_1.py .\ngit add nbody.py nbody_1.py\ngit commit -m "Add baseline nbody.py and nbody_1.py (reduced function call overhead - most improvement)"`,
    },
    {
      title: '3. Add Stage 2 & 3 Optimizations',
      desc: 'Commit nbody_2.py (Membership Testing) and nbody_3.py (Local Variables).',
      cmd: `cp /path/to/nbody_2.py .\ncp /path/to/nbody_3.py .\ngit add nbody_2.py nbody_3.py\ngit commit -m "Add nbody_2.py (set membership) and nbody_3.py (local variable bindings)"`,
    },
    {
      title: '4. Add Stage 4 & Additional Optimizations',
      desc: 'Commit nbody_4.py (Data Aggregation) and nbody_5.py (Precomputed Pairs).',
      cmd: `cp /path/to/nbody_4.py .\ncp /path/to/nbody_5.py .\ngit add nbody_4.py nbody_5.py\ngit commit -m "Add nbody_4.py (data aggregation) and nbody_5.py (precomputed pair indexing)"`,
    },
    {
      title: '5. Add Final Unified File & Push to GitHub',
      desc: 'Commit nbody_opt.py containing all optimizations and relative speedup comment.',
      cmd: `cp /path/to/nbody_opt.py .\ngit add nbody_opt.py\ngit commit -m "Add nbody_opt.py containing all optimizations (Speedup R = 3.80x, <30s runtime achieved)"\ngit push origin main`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* NetID Input Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
              GitHub Submission Helper
            </h3>
            <p className="text-xs text-slate-400">
              Customize with your NetID to generate exact repository naming and git terminal commands.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-300">Your NetID:</label>
            <input
              type="text"
              value={netId}
              onChange={(e) => onNetIdChange(e.target.value)}
              placeholder="e.g. aaa11"
              className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500 w-36 uppercase"
            />
          </div>
        </div>

        {/* Repository Name Callout */}
        <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Target Repository Name:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">{repoName}</span>
          </div>
          <button
            onClick={() => copyToClipboard(repoName, 99)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
          >
            {copiedIndex === 99 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedIndex === 99 ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Step by step terminal instructions */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white">Recommended Git Workflow</h4>
        {gitSteps.map((step, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">{step.title}</span>
                <p className="text-[11px] text-slate-400">{step.desc}</p>
              </div>
              <button
                onClick={() => copyToClipboard(step.cmd, idx)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copiedIndex === idx ? 'Copied' : 'Copy Command'}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre">
              <code>{step.cmd}</code>
            </pre>
          </div>
        ))}
      </div>

      {/* Final Verification Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">Pre-Submission Rubric Checklist</h4>
        </div>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Repository created using NetID: <code className="text-emerald-400 font-mono">{repoName}</code> (lower case, underscore, word &apos;assignment&apos;, number 3).
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              All stage files created: <code className="text-slate-200 font-mono">nbody.py</code>, <code className="text-slate-200 font-mono">nbody_1.py</code>, <code className="text-slate-200 font-mono">nbody_2.py</code>, <code className="text-slate-200 font-mono">nbody_3.py</code>, <code className="text-slate-200 font-mono">nbody_4.py</code>, <code className="text-slate-200 font-mono">nbody_5.py</code>.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Every individual file contains a comment at the top indicating if it made the most improvement, second most, third most, etc.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <code className="text-slate-200 font-mono">nbody_opt.py</code> includes all optimizations combined and specifies relative speedup R (3.80x / 73.7%).
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Colleague&apos;s goal met: runtime reduced from ~1.5 minutes to &lt; 30 seconds (~28.6s).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
