
import { EMPTY, AIRPORT, TAILWIND, HEADWIND, IMPASSABLE,
    START, END, boardSize } from "./board.js";

const TILE = 100;
const OUTER = 4; // Outer border
const INNER = 1; // Grid lines

const TILE_COLORS = {
    [EMPTY] : '#ffffff',
    [AIRPORT] : '#87ceeb', // Sky blue (135, 206, 235)
    [TAILWIND] : '#4caf50', // Green (76, 175, 80)
    [HEADWIND] : '#ffd700', // Yellow (255, 215, 0)
    [IMPASSABLE] : '#e53935', // Red (229, 57, 53)
    [START] : '#87ceeb',
    [END] : '#87ceeb',
};

const ICON_FILES = {
	[AIRPORT]: 'airport.svg',
	[TAILWIND]: 'tailwind.svg',
	[HEADWIND]: 'headwind.svg',
	[IMPASSABLE]: 'impassable.svg',
	[START]: 'start.svg',
	[END]: 'end.svg',
};

const iconHrefs = {};

export const COLOR_BORDER = '#000000';
const COLOR_COORD = '#b4b4b4';
export const COLOR_TEXT = '#1e1e1e';
export const COLOR_ROUTE = '#0050c8';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';


export async function loadIcons(basePath = 'icons/') {
    const jobs = Object.entries(ICON_FILES).map(async([tileType, file]) => {
        const response = await fetch(basePath + file);
        if (!response.ok) {
            throw new Error(`Could not load icon ${file}`);
        }
        const markup = await response.text();
		iconHrefs[tileType] = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    });

    await Promise.all(jobs);
}


/**
 * Returns the coordinate label for a tile such as "A1"
 * Offsets shift the labels for PDF pages
 */
export function tileLabel(col, row, colOffset = 0, rowOffset = 0) {
    let overflow = 0;
    while (col + colOffset >= 26) {
        col -= 26;
        overflow += 1;
    }

    let label = LETTERS[col + colOffset] + (row + rowOffset + 1);
    for (let i = 0; i < overflow; i++) {
        label = LETTERS[i] + label;
    }
    return label;
}

// Returns [x, y] of the end block's top left tile.
export function findEndTopLeft(board) {
    const { width, height } = boardSize(board);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (board[y][x] === END) {
                return [x, y];
            }
        }
    }
    throw new Error('No end found');
}

function escapeXml(text) {
    return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export function renderBoardSvg(board, {
    startName = 'College Park',
    endName = 'CloverField California',
    routePath = null,
} = {}) {
    const { width, height } = boardSize(board);
    const svgWidth = width * TILE + 2 * OUTER;
    const svgHeight = height * TILE + 2 * OUTER;

    const parts = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg"
        viewBox ="0 0 ${svgWidth} ${svgHeight}"
        font-family="system-ui, sans-serif">`);
    
    // --- Layer 1: Tiles ---
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tileType = board[row][col];
            if (tileType === END) {
                continue; // Draw this later
            }

            const px = OUTER + col * TILE;
            const py = OUTER + row * TILE;
            const label = tileType === START ? null : tileLabel(col, row);

            parts.push(tileSvg(tileType, px, py, TILE, label, startName));
        }
    }

    // --- Layer 2: interior grid lines ---
    for (let col = 1; col < width; col++) {
        const x = OUTER + col * TILE;
        parts.push(`<line x1="${x}" y1="${OUTER}" x2="${x}" y2="${svgHeight - OUTER}" stroke="${COLOR_BORDER}" stroke-width="${INNER}" />`);
    }
    for (let row = 1; row < height; row++) {
        const y = OUTER + row * TILE;
        parts.push(`<line x1="${OUTER}" y1="${y}" x2="${svgWidth - OUTER}" y2="${y}" stroke="${COLOR_BORDER}" stroke-width="${INNER}" />`);
    }

    // --- Layer 3: 2x2 End block ---
    // Drawn after the grid so it covers up the grid lines
    const [endCol, endRow] = findEndTopLeft(board);
    parts.push(endBlockSvg(OUTER + endCol * TILE, OUTER + endRow * TILE, TILE, endName));

    // --- Layer 4: outer border ---
    parts.push(`<rect x="${OUTER / 2}" y="${OUTER / 2}" width="${svgWidth - OUTER}" height="${svgHeight - OUTER}" fill="none" stroke="${COLOR_BORDER}" stroke-width="${OUTER}" />`);

    // --- Layer 5: route overlay mount point ---
	parts.push(`<g id="route-layer">${routePath === null ? '' : routeOverlaySvg(routePath)}</g>`);


    parts.push('</svg>');
    return parts.join('\n');
}

// Builds the SVG for route overlay. Returns the inner markup for #route-layer
export function routeOverlaySvg(path) {
    const center = (x, y) => [OUTER + x * TILE + TILE / 2, OUTER + y * TILE + TILE / 2];

    const points = path.map(([x, y]) => center(x, y).join(',')).join(' ');

    const parts = [];
	parts.push(`<polyline points="${points}" fill="none" stroke="${COLOR_ROUTE}" stroke-width="6" stroke-dasharray="16 10" stroke-linecap="round" stroke-linejoin="round" />`);

    // Dot for each tile
    for (const [x, y] of path) {
        const [cx, cy] = center(x, y);
		parts.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="${COLOR_ROUTE}" />`);
    }

    return parts.join('\n');
}

// One <text> centered on (x, y) used for start/end
function centeredText(x, y, text, size) {
	return `<text x="${x}" y="${y}" font-size="${size}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${COLOR_TEXT}">${escapeXml(text)}</text>`;
}

export function tileSvg(tileType, px, py, tile, label, startName) {
    const parts = [];
    parts.push(`<rect x="${px}" y="${py}" width="${tile}" height="${tile}" fill="${TILE_COLORS[tileType]}" />`);

	if (label !== null) {
		parts.push(`<text x="${px + tile * 0.05}" y="${py + tile * 0.16}" font-size="${tile * 0.14}" fill="${COLOR_COORD}">${label}</text>`);
	}

    if (tileType !== EMPTY) {
        const iconSize = tileType === IMPASSABLE ? tile * 0.75 : tile * 0.55;
        const iconX = px + (tile - iconSize) / 2;
        const iconY = tileType === START ? py + tile * 0.22 : py + (tile - iconSize) / 2;
        parts.push(`<image href="${iconHrefs[tileType]}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" />`);
    }

    if (tileType === START) {
        parts.push(centeredText(px + tile / 2, py + tile * 0.15, startName, tile * 0.14));
        parts.push(centeredText(px + tile / 2, py + tile * 0.85, 'Start Here', tile * 0.14));
    }

    return parts.join('\n');
}

// Draws the 2x2 end block with its top-left corner at (ex, ey)
export function endBlockSvg(ex, ey, tile, endName) {
    const size = tile * 2;
    const parts = [];

	parts.push(`<rect x="${ex}" y="${ey}" width="${size}" height="${size}" fill="${TILE_COLORS[END]}" />`);
	parts.push(`<image href="${iconHrefs[END]}" x="${ex + tile / 2}" y="${ey + tile / 2}" width="${tile}" height="${tile}" />`);
	parts.push(centeredText(ex + tile, ey + tile * 0.15, endName, tile * 0.17));
	parts.push(centeredText(ex + tile, ey + tile * 1.80, 'End Here', tile * 0.17));

    return parts.join('\n');
}

// The SVG-unit size of a rendered board
export function boardSvgSize(board) {
    const { width, height } = boardSize(board);
    return { width: width * TILE + 2 * OUTER, height: height * TILE + 2 * OUTER };
}