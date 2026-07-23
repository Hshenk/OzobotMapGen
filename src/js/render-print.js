import { EMPTY, START, END, boardSize } from './board.js';
import { tileSvg, endBlockSvg, tileLabel, findEndTopLeft, COLOR_BORDER, COLOR_TEXT } from './render-svg.js';

const DPI = 150;
const PAGE_W = 11 * DPI;
const PAGE_H = 8.5 * DPI;
const MARGIN = 0.10 * DPI;
const PAGE_COLS = 5;
const PAGE_ROWS = 4;
const PRINT_TILE = 308;
const BORDER = 4;

const GRID_W = PAGE_COLS * PRINT_TILE;
const GRID_H = PAGE_ROWS * PRINT_TILE;

// Splits a board into 5x4 page slices in reading order.
export function splitPages(board) {
    const { width, height } = boardSize(board);
    const pagesWide = Math.ceil(width / PAGE_COLS);
    const pagesTall = Math.ceil(height / PAGE_ROWS);
    const pages = [];

    for (let pageRow = 0; pageRow < pagesTall; pageRow++) {
        for (let pageCol = 0; pageCol < pagesWide; pageCol++) {
            const colOffset = pageCol * PAGE_COLS;
            const rowOffset = pageRow * PAGE_ROWS;
            const slice = [];

            for (let r = 0; r < PAGE_ROWS; r++) {
                const row = [];
                for (let c = 0; c < PAGE_COLS; c++) {
                    const boardCol = colOffset + c;
                    const boardRow = rowOffset + r;
                    const inRange = boardCol < width && boardRow < height;
                    row.push(inRange ? board[boardRow][boardCol] : EMPTY);
                }
                slice.push(row);
            }

            pages.push({ board: slice, colOffset, rowOffset, pageNumber: pages.length + 1 });
        }
    }

    return { pages, pagesWide, pagesTall };
}

// Renders one 11x8.5in page
export function renderPageSvg(page, { startName, endName, seed, endTopLeft, isLast }) {
    const parts = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_W} ${PAGE_H}" width="11in" height="8.5in" font-family="system-ui, sans-serif">`);
	parts.push(`<rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="#ffffff" />`);

    // --- tiles ---
    for (let row = 0; row < PAGE_ROWS; row++) {
        for (let col = 0; col < PAGE_COLS; col++) {
            const tileType = page.board[row][col];
            if (tileType === END) {
                continue; // Drawn as one block later
            }
            const px = MARGIN + col * PRINT_TILE;
            const py = MARGIN + row * PRINT_TILE;
            const label = tileType === START
                ? null
                : tileLabel(col, row, page.colOffset, page.rowOffset);
            parts.push(tileSvg(tileType, px, py, PRINT_TILE, label, startName));
        }
    }

    // --- Interior grid lines ---
    for (let col = 1; col < PAGE_COLS; col++) {
        const x = MARGIN + col * PRINT_TILE;
		parts.push(`<line x1="${x}" y1="${MARGIN}" x2="${x}" y2="${MARGIN + GRID_H}" stroke="${COLOR_BORDER}" stroke-width="1" />`);
    }
    for (let row = 1; row < PAGE_ROWS; row++) {
        const y = MARGIN + row * PRINT_TILE;
		parts.push(`<line x1="${MARGIN}" y1="${y}" x2="${MARGIN + GRID_W}" y2="${y}" stroke="${COLOR_BORDER}" stroke-width="1" />`);
    }

    // --- End Block ---
    const localCol = endTopLeft[0] - page.colOffset;
    const localRow = endTopLeft[1] - page.rowOffset;
    const overlaps = localCol > -2 && localCol < PAGE_COLS 
        && localRow > -2 && localRow < PAGE_ROWS;
    if (overlaps) {
        // Drawing at a negative position is fine, view box clips it
        parts.push(endBlockSvg(MARGIN + localCol * PRINT_TILE, MARGIN + localRow * PRINT_TILE, PRINT_TILE, endName));
    }

    // --- Boarder around the grid ---
	parts.push(`<rect x="${MARGIN + BORDER / 2}" y="${MARGIN + BORDER / 2}" width="${GRID_W - BORDER}" height="${GRID_H - BORDER}" fill="none" stroke="${COLOR_BORDER}" stroke-width="${BORDER}" />`);

	// --- page number ---
	const numberX = MARGIN + GRID_W + (PAGE_W - MARGIN - GRID_W) / 2;
	const numberY = MARGIN + GRID_H * 0.05;
	parts.push(`<text x="${numberX}" y="${numberY}" font-size="${PRINT_TILE * 0.35}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${COLOR_TEXT}">${page.pageNumber}</text>`);

    // --- Seed. Only on last page ---
    if (isLast) {
		parts.push(`<text x="${GRID_W}" y="${MARGIN * 1.1 + GRID_H}" font-size="${PRINT_TILE * 0.08}" text-anchor="middle" dominant-baseline="middle" fill="${COLOR_TEXT}">Seed: ${seed}</text>`);
    }

    parts.push('</svg>');
    return parts.join('\n');
}



// A full page showing how the sheets tile together.
export function renderAssemblySvg(pagesWide, pagesTall) {
    const parts = [];

	parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_W} ${PAGE_H}" width="11in" height="8.5in" font-family="system-ui, sans-serif">`);
	parts.push(`<rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="#ffffff" />`);

	const centre = (x, y, text, size, weight = 'normal') =>
		`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="middle" dominant-baseline="middle" fill="${COLOR_TEXT}">${text}</text>`;

	parts.push(centre(PAGE_W / 2, 120, 'Map Assembly Diagram', 64, 'bold'));
	parts.push(centre(PAGE_W / 2, 210, `Print all ${pagesWide * pagesTall} map pages and tape them together as shown.`, 34));
	parts.push(centre(PAGE_W / 2, 260, 'Some edge tiles are blank filler and get covered by the neighbouring sheet.', 34));

    // Fit the page rectangles into space below the text
    const gap = 24;
    const availW = PAGE_W - 300;
    const availH = PAGE_H - 440;
    const rectW = Math.min(
        (availW - gap * (pagesWide - 1)) / pagesWide,
        ((availH - gap * (pagesTall - 1)) / pagesTall) * (11 / 8.5),
    );
    const rectH = rectW * (8.5 / 11);

    const totalW = pagesWide * rectW + gap * (pagesWide - 1);
    const totalH = pagesTall * rectH + gap * (pagesTall - 1);
    const originX = (PAGE_W - totalW) / 2;
    const originY = 340 + (availH - totalH) / 2;

    let pageNumber = 1;
    for (let row = 0; row < pagesTall; row++) {
        for (let col = 0; col < pagesWide; col++) {
            const x = originX + col * (rectW + gap);
            const y = originY + row * (rectH + gap);

			parts.push(`<rect x="${x}" y="${y}" width="${rectW}" height="${rectH}" fill="none" stroke="${COLOR_BORDER}" stroke-width="3" />`);
			parts.push(centre(x + rectW / 2, y + rectH / 2, pageNumber, Math.min(rectH * 0.4, 90), 'bold'));

            pageNumber += 1;
        }
    }

    parts.push('</svg>');
    return parts.join('\n');

}


// Map sheets only
export function buildMapPages(board, { startName, endName, seed }) {
    const { pages } = splitPages (board);
    const endTopLeft = findEndTopLeft(board);

    return pages.map((page, i) => renderPageSvg(page, {
        startName, endName, seed, endTopLeft, isLast: i === pages.length - 1,
    }));
}

// Single assembly diagram
export function buildAssemblyPage(board) {
    const { pagesWide, pagesTall } = splitPages(board);
    return renderAssemblySvg(pagesWide, pagesTall);
}