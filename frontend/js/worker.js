function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

function interpolateColor(startColor, endColor, factor) {
    const [r1, g1, b1] = startColor;
    const [r2, g2, b2] = endColor;

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return [r, g, b];
}

self.onmessage = function (e) {
    const { xMin, xMax, yMin, yMax, maxIterations, width, height, colorScheme, startRow, chunkHeight, fractalType, cRe, cIm, startColor, endColor } = e.data;
    const localPixels = new Uint8ClampedArray(width * chunkHeight * 4);
    const rangeX = xMax - xMin;
    const rangeY = yMax - yMin;
    const startRGB = startColor ? hexToRgb(startColor) : null;
    const endRGB = endColor ? hexToRgb(endColor) : null;

    function getColor(iteration, maxIterations, startColor, endColor) {
        const ratio = iteration / maxIterations;

        const getColorForScheme = (r, g, b) => {
            return [r, g, b];
        };

        switch (colorScheme) {
            case 'grayscale':
                const gray = iteration === maxIterations ? 0 : 255 - Math.floor(255 * ratio);
                return getColorForScheme(gray, gray, gray);
            case 'rainbow':
                return getColorForScheme(
                    Math.floor(255 * Math.sin(ratio * Math.PI)),
                    Math.floor(255 * Math.sin(ratio * Math.PI + 2 * Math.PI / 3)),
                    Math.floor(255 * Math.sin(ratio * Math.PI + 4 * Math.PI / 3))
                );
            case 'blue-yellow':
                return getColorForScheme(
                    Math.floor(255 * ratio),
                    Math.floor(255 * ratio),
                    Math.floor(255 * (1 - ratio))
                );
            case 'fire':
                return getColorForScheme(Math.floor(255 * ratio), Math.floor(128 * ratio), Math.floor(64 * (1 - ratio)));
            case 'cool':
                return getColorForScheme(Math.floor(64 * (1 - ratio)), Math.floor(128 * ratio), Math.floor(255 * ratio));
            case 'pastel':
                return getColorForScheme(
                    Math.floor(255 * (0.5 + 0.5 * ratio)),
                    Math.floor(255 * (0.5 + 0.5 * (1 - ratio))),
                    Math.floor(255 * 0.8)
                );
            case 'custom':
                return interpolateColor(startColor, endColor, ratio);
            default:
                return [0, 0, 0];
        }
    }

    for (let py = startRow; py < startRow + chunkHeight; py++) {
        for (let px = 0; px < width; px++) {
            const x0 = xMin + (px / width) * rangeX;
            const y0 = yMin + (py / height) * rangeY;
            let x = x0, y = y0, iteration = 0;

            let magnitudeSquared = 0;

            if (fractalType === 'mandelbrot') {
                // Mandelbrot set calculation
                while (magnitudeSquared <= 4 && iteration < maxIterations) {
                    const xTemp = x * x - y * y + x0;
                    y = 2 * x * y + y0;
                    x = xTemp;

                    magnitudeSquared = x * x + y * y;
                    iteration++;
                }
            } else if (fractalType === 'julia') {
                // Julia set calculation
                while (magnitudeSquared <= 4 && iteration < maxIterations) {
                    const xTemp = x * x - y * y + cRe;
                    y = 2 * x * y + cIm;
                    x = xTemp;

                    magnitudeSquared = x * x + y * y;
                    iteration++;
                }
            } else if (fractalType === 'burningShip') {
                // Burning Ship fractal calculation
                while (magnitudeSquared <= 4 && iteration < maxIterations) {
                    const xTemp = x * x - y * y + x0;
                    y = Math.abs(2 * x * y) + y0;
                    x = Math.abs(xTemp);

                    magnitudeSquared = x * x + y * y;
                    iteration++;
                }
            }

            const [r, g, b] = getColor(iteration, maxIterations, startRGB, endRGB);
            const index = 4 * ((py - startRow) * width + px);
            localPixels[index] = r;
            localPixels[index + 1] = g;
            localPixels[index + 2] = b;
            localPixels[index + 3] = 255;
        }
    }

    self.postMessage({ chunkPixels: localPixels, startRow });
};
