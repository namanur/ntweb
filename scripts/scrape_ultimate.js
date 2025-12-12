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

const saveProgress = (products) => {
    const csvContent = "Item Code,Item Name,Standard Rate,Image Name\n" + 
        products.map(p => `${p.sku},"${p.name.replace(/"/g, '""')}",${p.price},${p.sku}.jpg`).join("\n");
    fs.writeFileSync(path.join(OUTPUT_DIR, 'bulletproof_products.csv'), csvContent);
    console.log(`💾 Progress saved: ${products.length} items.`);
};

(async () => {
    console.log("🚀 Launching Bulletproof Scraper...");
    const browser = await puppeteer.launch({ 
        headless: "new",
        defaultViewport: { width: 1366, height: 768 }
    });
    const page = await browser.newPage();

    console.log(`🌐 Visiting ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 120000 });

    // --- 1. SAFE INFINITE SCROLL LOOP ---
    console.log("📜 Starting Safe Scroll...");
    
    let lastHeight = 0;
    let sameHeightCount = 0;
    let products = [];

    // Loop for a maximum of 5 minutes or until end
    for (let i = 0; i < 300; i++) { 
        try {
            // 1. Scroll Down
            const currentHeight = await page.evaluate(() => {
                window.scrollBy(0, 800);
                return document.body.scrollHeight;
            });

            // 2. Wait for load
            await new Promise(r => setTimeout(r, 1500)); // Wait 1.5s

            // 3. Extract items visible so far (Incremental Scraping)
            const newItems = await page.evaluate(() => {
                const found = [];
                const cards = document.querySelectorAll('div, li, tr'); 
                
                cards.forEach(card => {
                    const text = card.innerText;
                    if (!text || text.length < 5) return;

                    // SKU Match (M + Digits)
                    const skuMatch = text.match(/([M]\d{3,6})/i);
                    const sku = skuMatch ? skuMatch[0].toUpperCase() : null;

                    // Price Match
                    const priceMatch = text.match(/(?:₹|Rs\.?)\s?([\d,]+\.?\d*)/);
                    const price = priceMatch ? priceMatch[1].replace(/,/g, '') : "0";

                    const imgEl = card.querySelector('img');
                    let imgSrc = imgEl ? (imgEl.src || imgEl.getAttribute('data-src')) : null;

                    if (sku && imgSrc && !imgSrc.includes('icon') && !imgSrc.includes('logo')) {
                        // Rough name extraction
                        const lines = text.split('\n').filter(l => !l.includes(sku) && !l.includes('₹') && l.length > 3);
                        const name = lines[0] || sku;
                        found.push({ sku, name, price, imgSrc });
                    }
                });
                return found;
            });

            // Merge new items
            newItems.forEach(item => {
                if (!products.find(p => p.sku === item.sku)) {
                    products.push(item);
                }
            });

            // Log progress
            process.stdout.write(`\r🔄 Scroll ${i+1}: Found ${products.length} unique items...`);

            // 4. Check if we are stuck
            if (currentHeight === lastHeight) {
                sameHeightCount++;
                
                // If stuck for 5 attempts, try to find a button
                if (sameHeightCount > 5) {
                    const clicked = await page.evaluate(() => {
                        const btns = Array.from(document.querySelectorAll('button'));
                        const loadMore = btns.find(b => b.innerText.toLowerCase().includes('load') || b.innerText.toLowerCase().includes('more'));
                        if (loadMore) {
                            loadMore.click();
                            return true;
                        }
                        return false;
                    });

                    if (clicked) {
                        console.log("\n👆 Clicked 'Load More'...");
                        sameHeightCount = 0; // Reset
                        await new Promise(r => setTimeout(r, 3000)); // Wait longer for click load
                    } else if (sameHeightCount > 10) {
                        console.log("\n🛑 Reached bottom or stuck. Stopping scroll.");
                        break;
                    }
                }
            } else {
                sameHeightCount = 0;
            }

            lastHeight = currentHeight;

            // Save backup every 50 iterations
            if (i % 50 === 0 && i > 0) saveProgress(products);

        } catch (e) {
            console.log(`\n⚠️ Glitch during scroll: ${e.message}. Continuing...`);
        }
    }

    console.log(`\n🎉 Scraping finished. Total found: ${products.length}`);
    saveProgress(products); // Final Save

    // --- 2. DOWNLOAD IMAGES ---
    console.log("⬇️  Downloading images...");
    let success = 0;
    const CHUNK_SIZE = 10;
    
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
        const chunk = products.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (p) => {
            const filepath = path.join(IMAGES_DIR, `${p.sku}.jpg`);
            if (!fs.existsSync(filepath)) {
                try {
                    await downloadImage(p.imgSrc, filepath);
                    success++;
                    process.stdout.write(".");
                } catch (e) {}
            }
        }));
    }

    console.log(`\n\n✅ Done! Downloaded ${success} images.`);
    await browser.close();
})();