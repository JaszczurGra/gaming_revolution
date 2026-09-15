/**
 * Compresses an image file or base64 data url using HTML5 Canvas API.
 * Constrains max width/height to 1920px, reducing quality to ensure the payload is under 2MB.
 */
export async function compressImage(
  fileOrBase64: File | string,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D context from canvas'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to base64 with a safe JPEG quality setting
        let compressedBase64 = canvas.toDataURL('image/jpeg', quality);

        // If the base64 string is still over 2MB (approx 2 * 1.33 = 2.66 million chars), compress further
        let currentQuality = quality;
        while (compressedBase64.length > 2 * 1024 * 1024 && currentQuality > 0.1) {
          currentQuality -= 0.15;
          compressedBase64 = canvas.toDataURL('image/jpeg', currentQuality);
        }

        resolve(compressedBase64);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    }
  });
}
