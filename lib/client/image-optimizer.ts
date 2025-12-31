/**
 * Client-Side Image Optimization
 * Handles resizing and WebP conversion in the browser.
 */

interface ImageOptimizationResult {
    original: File;
    optimized: Blob;
    previewUrl: string;
    cleanup?: () => void;
}

const MAX_WIDTH = 1200;
const QUALITY = 0.8;

export async function processImage(file: File): Promise<ImageOptimizationResult> {
    // Validate input
    if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type');
    };

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if needed
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Draw image to canvas (perform resize)
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to WebP
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('WebP conversion failed'));
                            return;
                        }

                        const previewUrl = URL.createObjectURL(blob);
                        resolve({
                            original: file,
                            optimized: blob,
                            previewUrl,
                            cleanup: () => URL.revokeObjectURL(previewUrl), // Cleanup function
                        });
                    },
                    'image/webp',
                    QUALITY
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}
