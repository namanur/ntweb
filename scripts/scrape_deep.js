const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 🎯 CONFIGURATION
const TARGET_URL = 'https://rajkotwholesale.in/ali/';
const OUTPUT_DIR = path.join(__dirname, '../downloaded_catalog');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                   .on('error', reject)
                   .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Status: ${res.statusCode}`));
            }
        });
    });
};

(async () => {
    console.log("🚀 Launching Deep Scraper...");
    const browser = await puppeteer.launch({ 
        headless: "new",
        defaultViewport: { width: 1366, height: 768 } 
    });
    const page = await browser.newPage();

    console.log(`🌐 Visiting ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 90000 });

    // --- 1. ROBUST INFINITE SCROLL ---
    console.log("📜 Starting Deep Scroll (This may take 2-3 minutes)...");
    
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let retries = 0;
            const distance = 400; // Scroll by roughly one product height

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                // Check if we hit the bottom
                if ((window.innerHeight + window.scrollY) >= scrollHeight - 100) {
                    retries++;
                    // Only stop if we've been at the bottom for 20 attempts (2 seconds) without new content
                    if (retries > 20) { 
                        clearInterval(timer);
                        resolve();
                    }
                } else {
                    retries = 0; // Reset retries if we are still moving
                }
            }, 100);
        });
    });

    // Final wait to ensure the very last batch renders
    console.log("⏳ Finalizing render...");
    await new Promise(r => setTimeout(r, 5000));

    // --- 2. EXTRACT DATA ---
    console.log("🔍 Extracting products...");
    
    const products = await page.evaluate(() => {
        const items = [];
        // Select all potential product containers
        const cards = document.querySelectorAll('div, a, li'); 

        cards.forEach(card => {
            // Must have an image and text to be a product
            const imgEl = card.querySelector('img');
            const text = card.innerText;
            
            if (!imgEl || !text || text.length < 5) return;

            // Strict SKU Match: "M" followed by 3 to 6 digits (e.g. M02135, M101)
            const skuMatch = text.match(/(M\d{3,6})/i);
            const sku = skuMatch ? skuMatch[0].toUpperCase() : null;

            // Price Match: ₹ symbol followed by numbers
            const priceMatch = text.match(/₹\s?([\d,]+\.?\d*)/);
            const price = priceMatch ? priceMatch[1].replace(/,/g, '') : "0";

            let imgSrc = imgEl.src || imgEl.getAttribute('data-src');

            // Only add if we found a valid SKU and it looks like a product image
            if (sku && imgSrc && !imgSrc.includes('icon') && !imgSrc.includes('logo')) {
                // Avoid duplicates
                if (!items.find(i => i.sku === sku)) {
                    // Clean Name: Take the first line of text that isn't the SKU or Price
                    const lines = text.split('\n').filter(l => !l.includes(sku) && !l.includes('₹') && l.length > 3);
                    const name = lines[0] || "Unknown Item";
                    
                    items.push({ sku, name, price, imgSrc });
                }
            }
        });
        return items;
    });

    console.log(`🎉 Found ${products.length} unique products!`);

    // --- 3. SAVE CSV ---
    const csvContent = "Item Code,Item Name,Standard Rate,Image Name\n" + 
        products.map(p => `${p.sku},"${p.name.replace(/"/g, '""')}",${p.price},${p.sku}.jpg`).join("\n");
    
    fs.writeFileSync(path.join(OUTPUT_DIR, 'deep_scraped_products.csv'), csvContent);
    console.log("💾 Saved catalog data.");

    // --- 4. DOWNLOAD IMAGES ---
    console.log("⬇️  Downloading images...");
    let success = 0;
    
    // Download in chunks to be nice to their server
    const CHUNK_SIZE = 10;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
        const chunk = products.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (p) => {
            const filepath = path.join(IMAGES_DIR, `${p.sku}.jpg`);
            try {
                await downloadImage(p.imgSrc, filepath);
                success++;
                process.stdout.write(".");
            } catch (e) {
                // Silent fail
            }
        }));
    }

    console.log(`\n\n✅ Success! Downloaded ${success} images.`);
    console.log(`📂 Check folder: downloaded_catalog/images/`);
    
    await browser.close();
})();