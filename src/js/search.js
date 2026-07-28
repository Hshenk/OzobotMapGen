import { START, AIRPORT, END, IMPASSABLE, TAILWIND, HEADWIND, getNeighbors, 
    findStart, findEnd, boardSize, posKey, manhattan} from "./board.js";

const REFUEL_TILES = new Set([START, AIRPORT, END]);

function stateKey(x, y, fuel) {
    return `${x},${y},${fuel}`;
}

export function solvePath(board) {
    const [sx, sy] = findStart(board);
    const { width, height } = boardSize(board);
    const stack = [ { x: sx, y: sy, fuel: 3, tile: START, parent: null } ];
    const seen = new Set([ stateKey(sx, sy, 3)]);

    while (stack.length > 0) {
        const node = stack.pop();

        // If we're at the end, we step backwards and return the path
        if (node.tile === END) {
            const path = [];
            let cur = node;
            while (cur.parent !== null){
                path.push([cur.parent.x, cur.parent.y]);
                cur = cur.parent;
            }
            path.reverse();
            return path;
        }

        // Loop through neighbors and add them to stack
        for (const [nx, ny] of getNeighbors(node.x, node.y, width, height)) {
            const tileType = board[ny][nx];
            if (tileType === IMPASSABLE) {
                continue;
            }

            const newFuel = REFUEL_TILES.has(tileType) ? 3 : node.fuel - 1;
            if (newFuel < 0) {
                continue; // Out of fuel
            }
            
            const key = stateKey(nx, ny, newFuel);
            if (seen.has(key)) {
                continue; // Duplicate 
            }
            
            // Possible state, so add to stack
            seen.add(key);
            stack.push({ x: nx, y: ny, fuel: newFuel, tile: tileType, parent: node });

            
        }

    }
    return null; // Stack ran dry, unsolvable 
}

export function isSolvable(board) {
    return (solvePath(board) !== null);
}

// Returns { finalScore, efficiency }
export function scoreRoute(path, board) {
    const tailwindTiles = new Set();
    const headwindTiles = new Set();
    const airportTiles = new Set();
    let tileCount = 0;

    for (const [x, y] of path) {
        const tileType = board[y][x];
        const pos = [x, y];
        switch (tileType) {
            case AIRPORT: airportTiles.add(posKey(pos)); break;
            case TAILWIND: tailwindTiles.add(posKey(pos)); break;
            case HEADWIND: headwindTiles.add(posKey(pos)); break; 
        }
        if (tileType !== START && tileType !== END) {
            tileCount++;
        }
    }

    const finalScore = airportTiles.size * 2 + (tailwindTiles.size - headwindTiles.size);
    const efficiency = (finalScore / tileCount) * 100;

    return { finalScore, efficiency };
}


// Uses a DFS on a timer 
export function findBestRoute(board, { deadlineMs = Infinity } = {}) {
    const start = findStart(board);
    const endBlock = findEnd(board);
    const { width, height } = boardSize(board);
    const maxPath = width + height + 2;
    const deadline = performance.now() + deadlineMs;
    let timedOut = false;
    const stepsToEnd = buildStepsToEnd(board);

    const best = { efficiency: -Infinity, path: null };
    const path = [start];
    const visited = new Set([stateKey(start[0], start[1], 3)]);

    function explore(x, y, fuel) {
        // If we're taking too long, break and return so that we can try beam sort
        if (timedOut) return;
        if (performance.now() > deadline) {
            timedOut = true;
            return;
        }

        if (path.length > maxPath) {
            return;
        }

        const tileType = board[y][x];
        if (tileType === END) {
            const { efficiency } = scoreRoute(path, board);
            
            if (efficiency > best.efficiency) {
                best.efficiency = efficiency;
                best.path = path.map((p) => [p[0], p[1]]);

            }
            return;
        }

        // Refuel
        if (tileType === AIRPORT || tileType === START) {
            fuel = 3;
        }

        for (const [nx, ny] of getNeighbors(x, y, width, height)) {
            const neighborType = board[ny][nx];
            const newFuel = REFUEL_TILES.has(neighborType) ? 3 : fuel - 1;
            const key = stateKey(nx, ny, newFuel);
            if (neighborType === IMPASSABLE) {
                continue;
            }
            if (visited.has(key)) {
                continue;
            }
            if (newFuel < 0) {
                continue;
            }

            // Check if neighbor is too far from end and would hit max path length
            const remaining = stepsToEnd.has(key) ? stepsToEnd.get(key) : Infinity;
            if (path.length + 1 + remaining > maxPath) continue;

            
            // Neighbor is a valid move, so explore it
            visited.add(key);
            path.push([nx, ny]);
            explore(nx, ny, newFuel);
            path.pop();
            visited.delete(key);

        }

    }

    explore(start[0], start[1], 3);
    if (timedOut) {
        throw new Error('TIMEOUT');
    }
    if (best.path === null) throw new Error('No path found');
    const { finalScore, efficiency } = scoreRoute(best.path, board);
    return { finalScore, efficiency, path: best.path };
}

function canFindBestRoute(board) {
    const { width, height } = boardSize(board);
    const maxPath = width + height + 2;
    return maxPath < 21;
}



// creates a table to represent how far we are from the end at any given state.
function buildStepsToEnd(board) {
    const reverse = new Map();
    const goals = new Set();

    const { width, height } = boardSize(board);

    // --- Pass 1: walk every legal move and store it reversed ---
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (board[y][x] === IMPASSABLE) {
                continue;
            }
            for (let fuel = 0; fuel <= 3; fuel++) {
                const from = stateKey(x, y, fuel);

                for (const [nx, ny] of getNeighbors(x, y, width, height)) {
                    const nType = board[ny][nx];
                    if (nType === IMPASSABLE) continue;

                    // Fuel check
                    const nFuel = REFUEL_TILES.has(nType) ? 3 : fuel - 1;
                    if (nFuel < 0) continue;

                    const to = stateKey(nx, ny, nFuel);

                    if (!reverse.has(to)) reverse.set(to, []);
                    reverse.get(to).push(from)

                    if (nType === END) goals.add(to);
                }
            }
        }
    }


    // --- pass 2: BFS outward from every goal ---
    const dist = new Map();
    const queue = [];
    for (const g of goals) {
        dist.set(g, 0);
        queue.push(g);
    }

    let readIndex = 0;
    while (readIndex < queue.length) {
        const current = queue[readIndex];
        readIndex++;

        const d = dist.get(current);

        for (const predecessor of (reverse.get(current) ?? [])) {
            if (!dist.has(predecessor)) {
                dist.set(predecessor, d + 1);
                queue.push(predecessor);
            }
        }
    }

    return dist;
}



/**
 * Used for larger boards. This is not an exact best path, but an estimate
 * @param {list} board 
 * @param {*} beamWidth 
 * @returns { finalScore, flightEfficiency, path }
 */
export function beamSearch(board, beamWidth) {
    const start = findStart(board);
    const { width, height } = boardSize(board);
    const maxPath = width + height + 2;
    const stepsToEnd = buildStepsToEnd(board);


    let beams = [{ 
        state: { x: start[0], y: start[1], fuel: 3 }, 
        path: [start], 
        visited: new Set([stateKey(start[0], start[1], 3)]),
        score: 0, 
        efficiency: 0,
        toEnd: stepsToEnd.get(stateKey(start[0], start[1], 3)),
    }]
    let best = { efficiency: -Infinity, path: null };


    // Checks around a given tile for valid neighbors to move to
    // Returns a new potential beam { state: { x, y, fuel }, path, score }
    function getValidNeighbors(beam) {
        const x = beam.state.x;
        const y = beam.state.y;
        const fuel = beam.state.fuel;
        const validNeighbors = [];
        


        for (const [nx, ny] of getNeighbors(x, y, width, height)) {
            const neighborType = board[ny][nx];
            const newFuel = REFUEL_TILES.has(neighborType) ? 3 : fuel - 1;
            const key = stateKey(nx, ny, newFuel);
            if (neighborType === IMPASSABLE) {
                continue;
            }
            if (beam.visited.has(key)) {
                continue;
            }
            if (newFuel < 0) {
                continue;
            }


            // Check if neighbor is too far from end and would hit max path length
            const remaining = stepsToEnd.has(key) ? stepsToEnd.get(key) : Infinity;

            if (beam.path.length + 1 + remaining > maxPath) continue;
            



            // Neighbor is a valid move, so add it
            const nPath = [...beam.path, [nx, ny]];
            const nVisited = new Set(beam.visited);
            nVisited.add(key);
            const { finalScore, efficiency } = scoreRoute(nPath, board);
            validNeighbors.push({ 
                state: { x: nx, y: ny, fuel: newFuel }, 
                path: nPath,
                visited: nVisited,
                score: finalScore,
                efficiency: efficiency,
                toEnd: stepsToEnd.get(key),
            });
        }

        return validNeighbors;
    }


    for (let step = 0; step < maxPath - 1; step++) {
        let allCandidates = [];
        // expand all current beams
        for (const beam of beams) {

            // No need to expand beams that are already at the end
            const [ cx, cy ] = beam.path.at(-1);
            if (board[cy][cx] === END) {
                continue;
            }

            for (const neighborState of getValidNeighbors(beam)) {
                allCandidates.push(neighborState);

                // Check if our new candidates are at the end and record best
                const [ nx, ny ] = neighborState.path.at(-1);
                if (board[ny][nx] === END) {
                    if (neighborState.efficiency > best.efficiency) {
                        best = { efficiency:neighborState.efficiency, path: neighborState.path };
                    }
                }
            }
        }

        // We sort by score rather than efficiency to encourage moving to airports and the end
        allCandidates.sort((a, b) => 
        (b.score - a.score) || (a.toEnd - b.toEnd));
        
        // If beams are at duplicate states, take only the best one
        const seenStates = new Set();
        beams = []

        for (const candidate of allCandidates) {
            const key = stateKey(candidate.state.x, candidate.state.y, candidate.state.fuel);
            if (seenStates.has(key)) continue;
            seenStates.add(key);
            beams.push(candidate);
            if (beams.length >= beamWidth) break;
        }

        if (beams.length === 0) break;
    }


    // calculate final flight score and efficiency (We only kept efficiency for each)
    if (best.path === null) throw new Error('No path found');
    const { finalScore, efficiency } = scoreRoute(best.path, board);
    return { finalScore, efficiency, path: best.path };

}


// Orchestrator that tries to solve the board with DFS, then beam if that times out
export function solveRoute(board, { exactBudgetMs = 30000, beamWidth = 50 } = {}) {
    // DFS
    try {
        const result = findBestRoute(board, {
            deadlineMs: exactBudgetMs });
        return { ok: true, exact: true, ...result };
    } catch (err) {
        if (err.message !== 'TIMEOUT') {
            console.warn('exact solver failed:', err);
        }
    }

    // Beam search
    console.log('DFS timed out, trying beam search...')
    for (const width of [beamWidth, beamWidth * 4, beamWidth * 20]) {
        try {
            const result = beamSearch(board, width);
            return { ok: true, exact: false, ...result };
        } catch (err) {
            continue; // try a wider beam
        }
    }

    return { ok: false, reason: 'Could not find a route on this board.'};
}