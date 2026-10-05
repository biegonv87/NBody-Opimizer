"""
    N-body simulation - Optimization 3: Using local rather than global variables.
    
    This change made the fourth most improvement (Rank 4).
    
    Explanation:
    In Python, accessing global names (like `BODIES`, `compute_deltas`, `update_vs`, `update_rs`)
    requires the CPython virtual machine to execute `LOAD_GLOBAL`, which performs hash table
    lookups first in the module global dictionary, and then in the `__builtins__` dictionary.
    By binding module globals to local variables within the function scope (`bodies = BODIES`,
    local function references, and pre-resolving keys), Python accesses them via the `LOAD_FAST`
    opcode, which uses fast C-level indexed array access instead of dictionary hash lookups.
    While this provides a modest speed improvement on its own, it compounds effectively
    with other loop optimizations.
"""

PI = 3.14159265358979323
SOLAR_MASS = 4 * PI * PI
DAYS_PER_YEAR = 365.24

BODIES = {
    'sun': ([0.0, 0.0, 0.0], [0.0, 0.0, 0.0], SOLAR_MASS),

    'jupiter': ([4.84143144246472090e+00,
                 -1.16032004402742839e+00,
                 -1.03622044471123109e-01],
                    [1.66007664274403694e-03 * DAYS_PER_YEAR,
                     7.69901118419740425e-03 * DAYS_PER_YEAR,
                     -6.90460016972063023e-05 * DAYS_PER_YEAR],
                    9.54791938424326609e-04 * SOLAR_MASS),

    'saturn': ([8.34336671824457987e+00,
                4.12479856412430479e+00,
                -4.03523417114321381e-01],
               [-2.76742510726862411e-03 * DAYS_PER_YEAR,
                4.99852801234917238e-03 * DAYS_PER_YEAR,
                2.30417297573763929e-05 * DAYS_PER_YEAR],
               2.85885980666130812e-04 * SOLAR_MASS),

    'uranus': ([1.28943695621391310e+01,
                -1.51111514016986312e+01,
                -2.23307578892655734e-01],
               [2.96460137564761618e-03 * DAYS_PER_YEAR,
                2.37847173959480950e-03 * DAYS_PER_YEAR,
                -2.96589568540237556e-05 * DAYS_PER_YEAR],
               4.36624404335156298e-05 * SOLAR_MASS),

    'neptune': ([1.53796971148509165e+01,
                 -2.59193146099879641e+01,
                 1.79258772950371181e-01],
                [2.68067772490389322e-03 * DAYS_PER_YEAR,
                 1.62824170038242295e-03 * DAYS_PER_YEAR,
                 -9.51592254519715870e-05 * DAYS_PER_YEAR],
                5.15138902046611451e-05 * SOLAR_MASS)}

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

def advance(dt):
    '''
        advance the system one timestep using local variable bindings (LOAD_FAST)
    '''
    # Bind globals to local variables to use LOAD_FAST instead of LOAD_GLOBAL
    local_bodies = BODIES
    local_compute_deltas = compute_deltas
    local_update_vs = update_vs
    local_update_rs = update_rs
    body_keys = list(local_bodies.keys())
    
    seenit = []
    for body1 in body_keys:
        for body2 in body_keys:
            if (body1 != body2) and not (body2 in seenit):
                ([x1, y1, z1], v1, m1) = local_bodies[body1]
                ([x2, y2, z2], v2, m2) = local_bodies[body2]
                (dx, dy, dz) = local_compute_deltas(x1, x2, y1, y2, z1, z2)
                local_update_vs(v1, v2, dt, dx, dy, dz, m1, m2)
                seenit.append(body1)
        
    for body in body_keys:
        (r, [vx, vy, vz], m) = local_bodies[body]
        local_update_rs(r, dt, vx, vy, vz)

def compute_energy(m1, m2, dx, dy, dz):
    return (m1 * m2) / ((dx * dx + dy * dy + dz * dz) ** 0.5)
    
def report_energy(e=0.0):
    local_bodies = BODIES
    local_compute_deltas = compute_deltas
    local_compute_energy = compute_energy
    body_keys = list(local_bodies.keys())
    
    seenit = []
    for body1 in body_keys:
        for body2 in body_keys:
            if (body1 != body2) and not (body2 in seenit):
                ((x1, y1, z1), v1, m1) = local_bodies[body1]
                ((x2, y2, z2), v2, m2) = local_bodies[body2]
                (dx, dy, dz) = local_compute_deltas(x1, x2, y1, y2, z1, z2)
                e -= local_compute_energy(m1, m2, dx, dy, dz)
                seenit.append(body1)
        
    for body in body_keys:
        (r, [vx, vy, vz], m) = local_bodies[body]
        e += m * (vx * vx + vy * vy + vz * vz) / 2.
        
    return e

def offset_momentum(ref, px=0.0, py=0.0, pz=0.0):
    for body in BODIES.keys():
        (r, [vx, vy, vz], m) = BODIES[body]
        px -= vx * m
        py -= vy * m
        pz -= vz * m
        
    (r, v, m) = ref
    v[0] = px / m
    v[1] = py / m
    v[2] = pz / m

def nbody(loops, reference, iterations):
    offset_momentum(BODIES[reference])
    for _ in range(loops):
        report_energy()
        for _ in range(iterations):
            advance(0.01)
        print(report_energy())

if __name__ == '__main__':
    nbody(100, 'sun', 20000)
