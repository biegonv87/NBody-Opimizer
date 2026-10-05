"""
    N-body simulation - Optimization 4: Using data aggregation to reduce loop overheads.
    
    This change made the second most improvement (Rank 2).
    
    Explanation:
    In the original implementation, the simulation repeatedly iterated over string keys
    via `BODIES.keys()`, incurring repeated dictionary hashing and lookups (`BODIES[body1]`,
    `BODIES[body2]`) on every timestep. By aggregating the body data into a sequential
    list (`body_list = list(BODIES.values())`) and traversing unique pairs via index slicing
    or structured iteration, we completely eliminate dictionary lookups, eliminate key hashing,
    and remove the need for dynamic `seenit` filtering list allocations in the inner loop.
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
        advance the system one timestep using data aggregation into a list
        to reduce dictionary and loop overheads
    '''
    # Data aggregation: extract bodies into a contiguous list
    body_list = list(BODIES.values())
    n = len(body_list)
    
    # Iterate over unique pairs directly without nested dictionary lookups or seenit allocations
    for i in range(n):
        ([x1, y1, z1], v1, m1) = body_list[i]
        for j in range(i + 1, n):
            ([x2, y2, z2], v2, m2) = body_list[j]
            (dx, dy, dz) = compute_deltas(x1, x2, y1, y2, z1, z2)
            update_vs(v1, v2, dt, dx, dy, dz, m1, m2)
        
    for (r, [vx, vy, vz], m) in body_list:
        update_rs(r, dt, vx, vy, vz)

def compute_energy(m1, m2, dx, dy, dz):
    return (m1 * m2) / ((dx * dx + dy * dy + dz * dz) ** 0.5)
    
def report_energy(e=0.0):
    body_list = list(BODIES.values())
    n = len(body_list)
    for i in range(n):
        ((x1, y1, z1), v1, m1) = body_list[i]
        for j in range(i + 1, n):
            ((x2, y2, z2), v2, m2) = body_list[j]
            (dx, dy, dz) = compute_deltas(x1, x2, y1, y2, z1, z2)
            e -= compute_energy(m1, m2, dx, dy, dz)
        
    for (r, [vx, vy, vz], m) in body_list:
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
