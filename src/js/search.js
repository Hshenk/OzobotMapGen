import { START, AIRPORT, END, IMPASSABLE, TAILWIND, HEADWIND, getNeighbors, 
    findStart, boardSize, posKey } from "./board.js";

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



export function findBestRoute(board) {
    const start = findStart(board);
    const { width, height } = boardSize(board);
    const maxPath = width + height + 2;

    const best = { efficiency: -Infinity, path: null };
    const path = [start];
    const visited = new Set([stateKey(start[0], start[1], 3)]);

    function explore(x, y, fuel) {
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
            if (neighborType === IMPASSABLE) {
                continue;
            }
            if (visited.has(stateKey(nx, ny, newFuel))) {
                continue;
            }
            if (newFuel < 0) {
                continue;
            }
            
            // Neighbor is a valid move, so explore it
            visited.add(stateKey(nx, ny, newFuel));
            path.push([nx, ny]);
            explore(nx, ny, newFuel);
            path.pop();
            visited.delete(stateKey(nx, ny, newFuel));

        }

    }

    explore(start[0], start[1], 3);
    if (best.path === null) throw new Error('No path found');
    const { finalScore, efficiency } = scoreRoute(best.path, board);
    return { finalScore, efficiency, path: best.path };
}

export function canFindBestRoute(board) {
    const { width, height } = boardSize(board);
    const maxPath = width + height + 2;
    return maxPath < 21;
}