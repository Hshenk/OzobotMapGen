import { generateMap } from "./generator.js";
import { renderBoardSvg } from "./render-svg.js";

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

// Default board defines the tile density we scale from for larger board defaults
// 80 tiles -> 10 airports, 8tw, 7hw, 8im
const DENSITY_BASIS = {
	area: 10 * 8,
	airports: 10,
	tailwinds: 8,
	headwinds: 7,
	impassables: 8,
};

let current = null;


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
    } catch (err) {
        // Bad input. Throw as readable and keep previous map displayed
        showError(err.message);
    }
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    generate();
});

generate();