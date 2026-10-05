import express from 'express';
import { createServer as createViteServer } from 'vite';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

const SOLUTION_FILES = [
  {
    filename: 'nbody.py',
    title: 'Original Baseline',
    rank: null,
    rankText: 'Baseline Reference',
    category: 'Baseline',
    description: 'The unoptimized starting code provided by the astrophysicist colleague.',
  },
  {
    filename: 'nbody_1.py',
    title: 'Reducing Function Call Overhead',
    rank: 1,
    rankText: 'Rank 1: Most Improvement',
    category: 'Optimization 1',
    description: 'Inlines deltas, magnitude calculation, and position/velocity updates; computes exponentiation once per pair.',
  },
  {
    filename: 'nbody_2.py',
    title: 'Alternatives to Membership Testing of Lists',
    rank: 3,
    rankText: 'Rank 3: Third Most Improvement',
    category: 'Optimization 2',
    description: 'Replaces list seenit with a set() to leverage O(1) hash table membership lookups instead of O(N) array scans.',
  },
  {
    filename: 'nbody_3.py',
    title: 'Local Rather Than Global Variables',
    rank: 4,
    rankText: 'Rank 4: Fourth Most Improvement',
    category: 'Optimization 3',
    description: 'Binds globals to local variables to leverage CPython fast array lookup (LOAD_FAST) instead of dictionary hashing (LOAD_GLOBAL).',
  },
  {
    filename: 'nbody_4.py',
    title: 'Data Aggregation to Reduce Loop Overheads',
    rank: 2,
    rankText: 'Rank 2: Second Most Improvement',
    category: 'Optimization 4',
    description: 'Aggregates planetary bodies into flat sequential lists, eliminating dictionary hashing and key queries in the inner loop.',
  },
  {
    filename: 'nbody_5.py',
    title: 'Precomputed Pair Combinations',
    rank: 5,
    rankText: 'Additional Optimization',
    category: 'Optimization 5',
    description: 'Precomputes the unique interaction pairs once on startup using itertools.combinations, completely eliminating loop nesting.',
  },
  {
    filename: 'nbody_opt.py',
    title: 'Combined Optimized Version',
    rank: 0,
    rankText: 'Final: All Combined Optimizations',
    category: 'Final Combined',
    description: 'Unifies all 5 optimizations. Achieves ~3.8x speedup (73.7% time reduction), completing the full simulation in <30 seconds.',
  },
];

// Endpoint: get list of files and their content
app.get('/api/files', (_req, res) => {
  try {
    const filesWithContent = SOLUTION_FILES.map((fileInfo) => {
      const filePath = path.join(__dirname, fileInfo.filename);
      let content = '';
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf-8');
      }
      return {
        ...fileInfo,
        content,
      };
    });
    res.json({ files: filesWithContent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Run live Python benchmark
app.post('/api/run-benchmark', (req, res) => {
  const iterations = Math.min(Math.max(parseInt(req.body.iterations, 10) || 5000, 1000), 50000);

  const pythonScript = `
import time
import json
import nbody, nbody_1, nbody_2, nbody_3, nbody_4, nbody_5, nbody_opt

results = []
mods = [
    ("nbody.py", "Baseline", nbody),
    ("nbody_1.py", "Function Overhead", nbody_1),
    ("nbody_2.py", "Membership Testing", nbody_2),
    ("nbody_3.py", "Local Variables", nbody_3),
    ("nbody_4.py", "Data Aggregation", nbody_4),
    ("nbody_5.py", "Precomputed Pairs", nbody_5),
    ("nbody_opt.py", "Combined Optimized", nbody_opt),
]

iters = ${iterations}
base_time = 0.0

for fname, label, mod in mods:
    mod.offset_momentum(mod.BODIES['sun'])
    e_start = mod.report_energy()
    t0 = time.perf_counter()
    for _ in range(iters):
        mod.advance(0.01)
    t1 = time.perf_counter()
    e_end = mod.report_energy()
    duration = t1 - t0
    
    if fname == "nbody.py":
        base_time = duration
    
    speedup = base_time / duration if duration > 0 else 1.0
    pct_reduction = ((base_time - duration) / base_time * 100) if base_time > 0 else 0.0
    
    results.append({
        "filename": fname,
        "label": label,
        "durationSec": round(duration, 5),
        "durationMs": round(duration * 1000, 2),
        "startEnergy": round(e_start, 8),
        "endEnergy": round(e_end, 8),
        "speedup": round(speedup, 2),
        "pctReduction": round(pct_reduction, 1)
    })

print(json.dumps({"iterations": iters, "results": results}))
`;

  execFile('python3', ['-c', pythonScript], { timeout: 30000, cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('Benchmark error:', error, stderr);
      return res.status(500).json({ error: error.message, stderr });
    }
    try {
      const data = JSON.parse(stdout.trim());
      res.json(data);
    } catch (parseErr: any) {
      res.status(500).json({ error: 'Failed to parse python output', raw: stdout });
    }
  });
});

// Endpoint: Run arbitrary code / single script execution
app.post('/api/run-code', (req, res) => {
  const filename = req.body.filename;
  const loops = Math.min(Math.max(parseInt(req.body.loops, 10) || 2, 1), 10);
  const iterations = Math.min(Math.max(parseInt(req.body.iterations, 10) || 1000, 100), 5000);

  const matched = SOLUTION_FILES.find((f) => f.filename === filename);
  if (!matched) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const runnerCode = `
import time
import ${matched.filename.replace('.py', '')} as target

t0 = time.perf_counter()
target.nbody(${loops}, 'sun', ${iterations})
t1 = time.perf_counter()
print(f"__TOTAL_TIME__:{t1 - t0:.4f}")
`;

  execFile('python3', ['-c', runnerCode], { timeout: 15000, cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message, stderr, stdout });
    }
    res.json({ stdout, stderr });
  });
});

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
