import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates the file content by sniffing magic bytes.
 * @param buffer First chunk of the file (needs to be large enough, e.g. 4100 bytes)
 */
export async function validateImageSignature(chunk: Buffer) {
    // We only need the first few bytes, but file-type prefers a bit more context.
    // The chunk from busboy is usually 64kb, which is plenty.

    // Note: file-type might return undefined for very small chunks or unknown types
    const type = await fileTypeFromBuffer(chunk);

    if (!type) {
        return { isValid: false, mime: null };
    }

    if (!ALLOWED_MIMES.includes(type.mime)) {
        return { isValid: false, mime: type.mime };
    }

    return { isValid: true, mime: type.mime };
}
