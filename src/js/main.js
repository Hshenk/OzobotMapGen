import { canFindBestRoute } from "./search.js";
import { generateMap } from "./generator.js";
import { renderBoardSvg, routeOverlaySvg, loadIcons, boardSvgSize } from "./render-svg.js";
import { buildMapPages, buildAssemblyPage } from "./render-print.js";
import { svgToPngBlob, downloadBlob } from "./export-image.js";

const form = document.querySelector('#controls');
const widthInput = document.querySelector('#width');
const heightInput = document.querySelector('#height');
const airportsInput = document.querySelector('#airports');
const tailwindsInput = document.querySelector('#tailwinds');
const headwindsInput = document.querySelector('#headwinds')
const impassablesInput = document.querySelector('#impassables');
const seedInput = document.querySelector('#seed');
const startNameInput = document.querySelector('#start-name');
const endNameInput = document.querySelector('#end-name');
const errorBox = document.querySelector('#error-box');
const warningsList = document.querySelector('#warnings');
const seedDisplay = document.querySelector('#seed-display');
const mapContainer = document.querySelector('#map-container');
const autofillButton = document.querySelector('#btn-autofill');
autofillButton.addEventListener('click', autofillTiles);
const routeButton = document.querySelector('#btn-route');
const routeInfo = document.querySelector('#route-info');
const printButton = document.querySelector('#btn-print');
const assemblyButton = document.querySelector('#btn-assembly');
const pngButton = document.querySelector('#btn-png');
const routePngButton = document.querySelector('#btn-route-png');
const printRoot = document.querySelector('#print-root');

// Default board defines the tile density we scale from for larger board defaults
// 80 tiles -> 10 airports, 8tw, 7hw, 8im
const DENSITY_BASIS = {
	area: 10 * 8,
	airports: 10,
	tailwinds: 8,
	headwinds: 7,
	impassables: 8,
};

let solver = null;
let current = null;
let routeShown = false;
let solving = false;
let currentRoute = null; // Remember last route for print


function createSolver() {
    // A module worker so it can import search.js
    solver = new Worker(new URL('./solver-worker.js', import.meta.url), { type: 'module' });
    solver.onmessage = onSolverMessage;
}

createSolver();

function cancelSolver() {
    solver.terminate();
    createSolver();
    solving = false;
}

function onSolverMessage(event) {
    const message = event.data;
    solving = false;

    if (!message.ok) {
        routeInfo.textContent = `Could not find a route: ${message.error}`;
        routeButton.disabled = false;
        routeButton.textContent = 'Show Best Route';
        return;
    }

    currentRoute = message.result;
    showRoute(currentRoute);
}

function showRoute(route) {
    const { finalScore, efficiency, path } = route;

    document.querySelector('#route-layer').innerHTML = routeOverlaySvg(path);
    routeInfo.textContent = `Best route - score ${finalScore}, efficiency ${efficiency.toFixed(1)}%`;
    routeShown = true;
    routeButton.disabled = false;
    routeButton.textContent = 'Hide Route';
    routePngButton.disabled = false;
}

function onRouteClick() {
    // If a route is showing, clicking hides it
    if (routeShown) {
        hideRoute();
        return;
    }
    if (current === null) {
        return;
    }
    if (currentRoute !== null) {
        showRoute(currentRoute);
        return;
    }

    solving = true;
    routeButton.disabled = true;
    routeButton.textContent = 'Solving...';
	routeInfo.innerHTML = '<span class="spinner"></span> Calculating best route…';
    solver.postMessage(current.board);
}

function hideRoute() {
    const layer = document.querySelector('#route-layer');
    if (layer !== null) {
        layer.innerHTML = '';
    } 
    routeShown = false;
    routeInfo.textContent = '';
    routeButton.textContent = 'Show Best Route';
}

function resetRoute() {
    // If a solver is still running, kill it
    if (solving) {
        cancelSolver();
    }

    routeShown = false;
    routeInfo.textContent = '';
    routeButton.textContent = 'Show Best Route';
    currentRoute = null;
    routePngButton.disabled = true;

    if (canFindBestRoute(current.board)) {
        routeButton.disabled = false;
        routeButton.title = '';
    } else {
        routeButton.disabled = true;
        routeButton.title = 'Board too large to compute the best route';
    }
}

function readOptions() {
    const seedText = seedInput.value.trim();
    return {
        seed: seedText === '' ? null : Number(seedText),
        airports: Number(airportsInput.value),
        tailwinds: Number(tailwindsInput.value),
        headwinds: Number(headwindsInput.value),
        impassables: Number(impassablesInput.value),
        width: Number(widthInput.value),
        height: Number(heightInput.value),
    };
}

function showError(message) {
    if (message === null) {
        errorBox.hidden = true;
        errorBox.textContent = '';
    } else {
        errorBox.hidden = false;
        errorBox.textContent = message;
    }
}

function showWarnings(warnings) {
    warningsList.innerHTML = warnings.map((w) => `<li>${w}</li>`).join('');
}


function autofillTiles() {
    const area = Number(widthInput.value) * Number(heightInput.value);
    const scale = area / DENSITY_BASIS.area; // 1.0 at default

    // round to whole tiles. Require one airport
    airportsInput.value = Math.max(1, Math.round(DENSITY_BASIS.airports * scale));
    tailwindsInput.value = Math.round(DENSITY_BASIS.tailwinds * scale);
    headwindsInput.value = Math.round(DENSITY_BASIS.headwinds * scale);
    impassablesInput.value = Math.round(DENSITY_BASIS.impassables * scale);

    // Add this back in to make it auto generate after filling counts
    //generate();
}

function printSvgPages(svgs) {
    printRoot.innerHTML = svgs
        .map((svg) => `<section class="print-page">${svg}</section>`)
        .join('');

    setTimeout(() => window.print(), 50);
}

function onPrintClick() {
    if (current === null) {
        return;
    }
    printSvgPages(buildMapPages(current.board, {
        startName: startNameInput.value,
        endName: endNameInput.value,
        seed: current.seed,
    }));
}

function onAssemblyClick() {
    if (current === null) {
        return;
    }
    printSvgPages([buildAssemblyPage(current.board)]);
}

// shared by both PNG buttons
async function exportPng(svgMarkup, filename) {
    const size = boardSvgSize(current.board);
    const scale = 2;
    try {
        const blob = await svgToPngBlob(svgMarkup, size.width * scale, size.height * scale);
        downloadBlob(blob, filename);
    } catch (err) {
        showError(err.message);
    }
}


function onFullMapPngClick() {
    if (current === null) {
        return;
    }
    const svg = renderBoardSvg(current.board, {
        startName: startNameInput.value,
        endName: endNameInput.value,
    });
    exportPng(svg, `ozobot-map-${current.seed}.png`);
}

function onRoutePngClick() {
    if (current === null || currentRoute === null) {
        return;
    }
    const svg = renderBoardSvg(current.board, {
        startName: startNameInput.value,
        endName: endNameInput.value,
        routePath: currentRoute.path,
    });
    exportPng(svg, `ozobot-map-${current.seed}-route.png`);
}

// Left off on 3.4 - generate()
function generate() {
    try {
        const result = generateMap(readOptions());
        current = result;
        mapContainer.innerHTML = renderBoardSvg(result.board, {
            startName: startNameInput.value,
            endName: endNameInput.value,
        });
        seedDisplay.textContent = `Seed: ${result.seed}`;
        showError(null);
        showWarnings(result.warnings);
        resetRoute();
    } catch (err) {
        // Bad input. Throw as readable and keep previous map displayed
        showError(err.message);
    }
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    generate();
});
routeButton.addEventListener('click', onRouteClick);
printButton.addEventListener('click', onPrintClick);
pngButton.addEventListener('click', onFullMapPngClick);
routePngButton.addEventListener('click', onRoutePngClick);
assemblyButton.addEventListener('click', onAssemblyClick);


await loadIcons();
generate();