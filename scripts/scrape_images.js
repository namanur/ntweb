const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// 🎯 CONFIGURATION
const TARGET_URL = 'https://rajkotwholesale.in/ali/';
const OUTPUT_FOLDER = path.join(__dirname, '../downloaded_images');

// Ensure download directory exists
if (!fs.existsSync(OUTPUT_FOLDER)){
    fs.mkdirSync(OUTPUT_FOLDER);
}

const downloadImage = async (url, filename) => {
    try {
        const filePath = path.join(OUTPUT_FOLDER, filename);
        const writer = fs.createWriteStream(filePath);

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            // Fake a browser user agent to avoid getting blocked
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } 
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (e) {
        console.log(`⚠️ Failed to download: ${filename} (${e.message})`);
    }
};

const scrape = async () => {
    console.log(`🚀 Visiting ${TARGET_URL}...`);
    
    try {
        const { data } = await axios.get(TARGET_URL);
        const $ = cheerio.load(data);
        const images = [];

        // Find all images
        $('img').each((i, el) => {
            let src = $(el).attr('src');
            if (src) {
                // Handle relative URLs (e.g., "product.jpg" -> "https://site.com/product.jpg")
                if (!src.startsWith('http')) {
                    // Remove leading slash if present to avoid double slashes
                    const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
                    // Construct absolute URL based on the target URL
                    // Note: If the target URL is a folder, we append. If it's a page, we might need the base.
                    // For 'https://rajkotwholesale.in/ali/', we treat it as the base.
                    src = new URL(cleanSrc, TARGET_URL).href; 
                }
                
                // Filter out small icons or irrelevant SVGs if needed
                if (!src.endsWith('.svg') && !src.includes('icon')) {
                    images.push(src);
                }
            }
        });

        console.log(`📸 Found ${images.length} images. Starting download...`);

        let count = 0;
        for (const imgUrl of images) {
            // Get a clean filename (e.g., "pressure_cooker.jpg")
            const filename = path.basename(imgUrl) || `image_${count}.jpg`;
            
            // Avoid duplicate names
            const safeFilename = fs.existsSync(path.join(OUTPUT_FOLDER, filename)) 
                ? `copy_${Date.now()}_${filename}` 
                : filename;

            process.stdout.write(`   ⬇️ Downloading (${count + 1}/${images.length}): ${safeFilename}... `);
            
            await downloadImage(imgUrl, safeFilename);
            console.log("✅");
            count++;
        }

        console.log(`\n🎉 Done! Check the folder: /downloaded_images`);

    } catch (error) {
        console.error("❌ Error scraping:", error.message);
    }
};

scrape();