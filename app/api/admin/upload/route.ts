import { NextRequest, NextResponse } from 'next/server';
import busboy, { FileInfo } from 'busboy';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Force dynamic to prevent static optimization issues with streams
export const dynamic = 'force-dynamic';

const MAX_SIZE_ORIGINAL = 20 * 1024 * 1024; // 20MB
const MAX_SIZE_OPTIMIZED = 500 * 1024;      // 500KB strict limit

import { getSession } from '@/lib/auth';
import { validateImageSignature } from '@/lib/file-validation';

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
        return NextResponse.json({ message: 'Invalid Content-Type' }, { status: 400 });
    }

    const bb = busboy({ headers: { 'content-type': contentType } });

    const uploadPromises: Promise<void>[] = [];
    const validFields: Record<string, string> = {};

    return new Promise<NextResponse>((resolve) => {
        let errorSent = false;
        const sendError = (msg: string, status = 400) => {
            if (errorSent) return;
            errorSent = true;
            resolve(NextResponse.json({ message: msg }, { status }));
        };

        bb.on('file', (name: string, stream: Readable, info: FileInfo) => {
            const { filename, mimeType } = info;

            // Determine target path and constraints
            let targetDir = '';
            let maxSize = 0;

            if (name === 'file_original') {
                targetDir = path.join(process.cwd(), 'public/images/yarp/originals');
                maxSize = MAX_SIZE_ORIGINAL;
            } else if (name === 'file_optimized') {
                targetDir = path.join(process.cwd(), 'public/images/yarp/optimized');
                maxSize = MAX_SIZE_OPTIMIZED;
            } else {
                // Unknown field, drain stream and ignore
                stream.resume();
                return;
            }

            // Security: Sanitize filename (basename only)
            const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9.\-_]/g, '');
            if (!safeFilename || safeFilename.startsWith('.')) {
                sendError('Invalid filename');
                stream.resume();
                return;
            }

            const savePath = path.join(targetDir, safeFilename);
            const writeStream = fs.createWriteStream(savePath);

            // Track size for this file
            let bytesRead = 0;
            let isValidated = false;

            const filePromise = new Promise<void>((fileResolve, fileReject) => {
                stream.on('data', async (chunk) => {
                    if (errorSent) return;

                    // Validate Magic Bytes on first chunk
                    if (!isValidated) {
                        const { isValid, mime } = await validateImageSignature(chunk);
                        if (!isValid) {
                            sendError(`Security Error: File masquerading content type. Please upload a valid image (JPEG, PNG, WEBP).`);
                            stream.resume();
                            writeStream.destroy();
                            fs.unlink(savePath, () => { });
                            return;
                        }
                        isValidated = true;
                    }

                    bytesRead += chunk.length;
                    if (bytesRead > maxSize) {
                        sendError(`File ${name} exceeds limit of ${maxSize / 1024}KB`);
                        stream.resume(); // Drain
                        writeStream.destroy();
                        fs.unlink(savePath, () => { }); // Cleanup partial
                    } else {
                        writeStream.write(chunk);
                    }
                });

                stream.on('end', () => {
                    writeStream.end();
                    if (!errorSent) fileResolve();
                });

                stream.on('error', (err) => {
                    console.error('Stream error', err);
                    if (!errorSent) {
                        sendError('Stream failure');
                        writeStream.destroy();
                        fs.unlink(savePath, () => { });
                    }
                });
            });

            uploadPromises.push(filePromise);
        });

        bb.on('field', (name, val) => {
            if (name === 'item_code') validFields[name] = val;
        });

        bb.on('close', async () => {
            if (errorSent) return;
            try {
                await Promise.all(uploadPromises);

                // Phase 5: ERPNext Integration - DECOUPLED
                // We do NOT sync here anymore. We just verify the file hit the disk.

                // Optional: We can assert that the file saved matches item_code if enforced
                // But for now, just success.
                // The client ImageUploader handles the naming (append 'file_optimized' with specific name).

                resolve(NextResponse.json({ success: true, fields: validFields }));
            } catch (err: any) {
                console.error('Upload Error:', err);
                resolve(NextResponse.json({ message: 'Upload processing failed: ' + err.message }, { status: 500 }));
            }
        });

        bb.on('error', (err: any) => {
            sendError(`Busboy error: ${err.message}`, 500);
        });

        // Pipe the request body to busboy
        // Next.js standard ReadableStream -> Node stream
        // @ts-ignore
        Readable.fromWeb(req.body).pipe(bb);
    });
}
