const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 🎯 CONFIGURATION
const TARGET_URL = 'https://rajkotwholesale.in/ali/';
const OUTPUT_DIR = path.join(__dirname, '../downloaded_catalog');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

// Helper to download image
const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                   .on('error', reject)
                   .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
};

(async () => {
    console.log("🚀 Launching Browser...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Set viewport to simulate a desktop to get full grid
    await page.setViewport({ width: 1280, height: 800 });

    console.log(`🌐 Visiting ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // --- 1. HANDLE INFINITE SCROLL ---
    console.log("📜 Scrolling to load all products...");
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                // Stop scrolling if we haven't found new content in a while or reached bottom
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100); // Scroll every 100ms
        });
    });
    
    // Wait a bit for final lazy-loaded images to render
    await new Promise(r => setTimeout(r, 3000));

    // --- 2. EXTRACT DATA & IMAGES ---
    console.log("🔍 Extracting product data...");
    
    const products = await page.evaluate(() => {
        // This logic runs INSIDE the browser page
        const items = [];
        
        // Try to find product cards (Generic selectors based on standard grid layouts)
        // We look for containers that have both an image and text
        const cards = document.querySelectorAll('div[class*="product"], div[class*="item"], .grid > div');

        cards.forEach(card => {
            const imgEl = card.querySelector('img');
            const textContent = card.innerText;
            
            if (!imgEl || !textContent) return;

            // 🧠 INTELLIGENT PARSING based on your analysis
            
            // 1. Find SKU (Looking for pattern like M0XXXX)
            const skuMatch = textContent.match(/(M0\d{3,5})/i);
            const sku = skuMatch ? skuMatch[0].toUpperCase() : null;

            // 2. Find Price (Looking for ₹ symbol)
            const priceMatch = textContent.match(/₹\s?([\d,]+\.?\d*)/);
            const price = priceMatch ? priceMatch[1].replace(/,/g, '') : "0";

            // 3. Clean Name (Remove newlines, extra spaces)
            const lines = textContent.split('\n').filter(l => l.trim().length > 2);
            const name = lines[0] || "Unknown Item";

            // 4. Image URL
            let imgSrc = imgEl.src || imgEl.getAttribute('data-src');

            if (sku && imgSrc) {
                items.push({ sku, name, price, imgSrc });
            }
        });

        return items;
    });

    console.log(`🎉 Found ${products.length} products with SKUs!`);

    // --- 3. SAVE CSV DATA ---
    const csvContent = "Item Code,Item Name,Standard Rate,Image Name\n" + 
        products.map(p => `${p.sku},"${p.name.replace(/"/g, '""')}",${p.price},${p.sku}.jpg`).join("\n");
    
    fs.writeFileSync(path.join(OUTPUT_DIR, 'scraped_products.csv'), csvContent);
    console.log("💾 Saved data to: downloaded_catalog/scraped_products.csv");

    // --- 4. DOWNLOAD IMAGES ---
    console.log("⬇️  Downloading images...");
    
    let successCount = 0;
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const filename = `${p.sku}.jpg`;
        const filepath = path.join(IMAGES_DIR, filename);

        try {
            await downloadImage(p.imgSrc, filepath);
            process.stdout.write(`.`); // Progress dot
            successCount++;
        } catch (e) {
            console.log(`\n❌ Failed: ${filename}`);
        }
    }

    console.log(`\n\n✅ Done! Downloaded ${successCount} images to /downloaded_catalog/images/`);
    console.log("👉 You can now drag these images into your 'public/images/' folder.");

    await browser.close();
})();