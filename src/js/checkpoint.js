import { generateMap } from './generator.js';
import { isSolvable } from './search.js';
import { START, END, TAILWIND, HEADWIND, IMPASSABLE, AIRPORT, EMPTY,
	manhattan, findStart, boardSize } from './board.js';

function positionsOf(board, type) {
	const out = [];
	for (let y = 0; y < board.length; y++)
		for (let x = 0; x < board[0].length; x++)
			if (board[y][x] === type) out.push([x, y]);
	return out;
}

function checkBoard({ board, warnings }, params) {
	const problems = [];
	const { width, height } = boardSize(board);

	if (positionsOf(board, START).length !== 1) problems.push('start count != 1');

	// end block: exactly 4, forming a 2x2 anchored in a corner
	const ends = positionsOf(board, END);
	if (ends.length !== 4) {
		problems.push(`end count ${ends.length}`);
	} else {
		const xs = ends.map((p) => p[0]), ys = ends.map((p) => p[1]);
		const minX = Math.min(...xs), minY = Math.min(...ys);
		const block = new Set(ends.map((p) => `${p[0]},${p[1]}`));
		const is2x2 = block.has(`${minX},${minY}`) && block.has(`${minX + 1},${minY}`)
			&& block.has(`${minX},${minY + 1}`) && block.has(`${minX + 1},${minY + 1}`);
		const inCorner = (minX === 0 || minX === width - 2) && (minY === 0 || minY === height - 2);
		if (!is2x2) problems.push('end tiles not a 2x2 block');
		if (!inCorner) problems.push('end block not in a corner');

		// start must sit far from the end corner
		const cornerX = minX === 0 ? 0 : width - 1, cornerY = minY === 0 ? 0 : height - 1;
		if (manhattan(findStart(board), [cornerX, cornerY]) <= 10)
			problems.push('start too close to end');
	}

	if (positionsOf(board, TAILWIND).length !== params.tailwinds) problems.push('tailwind count wrong');
	if (positionsOf(board, HEADWIND).length !== params.headwinds) problems.push('headwind count wrong');
	if (positionsOf(board, AIRPORT).length < 1) problems.push('no airports');

	const nImpassable = positionsOf(board, IMPASSABLE).length;
	if (nImpassable > params.impassables) problems.push('too many impassables');
	if (nImpassable < params.impassables && warnings.length === 0)
		problems.push('impassable shortfall without a warning');

	if (!isSolvable(board)) problems.push('BOARD NOT SOLVABLE');

	return problems;
}

const params = { airports: 10, tailwinds: 8, headwinds: 7, impassables: 8 };
let pass = 0, fail = 0;
const t0 = performance.now();

for (let seed = 1; seed <= 300; seed++) {
	try {
		const result = generateMap({ seed, ...params });
		const problems = checkBoard(result, params);
		if (problems.length > 0) {
			fail++;
			console.error(`seed ${seed}:`, problems.join('; '));
		} else {
			pass++;
		}
	} catch (err) {
		fail++;
		console.error(`seed ${seed} threw:`, err.message);
	}
}

console.log(`${pass} passed, ${fail} failed (${((performance.now() - t0) / 1000).toFixed(1)}s)`);