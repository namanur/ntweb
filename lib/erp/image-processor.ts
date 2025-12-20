/**
 * Image processing module
 * Handles image download, optimization, and storage
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { ERPAttachment } from './types';
import { ERPFetcher } from './fetcher';

export class ImageProcessor {
    private fetcher: ERPFetcher;
    private outputDir: string;
    private quality: number;
    private maxWidth: number;

    constructor(
        fetcher: ERPFetcher,
        outputDir: string,
        quality: number = 80,
        maxWidth: number = 1200
    ) {
        this.fetcher = fetcher;
        this.outputDir = outputDir;
        this.quality = quality;
        this.maxWidth = maxWidth;

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    }

    /**
     * Process all images for an item
     * Downloads, optimizes, and saves images
     * Returns array of public URLs
     */
    async processItemImages(
        itemCode: string,
        attachments: ERPAttachment[]
    ): Promise<string[]> {
        if (attachments.length === 0) {
            return [];
        }

        const publicUrls: string[] = [];

        for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];

            try {
                // Download image
                const imageBuffer = await this.fetcher.downloadImage(attachment.file_url);

                // Generate deterministic filename
                const filename = this.generateFilename(itemCode, i);
                const outputPath = path.join(this.outputDir, filename);

                // Optimize and convert to WebP
                await this.optimizeImage(imageBuffer, outputPath);

                // Generate public URL
                const publicUrl = `/images/items/${filename}`;
                publicUrls.push(publicUrl);

            } catch (error: any) {
                console.warn(`⚠️  Failed to process image ${i} for ${itemCode}:`, error.message);
            }
        }

        return publicUrls;
    }

    /**
     * Optimize image and convert to WebP
     */
    private async optimizeImage(inputBuffer: Buffer, outputPath: string): Promise<void> {
        try {
            await sharp(inputBuffer)
                .resize(this.maxWidth, null, {
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .webp({ quality: this.quality })
                .toFile(outputPath);
        } catch (error: any) {
            throw new Error(`Image optimization failed: ${error.message}`);
        }
    }

    /**
     * Generate deterministic filename based on item code
     * Format: ITEM-CODE.webp or ITEM-CODE-1.webp, ITEM-CODE-2.webp, etc.
     */
    private generateFilename(itemCode: string, index: number): string {
        const sanitized = itemCode.replace(/[^a-zA-Z0-9-_]/g, '-');
        if (index === 0) {
            return `${sanitized}.webp`;
        }
        return `${sanitized}-${index}.webp`;
    }

    /**
     * Clean up old images that are no longer in the catalog
     */
    async cleanupOldImages(currentItemCodes: Set<string>): Promise<number> {
        let deletedCount = 0;

        try {
            const files = fs.readdirSync(this.outputDir);

            for (const file of files) {
                if (!file.endsWith('.webp')) continue;

                // Extract item code from filename
                const itemCode = file.replace(/(-\d+)?\.webp$/, '');

                if (!currentItemCodes.has(itemCode)) {
                    const filePath = path.join(this.outputDir, file);
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }

            if (deletedCount > 0) {
                console.log(`🗑️  Cleaned up ${deletedCount} old images`);
            }
        } catch (error: any) {
            console.warn('⚠️  Failed to cleanup old images:', error.message);
        }

        return deletedCount;
    }

    /**
     * Get statistics about processed images
     */
    getImageStats(): { totalSize: number; count: number } {
        let totalSize = 0;
        let count = 0;

        try {
            const files = fs.readdirSync(this.outputDir);

            for (const file of files) {
                if (!file.endsWith('.webp')) continue;

                const filePath = path.join(this.outputDir, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
                count++;
            }
        } catch (error: any) {
            console.warn('⚠️  Failed to get image stats:', error.message);
        }

        return { totalSize, count };
    }
}
