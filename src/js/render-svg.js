
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

const ICON_URLS = {
	[AIRPORT]: 'icons/airport.svg',
	[TAILWIND]: 'icons/tailwind.svg',
	[HEADWIND]: 'icons/headwind.svg',
	[IMPASSABLE]: 'icons/impassable.svg',
	[START]: 'icons/start.svg',
	[END]: 'icons/end.svg',
};

const COLOR_BORDER = '#000000';
const COLOR_COORD = '#b4b4b4';
const COLOR_TEXT = '#1e1e1e';
export const COLOR_ROUTE = '#0050c8';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';


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

            parts.push(`<rect x="${px}" y="${py}" width="${TILE}" height="${TILE}" fill="${TILE_COLORS[tileType]}" />`);

            // Coordinate Label
            if (tileType !== START) {
                parts.push(`<text x="${px + 5}" y="${py + 16}" font-size="14" fill="${COLOR_COORD}">${tileLabel(col, row)}</text>`);
            }

            // Icon
            if (tileType !== EMPTY) {
                const iconSize  = tileType === IMPASSABLE ? TILE * 0.75 : TILE * 0.55;
                const iconX = px + (TILE - iconSize) / 2;
                // Start icon must be a little lower
                const iconY = tileType === START ? py + TILE * 0.22 : py + (TILE - iconSize) / 2;
                parts.push(`<image href="${ICON_URLS[tileType]}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" />`);
            }

            // The start tile carries its airport name and prompt 
            if (tileType === START) {
				parts.push(`<text x="${px + TILE / 2}" y="${py + TILE * 0.15}" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${COLOR_TEXT}">${escapeXml(startName)}</text>`);
				parts.push(`<text x="${px + TILE / 2}" y="${py + TILE * 0.85}" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${COLOR_TEXT}">Start Here</text>`);
            }
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
    const ex = OUTER + endCol * TILE;
    const ey = OUTER + endRow * TILE;
    const blockSize = TILE * 2;

    parts.push(`<rect x="${ex}" y="${ey}" width="${blockSize}" height="${blockSize}" fill="${TILE_COLORS[END]}" />`);
	parts.push(`<image href="${ICON_URLS[END]}" x="${ex + TILE / 2}" y="${ey + TILE / 2}" width="${TILE}" height="${TILE}" />`);
	parts.push(`<text x="${ex + TILE}" y="${ey + TILE * 0.15}" font-size="17" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${COLOR_TEXT}">${escapeXml(endName)}</text>`);
	parts.push(`<text x="${ex + TILE}" y="${ey + TILE * 1.80}" font-size="17" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${COLOR_TEXT}">End Here</text>`);


    // --- Layer 4: outer border ---
    parts.push(`<rect x="${OUTER / 2}" y="${OUTER / 2}" width="${svgWidth - OUTER}" height="${svgHeight - OUTER}" fill="none" stroke="${COLOR_BORDER}" stroke-width="${OUTER}" />`);

    // --- Layer 5: route overlay mount point ---
    parts.push('<g id="route-layer"></g>');

    parts.push('</svg>');
    return parts.join('\n');
}