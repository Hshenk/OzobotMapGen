

// Globals
export const EMPTY = 0;
export const AIRPORT = 'airport';
export const TAILWIND = 'tailwind';
export const HEADWIND = 'headwind';
export const IMPASSABLE = 'impassable';
export const START = 'start';
export const END = 'end';
export const MAX_HOP = 4;
export const REFUEL_TILES = new Set([START, AIRPORT, END]);
export const TOP_K = 5; // controls how organic the placement of airports looks

/**
 * Converts x and y into usable strings for compare
 * @param {[x, y]} pos 
 * @returns string 'x,y'
 */
export function posKey(pos) { return `${pos[0]},${pos[1]}`; }

export function manhattan(a, b) { return (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])); }


/**
 * @param {int} x 
 * @param {int} y 
 * @param {int} width 
 * @param {int} height 
 * @returns Array of orthogonal neighbor positions
 */
export function getNeighbors(x, y, width, height) {
    const posNeighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    const neighbors = [];
    for (const [nx, ny] of posNeighbors) {
        if (nx < 0 || nx > width - 1 || ny < 0 || ny > height - 1) {
            continue;
        } else {
            neighbors.push([nx, ny]);
        }
    }

    return neighbors;
}

// finds all tile coordinates within a range of a given x, y
export function tilesWithinRange(x, y, range, width, height) {
    const tiles = [];
    for (let dy = -range; dy < range; dy++) {
        const span = range -Math.abs(dy);
        for (let dx = -span; dx < span; dx++) {
            const ux = x + dx;
            const uy = y + dy;
            if (ux < 0 || ux > width - 1 || uy < 0 || uy > height - 1) continue;
            tiles.push([ux, uy]);
        }
    }
    return tiles;
}


export function findStart(board) {
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[0].length; x++) {
            if (board[y][x] === START) {
                return ([x, y]);
            }
        }
    }
    throw new Error('start not found');
}

// Returns a list of tile coordinates [x, y] that are included in the end block
export function findEnd(board) {
    const endBlock = [];
    for (let y = 0; y < board.length; y++) {
        if (!board[y].includes(END)) {
            continue;
        }
        for (let x = 0; x < board[0].length; x++) {
            if (board[y][x] === END) {
                endBlock.push([x, y]);
            }
        }
    }
    if (endBlock.length === 0) {
        throw new Error('Could not find end block');
    }
    return endBlock;
}


export function boardSize(board) {
    return { width: board[0].length, height: board.length };
}