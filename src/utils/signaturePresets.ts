/**
 * Utility helpers for signature image processing
 */

/**
 * Filter out white/near-white background from uploaded signature image
 * to turn it into a transparent PNG data URL.
 */
export async function makeSignatureBackgroundTransparent(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Detect background: if RGB are all high (> 215), make transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If it's near white/light grey
        if (r > 215 && g > 215 && b > 215) {
          data[i + 3] = 0; // set alpha to 0 (transparent)
        } else {
          // If it's dark ink, boost contrast slightly for crisp printing
          const brightness = (r + g + b) / 3;
          if (brightness < 120) {
            data[i] = Math.max(0, r - 30);
            data[i + 1] = Math.max(0, g - 30);
            data[i + 2] = Math.max(0, b - 30);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
