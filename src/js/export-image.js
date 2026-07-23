// Wrap the whole SVG-to-PNG pipeline.
export function svgToPngBlob(svgMarkup, pixelWidth, pixelHeight) {
	const sized = svgMarkup.replace('<svg ', `<svg width="${pixelWidth}" height="${pixelHeight}" `);

    return new Promise((resolve, reject) => {
        const svgBlob = new Blob([sized], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const image = new Image();

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;

            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pixelWidth, pixelHeight);
            ctx.drawImage(image, 0, 0, pixelWidth, pixelHeight);

            URL.revokeObjectURL(url);

            canvas.toBlob((pngBlob) => {
                if (pngBlob === null) {
                    reject(new Error('PNG encoding failed'));
                } else {
                    resolve(pngBlob);
                }
            }, 'image/png');
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not rasterise the map SVG'));
        };

        image.src = url;
    });
}

// Triggers a browser download
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    // Give the browser a moment to start the download
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}