//API
const API_URL = '/api/fractals';

// canvas
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');

// Overall settings
const iterationsInput = document.getElementById('iterations');
const iterationsValue = document.getElementById('iterationsValue');
const colorSchemeSelect = document.getElementById('colorScheme');
const resetButton = document.getElementById('resetView');
const fractalTypeSelect = document.getElementById('fractalType');

// Julia settings
const resetJuliaParamsButton = document.getElementById('resetJuliaParams');
const juliaSettings = document.getElementById('juliaSettings');
const cReInput = document.getElementById('cRe');
const cImInput = document.getElementById('cIm');

// Zoom settings
const zoomFactorInput = document.getElementById('zoomFactor');
const zoomFactorValue = document.getElementById('zoomFactorValue');
const zoomAnimationButton = document.getElementById('zoomAnimation');

let zoomFactor = parseFloat(zoomFactorInput.value);
let zoomInterval = 100;
let isAnimatingZoom = false;
let animationInterval = null;

// Save settings
const saveFractalButton = document.getElementById('saveFractal');
const savedFractalsList = document.getElementById('savedFractals');

// Track custom colors
const customColorInputs = document.getElementById('customColorInputs');
const startColorInput = document.getElementById('startColor');
const endColorInput = document.getElementById('endColor');

// Initial settings
let maxIterations = parseInt(iterationsInput.value);
let colorScheme = colorSchemeSelect.value;
let fractalType = fractalTypeSelect.value;
let renderingInProgress = false;
let xMin = -2.5, xMax = 1;
let yMin = -1, yMax = 1;
let cRe = -0.8, cIm = 0.156;

// Canvas dimensions
const width = canvas.width;
const height = canvas.height;

// Fractal settings
const initialSettings = {
    mandelbrot: {
        xMin: -2.5,
        xMax: 1,
        yMin: -1,
        yMax: 1,
    },
    julia: {
        xMin: -1.5,
        xMax: 1.5,
        yMin: -1.5,
        yMax: 1.5,
        cRe: parseFloat(cReInput.value),
        cIm: parseFloat(cImInput.value),
    },
    burningShip: {
        xMin: -2,
        xMax: 1.5,
        yMin: -2.5,
        yMax: 1,
    },
};

// Mouse tracking variables
let isDragging = false;
let startDragX = 0, startDragY = 0;
let dragTimeout = null;
const throttleTime = 100;

// Number of workers for parallelization
const numWorkers = 6;
let workers = [];
let completedWorkers = 0;

// Temporary pixel data buffer for double-buffering
let bufferPixels = new Uint8ClampedArray(width * height * 4);
let pixels = new Uint8ClampedArray(width * height * 4);

// Function to terminate all workers and reset the pool
function terminateWorkers() {
    workers.forEach(worker => worker.terminate());
    workers = [];
    completedWorkers = 0;
}

function createWorkers() {
    terminateWorkers();
    for (let i = 0; i < numWorkers; i++) {
        const worker = new Worker('./js/worker.js');
        workers.push(worker);

        worker.onmessage = function (e) {
            const { chunkPixels, startRow } = e.data;
            if (chunkPixels && chunkPixels.length) {
                for (let py = 0; py < chunkPixels.length / (width * 4); py++) {
                    for (let px = 0; px < width; px++) {
                        const index = 4 * ((startRow + py) * width + px);
                        bufferPixels[index] = chunkPixels[4 * (py * width + px)]; // Red
                        bufferPixels[index + 1] = chunkPixels[4 * (py * width + px) + 1]; // Green
                        bufferPixels[index + 2] = chunkPixels[4 * (py * width + px) + 2]; // Blue
                        bufferPixels[index + 3] = 255; // Alpha
                    }
                }

                completedWorkers++;

                if (completedWorkers === numWorkers) {
                    pixels.set(bufferPixels);
                    redrawCanvas();
                }
            }
        };
    }
}

function redrawCanvas() {
    if (!renderingInProgress) {
        renderingInProgress = true;
        requestAnimationFrame(() => {
            ctx.clearRect(0, 0, width, height);
            const imageData = new ImageData(pixels, width, height);
            ctx.putImageData(imageData, 0, 0);
            renderingInProgress = false;
        });
    }
}

function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = new Date().getTime();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
}

function drawFractal() {
    const chunkHeight = Math.floor(height / numWorkers);
    const selectedColorScheme = colorSchemeSelect.value;

    completedWorkers = 0;
    bufferPixels = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < numWorkers; i++) {
        const startRow = i * chunkHeight;
        const imageData = {
            xMin, xMax, yMin, yMax, maxIterations, width, height,
            colorScheme: selectedColorScheme,
            startRow, chunkHeight, fractalType, cRe, cIm
        };

        if (selectedColorScheme === 'custom') {
            imageData.startColor = startColorInput.value;
            imageData.endColor = endColorInput.value;
        }

        workers[i].postMessage(imageData);
    }
}

const throttledDrawFractal = throttle(drawFractal, 100);

function changeSettings() {
    fractalType = fractalTypeSelect.value;
    colorScheme = colorSchemeSelect.value = 'grayscale';
    customColorInputs.style.display = 'none';
    juliaSettings.style.display = 'none';

    if (fractalType === 'mandelbrot') {
        xMin = initialSettings.mandelbrot.xMin;
        xMax = initialSettings.mandelbrot.xMax;
        yMin = initialSettings.mandelbrot.yMin;
        yMax = initialSettings.mandelbrot.yMax;
        iterationsValue.textContent = iterationsInput.value = maxIterations = 300;

    } else if (fractalType === 'julia') {
        juliaSettings.style.display = 'block';
        xMin = initialSettings.julia.xMin;
        xMax = initialSettings.julia.xMax;
        yMin = initialSettings.julia.yMin;
        yMax = initialSettings.julia.yMax;
        iterationsValue.textContent = iterationsInput.value = maxIterations = 300;

    } else if (fractalType === 'burningShip') {
        xMin = initialSettings.burningShip.xMin;
        xMax = initialSettings.burningShip.xMax;
        yMin = initialSettings.burningShip.yMin;
        yMax = initialSettings.burningShip.yMax;
        colorScheme = colorSchemeSelect.value = 'fire';
        iterationsValue.textContent = iterationsInput.value = maxIterations = 90;
    }
}

function zoomAnimation() {
    const rangeX = xMax - xMin;
    const rangeY = yMax - yMin;

    const zoomX = xMin + (canvas.width / 2) * rangeX / width;
    const zoomY = yMin + (canvas.height / 2) * rangeY / height;

    xMin = zoomX - (zoomX - xMin) / zoomFactor;
    xMax = zoomX + (xMax - zoomX) / zoomFactor;
    yMin = zoomY - (zoomY - yMin) / zoomFactor;
    yMax = zoomY + (yMax - zoomY) / zoomFactor;

    drawFractal();
}

function startZoomAnimation() {
    if (isAnimatingZoom) return;

    isAnimatingZoom = true;
    animationInterval = setInterval(() => {
        zoomAnimation();
    }, zoomInterval);

    zoomAnimationButton.textContent = 'Stop Zoom Animation';
}

function stopZoomAnimation() {
    clearInterval(animationInterval);
    isAnimatingZoom = false;
    zoomAnimationButton.textContent = 'Start Zoom Animation';
}

async function fetchAndRenderSavedFractals() {
    try {
        const response = await fetch(`${API_URL}/user`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch saved fractals');
        }

        const fractals = await response.json();
        renderSavedFractals(fractals);
    } catch (error) {
        console.error('Error fetching saved fractals:', error);
    }
}

function renderSavedFractals(fractals) {
    savedFractalsList.innerHTML = '';
    fractals.forEach((fractal) => {
        const li = document.createElement('li');

        let listItemContent = `${fractal.fractalType} (${fractal.params.colorScheme})`;

        if (fractal.params.colorScheme === 'custom') {
            const startColorText = `<span style="color: ${fractal.params.startColor}">Start: ${fractal.params.startColor}</span>`;
            const endColorText = `<span style="color: ${fractal.params.endColor}">End: ${fractal.params.endColor}</span>`;
            const finalColorText = `<span> [${startColorText}, ${endColorText}]</span>` 

            listItemContent += finalColorText;
        }

        if (fractal.fractalType === 'julia') {
            listItemContent += ` [cRe: ${fractal.params.cRe}, cIm: ${fractal.params.cIm}]`;
        }

        li.innerHTML = listItemContent;

        const loadButton = document.createElement('button');
        loadButton.textContent = 'Load';
        loadButton.addEventListener('click', () => loadFractal(fractal));
        li.appendChild(loadButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-button');
        deleteButton.style.backgroundColor = '#d63718';
        deleteButton.onclick = () => deleteFractal(fractal._id);
        li.appendChild(deleteButton);

        savedFractalsList.appendChild(li);
    });
}

async function saveFractal() {
    const fractalType = document.getElementById('fractalType').value;
    const maxIterations = parseInt(document.getElementById('iterations').value, 10);
    const colorScheme = document.getElementById('colorScheme').value;

    const startColor = colorScheme === 'custom' ? document.getElementById('startColor').value : null;
    const endColor = colorScheme === 'custom' ? document.getElementById('endColor').value : null;

    const cRe = fractalType === 'julia' ? parseFloat(document.getElementById('cRe').value) : null;
    const cIm = fractalType === 'julia' ? parseFloat(document.getElementById('cIm').value) : null;

    const fractalData = {
        fractalType,
        params: { xMin, xMax, yMin, yMax, maxIterations, colorScheme, startColor, endColor, cRe, cIm },
    };

    try {
        const response = await fetch(`${API_URL}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(fractalData),
        });

        if (!response.ok) {
            throw new Error('Failed to save fractal');
        }

        fetchAndRenderSavedFractals(); 
    } catch (error) {
        console.error('Error saving fractal:', error);
        alert('Failed to save fractal');
    }
}

async function deleteFractal(fractalId) {
    try {
        const response = await fetch(`${API_URL}/${fractalId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete fractal');
        }

        fetchAndRenderSavedFractals();
    } catch (error) {
        console.error('Error deleting fractal:', error);
        alert('Failed to delete fractal');
    }
}

function loadFractal(fractal) {
    fractalType = document.getElementById('fractalType').value = fractal.fractalType;
    xMin = fractal.params.xMin;
    xMax = fractal.params.xMax;
    yMin = fractal.params.yMin;
    yMax = fractal.params.yMax;
    maxIterations = document.getElementById('iterations').value = fractal.params.maxIterations;
    iterationsValue.textContent = maxIterations;
    colorScheme = document.getElementById('colorScheme').value = fractal.params.colorScheme;

    if (fractal.params.colorScheme === 'custom') {
        document.getElementById('startColor').value = fractal.params.startColor || '#0000FF';
        document.getElementById('endColor').value = fractal.params.endColor || '#FF0000';
        document.getElementById('customColorInputs').style.display = 'block';
    } else {
        document.getElementById('customColorInputs').style.display = 'none';
    }

    if (fractal.fractalType === 'julia') {
        cRe = document.getElementById('cRe').value = fractal.params.cRe || -0.8;
        cIm = document.getElementById('cIm').value = fractal.params.cIm || 0.156;
        document.getElementById('juliaSettings').style.display = 'block';
    } else {
        document.getElementById('juliaSettings').style.display = 'none';
    }
    
    drawFractal();
}

function resetView() {
    changeSettings();
    drawFractal();
}

// Event listeners
fractalTypeSelect.addEventListener('change', () => {
    changeSettings();
    createWorkers();
    drawFractal();
});

cReInput.addEventListener('input', () => {
    cRe = parseFloat(cReInput.value);
    drawFractal();
});

cImInput.addEventListener('input', () => {
    cIm = parseFloat(cImInput.value);
    drawFractal();
});

iterationsInput.addEventListener('input', () => {
    maxIterations = parseInt(iterationsInput.value);
    iterationsValue.textContent = iterationsInput.value;
    throttledDrawFractal();
});

colorSchemeSelect.addEventListener('change', () => {
    if (colorSchemeSelect.value === 'custom') {
        customColorInputs.style.display = 'block';
    } else {
        customColorInputs.style.display = 'none';
    }
    colorScheme = colorSchemeSelect.value;
    drawFractal();
});

customColorInputs.addEventListener('input', () => {
    throttledDrawFractal();
})

canvas.addEventListener('mousedown', (event) => {
    isDragging = true;
    startDragX = event.offsetX;
    startDragY = event.offsetY;
});

zoomFactorInput.addEventListener('input', () => {
    zoomFactorValue.textContent = zoomFactorInput.value;
    zoomFactor = parseFloat(zoomFactorInput.value);
});

zoomAnimationButton.addEventListener('click', () => {
    if (isAnimatingZoom) {
        stopZoomAnimation();
    } else {
        startZoomAnimation();
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const deltaX = event.offsetX - startDragX;
        const deltaY = event.offsetY - startDragY;

        const rangeX = xMax - xMin;
        const rangeY = yMax - yMin;

        const offsetX = (deltaX / width) * rangeX;
        const offsetY = -(deltaY / height) * rangeY;

        xMin -= offsetX;
        xMax -= offsetX;
        yMin += offsetY;
        yMax += offsetY;

        startDragX = event.offsetX;
        startDragY = event.offsetY;

        throttledDrawFractal();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    clearTimeout(dragTimeout);
    dragTimeout = null;
    drawFractal();
});

canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const zoomFactor = 1.1;
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;

    const rangeX = xMax - xMin;
    const rangeY = yMax - yMin;

    const zoomX = xMin + (mouseX / width) * rangeX;
    const zoomY = yMin + (mouseY / height) * rangeY;

    if (event.deltaY < 0) { // Zoom in
        xMin = zoomX - (zoomX - xMin) / zoomFactor;
        xMax = zoomX + (xMax - zoomX) / zoomFactor;
        yMin = zoomY - (zoomY - yMin) / zoomFactor;
        yMax = zoomY + (yMax - zoomY) / zoomFactor;
    } else { // Zoom out
        xMin = zoomX - (zoomX - xMin) * zoomFactor;
        xMax = zoomX + (xMax - zoomX) * zoomFactor;
        yMin = zoomY - (zoomY - yMin) * zoomFactor;
        yMax = zoomY + (yMax - zoomY) * zoomFactor;
    }

    throttledDrawFractal();
});

resetButton.addEventListener('click', resetView);

resetJuliaParamsButton.addEventListener('click', () => {
    cReInput.value = cRe = -0.8;
    cImInput.value = cIm = 0.156;
    drawFractal();
})

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isAnimatingZoom) {
        stopZoomAnimation();
    }
});

saveFractalButton.addEventListener('click', saveFractal);

document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderSavedFractals();
});

// Initial render, worker creation
createWorkers();
drawFractal();
