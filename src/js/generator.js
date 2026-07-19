import { createRng } from './prng.js';
import { EMPTY, AIRPORT, TAILWIND, HEADWIND, IMPASSABLE,
    START, END, posKey, manhattan, getNeighbors, findStart } from './board.js';
import { isSolvable } from './search.js';


/**
 * 
 * @param { seed, airports, tailwinds, headwinds, impassables, width, height } options 
 */
export function generateMap({
    seed = null,
    airports,
    tailwinds, 
    headwinds,
    impassables, 
    width = 10,
    height = 8,
} = {}) {

    validateInputs(airports, tailwinds, headwinds, impassables, width, height);

    const usedSeed = validateSeed(seed);
    const rng = createRng(usedSeed);
    const board = initBoard(width, height);
    const warnings = [];

    console.log("Generating new board...");

    const endBlock = getCornerConfig(rng, width, height);
    placeStartEnd(rng, endBlock, board, width, height);
    const start = findStart(board);

    // How long is the shortest path to the end, ignoring fuel
    const paths = endBlock.map(tile => bfsPath(start, tile, width, height))
        .filter(p => p !== null);
    const shortest = paths.reduce((a, b) => (b.length < a.length ? b : a));

    // Validate airport count
    const minAirports = Math.ceil((shortest.length - 1) / 4) - 1;
    if (minAirports > airports) {
        throw new Error('Not enough airports for board of this size');
    }

    // Airport chain
    const chain = generateAirportChain(start, endBlock, rng, width, height);
    for (const [x, y] of chain) {
        board[y][x] = AIRPORT;
    }
    if (!isSolvable(board)) {
        throw new Error('Something went wrong placing main chain of airports');
    }

    const protectedCor = computeProtectedCorridor(start,chain, endBlock, width, height);

    let nExtra = airports - chain.length;
    if (nExtra > 0) {
        const newAirports = placeExtraAirports(chain, nExtra, board, rng, width, height, warnings);
        for (const newAirport of newAirports) {
            const nearest = chain.length > 0 ? chain.reduce((best, a) => manhattan(a, newAirport) < manhattan(best, newAirport) ? a : best) : start;

            const path = bfsPath(nearest, newAirport, width, height);
            for (const tile of path) {
                protectedCor.add(posKey(tile));
            }
        }
    }


    placeWinds(tailwinds, headwinds, board, rng, height, width);
    placeImpassable(impassables, board, protectedCor, rng, warnings, height, width);

    if (!isSolvable(board)) {
        throw new Error('Generated board is unsolvable');
    }

    return { board, seed: usedSeed, warnings }

}


function initBoard(width, height) {
  return Array.from({ length: height }, () => 
    Array(width).fill(EMPTY)
  );
}


function validateInputs(airports, tailwinds, headwinds, impassables, width, height) {
    let total = 0;

    if (airports < 1) {
        throw new Error("Not enough airports");
    }

    for (const n of [airports, tailwinds, headwinds, impassables]) {
        if (n < 0 || !Number.isInteger(n)) {
            throw new Error("Enter a positive number of tiles");
        }
        total += n;
    }
    if (width < 5 || height < 4) {
        throw new Error("Board must be at least 5x4");
    }

    if (total > ((width * height) - 5)) {
        throw new Error("Too many special tiles");
    }
}

//Returns the given seed if it is valid, or a random one otherwise
function validateSeed(seed) {
    if (Number.isInteger(seed) && seed >= 1 && seed <= 999999) {
        return seed;
    }
    return Math.floor(Math.random() * 999999) + 1;
}

// Returns the shortest path as a list
// This is not counting game rules, just the straight path
function bfsPath(start, goal, width, height) {
    const frontier = [start];
    const visited = new Set([posKey(start)]);
    const parents = new Map();
    parents.set(posKey(start), null);
    //parents.get(key); parents.has(key);
    while (frontier.length > 0) {
        const current = frontier.shift();
        if (posKey(current) === posKey(goal)){

            const path = [current];
            let cur = current;
            while (parents.get(posKey(cur)) !== null){
                const [nx, ny] = parents.get(posKey(cur));
                path.push([nx, ny]);
                cur = [nx, ny];
            }
            path.reverse();
            return path;
        }

        for (const [nx, ny] of getNeighbors(current[0], current[1], width, height)) {
            const key = posKey([nx, ny]);
            if (visited.has(key)) {
                continue; // Duplicate 
            }
            
            
            visited.add(key);
            parents.set(key, current);
            frontier.push([nx, ny]);
        }
    }
    // No path found
    return null;
}


// Randomly picks a corner to be the end point
function getCornerConfig(rng, width, height) {
    const corners = [[0, 0], [width - 1, 0], [width -1, height - 1], [0, height - 1]];
    const corner = rng.choice(corners);
    const diagonal = [corner[0] === 0 ? 1 : width - 2, corner[1] === 0 ? 1 : height - 2];
    return [corner, ...getNeighbors(corner[0], corner[1], width, height), diagonal];
}


// Picks a place to put the start tile and places
// start and end tiles
function placeStartEnd(rng, endBlock, board, width, height) {
    const endCorner = endBlock[0];
    const startCorner = [
        endCorner[0] === 0 ? width - 1 : 0, 
        endCorner[1] === 0 ? height - 1 : 0
    ];

    // define quadrant bounds
    const xMin = startCorner[0] === 0 ? 0 : Math.floor(width / 2);
    const xMax = startCorner[0] === 0 ? Math.floor(width / 2) - 1 : width - 1;
    const yMin = startCorner[1] === 0 ? 0 : Math.floor(height / 2);
    const yMax = startCorner[1] === 0 ? Math.floor(height / 2) - 1 : height - 1;

    const minStartDistance = Math.min(10, width + height - 4);
    const candidates = [];
    for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
            if (manhattan([x, y], endCorner) > minStartDistance) {
                candidates.push([x, y]);
            }
        }
    }
    if (candidates.length === 0) throw new Error('No valid start position found');

    const start = rng.choice(candidates);
    for (const [ex, ey] of endBlock) {
        board[ey][ex] = END;
    }

    if (board[start[1]][start[0]] === END) {
        throw new Error('Tried to place start tile on end tile');
    }

    board[start[1]][start[0]] = START;
}


// Generate a chain of airports from start to finish
// Will be empty if the start is within 4 tiles of the end
function generateAirportChain(start, endBlock, rng, width, height) {
    let current = start;
    let chain = [];
    const chainKeys = new Set();
    const endKeys = new Set(endBlock.map(posKey));

    while (true) {
        const paths = [];
        for (const endTile of endBlock) {
            paths.push(manhattan(current, endTile));
        }
        const closestPath = Math.min(...paths);
        if (closestPath <= 4) {
            return chain;
        }

        const candidates = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pos = [x, y];
                const dis = manhattan(pos, current);

                if (2 <= dis && dis <= 4 && !chainKeys.has(posKey(pos))) {



                    if (posKey(pos) !== posKey(start) && !endKeys.has(posKey(pos))) {
                        // Check candidate distance compared to current distance
                        const newPaths = [];
                        for (const endTile of endBlock) {
                            newPaths.push(manhattan(pos, endTile));
                        }
                        const newClosest = Math.min(...newPaths);

                        if (newClosest < closestPath) {
                            candidates.push(pos);
                        }
                    }
                }
            }
        }

        // If we run out of candidates, use fall back method
        if (candidates.length === 0) {
            break;
        }

        const chosen = rng.choice(candidates);
        chain.push(chosen); 
        chainKeys.add(posKey(chosen));
        current = chosen;
    }

    // Fallback method
    console.warn("Airport chain failed to generate, using fallback");
    const paths = [];
    chain = [];

    for (const endTile of endBlock) {
        paths.push(manhattan(start, endTile));
    }
    const closestEnd = endBlock[paths.indexOf(Math.min(...paths))];

    const path = bfsPath(start, closestEnd, width, height);

    for (const [i, tile] of path.entries()) {
        if (i > 0 && i % 3 === 0) {
            chain.push(tile);
        }
    }

    return chain;
}

// Returns a set of posKeys representing the protected corridor
function computeProtectedCorridor(start, spineAirports, endBlock, width, height) {
    const protectedChain = new Set();


    // Handles a very small map
    if (spineAirports.length === 0) {
        let closestEnd = [];
        let closestDis = Infinity;
        for (const endTile of endBlock) {
            const dis = manhattan(start, endTile);
            if (dis < closestDis) {
                closestEnd = endTile;
                closestDis = dis;
            }
        }

        protectedChain.add(posKey(closestEnd));
        protectedChain.add(posKey(start));

        const chain = bfsPath(start, closestEnd, width, height);
        for (const tile of chain) {
            protectedChain.add(posKey(tile));
        }

        return protectedChain;
    }

    // Find the closest end tile to the last chain airport
    let closestEnd = [];
    let closestDis = Infinity;
    for (const endTile of endBlock) {
        const dis = manhattan(spineAirports.at(-1), endTile);
        if (dis < closestDis) {
            closestEnd = endTile;
            closestDis = dis;
        }
    }

    // Create an ordered list of known points on the chain
    // We add everything to both to keep track of order
    const fullChain = [];
    fullChain.push(start);
    protectedChain.add(posKey(start));
    for (const airport of spineAirports) {
        fullChain.push(airport);
        protectedChain.add(posKey(airport));
    }
    protectedChain.add(posKey(closestEnd));
    fullChain.push(closestEnd);

    for (const [i, tile1] of fullChain.entries()) {
        if (i === fullChain.length - 1) {
            break;
        }
        const tile2 = fullChain[i + 1];
        const newTiles = bfsPath(tile1, tile2, width, height);

        if (newTiles === null) {
            throw new Error('Could not find valid path in airport chain');
        }

        for (const newTile of newTiles) {
            protectedChain.add(posKey(newTile));
        }
    }

    return protectedChain;
}

function placeExtraAirports(spineAirports, nExtra, board, rng, width, height, warnings) {
    const newAirports = [];
    const candidates = [];
    const candidateKeys = new Set();
    const allAirports = [...spineAirports, findStart(board)];

    function scanAround(airport) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (manhattan([x, y], airport) <= 4 &&
                    board[y][x] === EMPTY &&
                    !candidateKeys.has(posKey([x, y]))) {
                        candidates.push([x, y]);
                        candidateKeys.add(posKey(x, y));
                    }
            }
        }
    }

    // Get candidates for airports.
    for (const airport of allAirports) {
        scanAround(airport);
    }

    while (nExtra > 0) {
        if (candidates.length === 0) {
            warnings.push('Ran out of candidates while placing extra airports');
            break;
        }
        rng.shuffle(candidates);
        const next = candidates.pop();
        board[next[1]][next[0]] = AIRPORT;
        newAirports.push(next);
        nExtra -= 1;
        scanAround(next);
    }

    return newAirports;
}


function placeWinds(nTailwinds, nHeadwinds, board, rng, height, width) {
    
    const candidates = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (board[y][x] === EMPTY) {
                candidates.push([x, y]);
            }
        }
    }

    if (candidates.length < nTailwinds + nHeadwinds) {
        throw new Error('Not enough blank tiles for winds');
    }

    rng.shuffle(candidates);


    let x = 0; let y = 0;
    for (let n = 0; n < nHeadwinds; n++) {
        [x, y] = candidates.pop();
        board[y][x] = HEADWIND; 
    }
    for (let n = 0; n < nTailwinds; n++) {
        [x, y] = candidates.pop();
        board[y][x] = TAILWIND;
    }
}

function placeImpassable(nImpassable, board, protectedSet, rng, warnings, height, width) {
        
    const candidates = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (board[y][x] === EMPTY && !protectedSet.has(posKey(x, y))) {
                candidates.push([x, y]);
            }
        }
    }

    rng.shuffle(candidates);


    /**
     * If we don't have enough empty tiles, we still place
     * as many impassable tiles as we can up to nImpassable. 
     * So we need to track how many we placed
     */
    let placed = 0;
    let x = 0; let y = 0;
    while (nImpassable > 0) {
        if (candidates.length === 0) {
            warnings.push(`Could only place ${placed} impassable tiles`);
            break;
        }

        [x, y] = candidates.pop();
        board[y][x] = IMPASSABLE;
        if (!isSolvable(board)) {
            // Broke the map, so reset and try another one
            board[y][x] = EMPTY;
        } else {
            placed++;
            nImpassable--;
        }
    }

}