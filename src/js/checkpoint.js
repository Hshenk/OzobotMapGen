import { generateMap } from './generator.js';
import { renderBoardSvg } from './render-svg.js';
import { AIRPORT, TAILWIND, HEADWIND, IMPASSABLE } from './board.js';

const params = { seed: 777, airports: 10, tailwinds: 8, headwinds: 7, impassables: 8 };

const a = generateMap(params);
const b = generateMap(params);
const opts = { startName: 'Alpha', endName: 'Omega' };
const svgA = renderBoardSvg(a.board, opts);
const svgB = renderBoardSvg(b.board, opts);



console.log('deterministic render:', svgA === svgB);

// one <image> per special tile + start + ONE for the whole end block
function count(board, type) {
	let n = 0;
	for (const row of board) for (const tile of row) if (tile === type) n++;
	return n;
}
const expected = count(a.board, AIRPORT) + count(a.board, TAILWIND)
	+ count(a.board, HEADWIND) + count(a.board, IMPASSABLE) + 2;
const images = (svgA.match(/<image /g) || []).length;
console.log('icon count:', images === expected, `(${images} vs ${expected})`);

console.log('route layer present:', svgA.includes('id="route-layer"'));
console.log('names escaped:', renderBoardSvg(a.board, { startName: 'A & B', endName: 'x' }).includes('A &amp; B'));