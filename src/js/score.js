
// Inputs
const airportInput = document.querySelector('#in-airports');
const tailwindInput = document.querySelector('#in-tailwinds');
const headwindInput = document.querySelector('#in-headwinds');
const totalInput = document.querySelector('#in-total');
// Outputs
const pointsOutput = document.querySelector('#out-points');
const efficiencyOutput = document.querySelector('#out-efficiency');
const scoreForm = document.querySelector('#score-form');
// Circles
const vAirports = document.querySelector('#v-airports');
const vTailwinds = document.querySelector('#v-tailwinds');
const vHeadwinds = document.querySelector('#v-headwinds');
const vPoints = document.querySelector('#v-points');
const vTotal = document.querySelector('#v-total');

function recompute() {
    const airports = Number(airportInput.value) ?? 0;
    const tailwinds = Number(tailwindInput.value) ?? 0;
    const headwinds = Number(headwindInput.value) ?? 0;
    const total = Number(totalInput.value) ?? 0;

    const points = airports * 2 + (tailwinds - headwinds);
    pointsOutput.textContent = points;

    if (total > 0) {
        const efficiency = (points / total) * 100;
        efficiencyOutput.textContent = `${efficiency.toFixed(1)}%`;
    } else {
        efficiencyOutput.textContent = '-';
    }

    vAirports.textContent = airports;
    vTailwinds.textContent = tailwinds;
    vHeadwinds.textContent = headwinds;
    vPoints.textContent = points;
    vTotal.textContent = total;

}

scoreForm.addEventListener('input', recompute);
recompute();