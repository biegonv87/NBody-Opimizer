import time
import copy

# Complete evaluation script
PI = 3.14159265358979323
SOLAR_MASS = 4 * PI * PI
DAYS_PER_YEAR = 365.24

def get_clean_bodies():
    return {
        'sun': ([0.0, 0.0, 0.0], [0.0, 0.0, 0.0], SOLAR_MASS),
        'jupiter': ([4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01],
                    [1.66007664274403694e-03 * DAYS_PER_YEAR, 7.69901118419740425e-03 * DAYS_PER_YEAR, -6.90460016972063023e-05 * DAYS_PER_YEAR],
                    9.54791938424326609e-04 * SOLAR_MASS),
        'saturn': ([8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01],
                   [-2.76742510726862411e-03 * DAYS_PER_YEAR, 4.99852801234917238e-03 * DAYS_PER_YEAR, 2.30417297573763929e-05 * DAYS_PER_YEAR],
                   2.85885980666130812e-04 * SOLAR_MASS),
        'uranus': ([1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01],
                   [2.96460137564761618e-03 * DAYS_PER_YEAR, 2.37847173959480950e-03 * DAYS_PER_YEAR, -2.96589568540237556e-05 * DAYS_PER_YEAR],
                   4.36624404335156298e-05 * SOLAR_MASS),
        'neptune': ([1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01],
                    [2.68067772490389322e-03 * DAYS_PER_YEAR, 1.62824170038242295e-03 * DAYS_PER_YEAR, -9.51592254519715870e-05 * DAYS_PER_YEAR],
                    5.15138902046611451e-05 * SOLAR_MASS)
    }

# Helpers
def compute_deltas(x1, x2, y1, y2, z1, z2):
    return (x1-x2, y1-y2, z1-z2)
    
def compute_b(m, dt, dx, dy, dz):
    mag = compute_mag(dt, dx, dy, dz)
    return m * mag

def compute_mag(dt, dx, dy, dz):
    return dt * ((dx * dx + dy * dy + dz * dz) ** (-1.5))

def update_vs(v1, v2, dt, dx, dy, dz, m1, m2):
    v1[0] -= dx * compute_b(m2, dt, dx, dy, dz)
    v1[1] -= dy * compute_b(m2, dt, dx, dy, dz)
    v1[2] -= dz * compute_b(m2, dt, dx, dy, dz)
    v2[0] += dx * compute_b(m1, dt, dx, dy, dz)
    v2[1] += dy * compute_b(m1, dt, dx, dy, dz)
    v2[2] += dz * compute_b(m1, dt, dx, dy, dz)

def update_rs(r, dt, vx, vy, vz):
    r[0] += dt * vx
    r[1] += dt * vy
    r[2] += dt * vz

def compute_energy(m1, m2, dx, dy, dz):
    return (m1 * m2) / ((dx * dx + dy * dy + dz * dz) ** 0.5)

def offset_momentum(bodies, ref='sun'):
    px = 0.0
    py = 0.0
    pz = 0.0
    for body in bodies.keys():
        (r, [vx, vy, vz], m) = bodies[body]
        px -= vx * m
        py -= vy * m
        pz -= vz * m
    (r, v, m) = bodies[ref]
    v[0] = px / m
    v[1] = py / m
    v[2] = pz / m

def report_energy(bodies, e=0.0):
    seenit = []
    for body1 in bodies.keys():
        for body2 in bodies.keys():
            if (body1 != body2) and not (body2 in seenit):
                ((x1, y1, z1), v1, m1) = bodies[body1]
                ((x2, y2, z2), v2, m2) = bodies[body2]
                (dx, dy, dz) = compute_deltas(x1, x2, y1, y2, z1, z2)
                e -= compute_energy(m1, m2, dx, dy, dz)
                seenit.append(body1)
    for body in bodies.keys():
        (r, [vx, vy, vz], m) = bodies[body]
        e += m * (vx * vx + vy * vy + vz * vz) / 2.
    return e

# 0. Baseline advance (exactly as in nbody.py)
GLOBAL_BODIES = None
def advance_0(dt):
    global GLOBAL_BODIES
    seenit = []
    for body1 in GLOBAL_BODIES.keys():
        for body2 in GLOBAL_BODIES.keys():
            if (body1 != body2) and not (body2 in seenit):
                ([x1, y1, z1], v1, m1) = GLOBAL_BODIES[body1]
                ([x2, y2, z2], v2, m2) = GLOBAL_BODIES[body2]
                (dx, dy, dz) = compute_deltas(x1, x2, y1, y2, z1, z2)
                update_vs(v1, v2, dt, dx, dy, dz, m1, m2)
                seenit.append(body1)
        
    for body in GLOBAL_BODIES.keys():
        (r, [vx, vy, vz], m) = GLOBAL_BODIES[body]
        update_rs(r, dt, vx, vy, vz)

# Opt A: Reducing function call overhead
# Inlining compute_deltas, compute_b, compute_mag, update_vs, update_rs
def advance_opt_func(dt):
    global GLOBAL_BODIES
    seenit = []
    for body1 in GLOBAL_BODIES.keys():
        for body2 in GLOBAL_BODIES.keys():
            if (body1 != body2) and not (body2 in seenit):
                ([x1, y1, z1], v1, m1) = GLOBAL_BODIES[body1]
                ([x2, y2, z2], v2, m2) = GLOBAL_BODIES[body2]
                dx = x1 - x2
                dy = y1 - y2
                dz = z1 - z2
                mag = dt * ((dx * dx + dy * dy + dz * dz) ** (-1.5))
                bm2 = m2 * mag
                bm1 = m1 * mag
                v1[0] -= dx * bm2
                v1[1] -= dy * bm2
                v1[2] -= dz * bm2
                v2[0] += dx * bm1
                v2[1] += dy * bm1
                v2[2] += dz * bm1
                seenit.append(body1)
        
    for body in GLOBAL_BODIES.keys():
        (r, [vx, vy, vz], m) = GLOBAL_BODIES[body]
        r[0] += dt * vx
        r[1] += dt * vy
        r[2] += dt * vz

# Opt B: Using alternatives to membership testing of lists
# Replacing seenit = [] with seenit = set() (or dict)
def advance_opt_membership(dt):
    global GLOBAL_BODIES
    seenit = set()
    for body1 in GLOBAL_BODIES.keys():
        for body2 in GLOBAL_BODIES.keys():
            if (body1 != body2) and not (body2 in seenit):
                ([x1, y1, z1], v1, m1) = GLOBAL_BODIES[body1]
                ([x2, y2, z2], v2, m2) = GLOBAL_BODIES[body2]
                (dx, dy, dz) = compute_deltas(x1, x2, y1, y2, z1, z2)
                update_vs(v1, v2, dt, dx, dy, dz, m1, m2)
                seenit.add(body1)
        
    for body in GLOBAL_BODIES.keys():
        (r, [vx, vy, vz], m) = GLOBAL_BODIES[body]
        update_rs(r, dt, vx, vy, vz)

# Opt C: Using local rather than global variables
# In advance(), assign GLOBAL_BODIES and functions to local variables
def advance_opt_local(dt):
    global GLOBAL_BODIES
    bodies = GLOBAL_BODIES
    c_deltas = compute_deltas
    u_vs = update_vs
    u_rs = update_rs
    seenit = []
    keys = list(bodies.keys())
    for body1 in keys:
        for body2 in keys:
            if (body1 != body2) and not (body2 in seenit):
                ([x1, y1, z1], v1, m1) = bodies[body1]
                ([x2, y2, z2], v2, m2) = bodies[body2]
                (dx, dy, dz) = c_deltas(x1, x2, y1, y2, z1, z2)
                u_vs(v1, v2, dt, dx, dy, dz, m1, m2)
                seenit.append(body1)
        
    for body in keys:
        (r, [vx, vy, vz], m) = bodies[body]
        u_rs(r, dt, vx, vy, vz)

# Opt D: Using data aggregation to reduce loop overheads
# Instead of iterating over dict keys and doing dict lookups, aggregate bodies into a list or pairs
def advance_opt_aggregation(dt):
    global GLOBAL_BODIES
    # Data aggregation: extract body values once
    body_list = list(GLOBAL_BODIES.values())
    n = len(body_list)
    # Loop over index pairs directly or pre-aggregated pairs
    for i in range(n):
        ([x1, y1, z1], v1, m1) = body_list[i]
        for j in range(i + 1, n):
            ([x2, y2, z2], v2, m2) = body_list[j]
            (dx, dy, dz) = compute_deltas(x1, x2, y1, y2, z1, z2)
            update_vs(v1, v2, dt, dx, dy, dz, m1, m2)

    for (r, [vx, vy, vz], m) in body_list:
        update_rs(r, dt, vx, vy, vz)

# Opt Fully Optimized (All optimizations combined)
# Inlining + pre-aggregated pairs + local bindings + math optimization
class OptimizedSystem:
    def __init__(self, bodies_dict):
        self.bodies = list(bodies_dict.values())
        self.pairs = []
        n = len(self.bodies)
        for i in range(n):
            for j in range(i + 1, n):
                self.pairs.append((self.bodies[i], self.bodies[j]))

    def advance(self, dt):
        for (([x1, y1, z1], v1, m1), ([x2, y2, z2], v2, m2)) in self.pairs:
            dx = x1 - x2
            dy = y1 - y2
            dz = z1 - z2
            mag = dt * ((dx * dx + dy * dy + dz * dz) ** (-1.5))
            bm2 = m2 * mag
            bm1 = m1 * mag
            v1[0] -= dx * bm2
            v1[1] -= dy * bm2
            v1[2] -= dz * bm2
            v2[0] += dx * bm1
            v2[1] += dy * bm1
            v2[2] += dz * bm1

        for (r, [vx, vy, vz], m) in self.bodies:
            r[0] += dt * vx
            r[1] += dt * vy
            r[2] += dt * vz

def run_test(name, advance_fn, iterations=5000):
    global GLOBAL_BODIES
    GLOBAL_BODIES = get_clean_bodies()
    offset_momentum(GLOBAL_BODIES, 'sun')
    e_start = report_energy(GLOBAL_BODIES)
    
    t0 = time.perf_counter()
    for _ in range(iterations):
        advance_fn(0.01)
    t1 = time.perf_counter()
    e_end = report_energy(GLOBAL_BODIES)
    duration = t1 - t0
    return duration, e_start, e_end

def run_opt_all_test(iterations=5000):
    bodies = get_clean_bodies()
    offset_momentum(bodies, 'sun')
    e_start = report_energy(bodies)
    sys = OptimizedSystem(bodies)
    t0 = time.perf_counter()
    for _ in range(iterations):
        sys.advance(0.01)
    t1 = time.perf_counter()
    e_end = report_energy(bodies)
    duration = t1 - t0
    return duration, e_start, e_end

if __name__ == '__main__':
    iters = 10000
    print(f"Running benchmarks with {iters} iterations per method...")
    t_base, e_s0, e_e0 = run_test("Baseline", advance_0, iters)
    t_func, e_sf, e_ef = run_test("Function Overhead", advance_opt_func, iters)
    t_memb, e_sm, e_em = run_test("Membership Set", advance_opt_membership, iters)
    t_loc, e_sl, e_el = run_test("Local Variables", advance_opt_local, iters)
    t_agg, e_sa, e_ea = run_test("Data Aggregation", advance_opt_aggregation, iters)
    t_all, e_sall, e_eall = run_opt_all_test(iters)

    results = [
        ("Reducing function call overhead", t_func, t_base - t_func, (t_base - t_func)/t_base * 100, t_base / t_func),
        ("Using alternatives to membership testing of lists", t_memb, t_base - t_memb, (t_base - t_memb)/t_base * 100, t_base / t_memb),
        ("Using local rather than global variables", t_loc, t_base - t_loc, (t_base - t_loc)/t_base * 100, t_base / t_loc),
        ("Using data aggregation to reduce loop overheads", t_agg, t_base - t_agg, (t_base - t_agg)/t_base * 100, t_base / t_agg),
    ]

    # Sort by improvement (descending)
    results_sorted = sorted(results, key=lambda x: x[2], reverse=True)

    print("\n--- BENCHMARK RESULTS ---")
    print(f"Baseline Time: {t_base:.4f} s | Start Energy: {e_s0:.9f} | End Energy: {e_e0:.9f}")
    print(f"Combined Opt Time: {t_all:.4f} s | Speedup R (T_base/T_opt): {t_base/t_all:.2f}x | Reduction: {(t_base-t_all)/t_base*100:.1f}%")
    print(f"Combined End Energy: {e_eall:.9f} (Diff vs Baseline: {abs(e_eall - e_e0):.2e})")
    print("\n--- INDIVIDUAL OPTIMIZATIONS RANKED ---")
    rank_words = ["most", "second most", "third most", "fourth most"]
    for i, (name, t, saved, pct, speedup) in enumerate(results_sorted):
        print(f"Rank {i+1} ({rank_words[i]} improvement): {name}")
        print(f"   Time: {t:.4f} s | Saved: {saved:.4f} s ({pct:.1f}% faster) | Speedup: {speedup:.2f}x")
