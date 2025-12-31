
/**
 * Simple magic number validation for common image formats.
 * Prevents file masquerading (e.g. .sh file renamed to .jpg)
 */

export async function validateImageSignature(buffer: Buffer): Promise<{ isValid: boolean; mime?: string }> {
    if (!buffer || buffer.length < 4) {
        return { isValid: false };
    }

    const hex = buffer.toString('hex', 0, 12).toUpperCase();

    // JPEG: FF D8 FF
    if (hex.startsWith('FFD8FF')) {
        return { isValid: true, mime: 'image/jpeg' };
    }

    // PNG: 89 50 4E 47
    if (hex.startsWith('89504E47')) {
        return { isValid: true, mime: 'image/png' };
    }

    // WebP: RIFF .... WEBP
    // Bytes 0-3: 52 49 46 46 (RIFF)
    // Bytes 8-11: 57 45 42 50 (WEBP)
    if (hex.startsWith('52494646') && buffer.length >= 12 && hex.slice(16, 24) === '57454250') {
        return { isValid: true, mime: 'image/webp' };
    }

    // GIF: 47 49 46 38 (GIF8)
    if (hex.startsWith('47494638')) {
        return { isValid: true, mime: 'image/gif' };
    }

    return { isValid: false };
}
