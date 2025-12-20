# Quick Start Guide - ERPNext Sync

## Prerequisites

1. ERPNext instance with API access
2. API Key and Secret from ERPNext
3. Node.js and npm installed

## Setup (One-time)

### 1. Configure Environment Variables

Add to your `.env` file:

```env
# Required
ERP_NEXT_URL=https://your-erp-instance.com
ERP_API_KEY=your_api_key_here
ERP_API_SECRET=your_api_secret_here

# Optional (defaults shown)
SYNC_IMAGE_QUALITY=80
SYNC_IMAGE_MAX_WIDTH=1200
SYNC_GIT_AUTO_PUSH=true
```

### 2. Get ERPNext API Credentials

In ERPNext:
1. Go to **User** → Your Profile
2. Click **API Access**
3. Generate **API Key** and **API Secret**
4. Copy both values to your `.env` file

### 3. Verify Installation

```bash
# Check if sharp is installed
npm list sharp

# If not installed, run:
npm install
```

## Usage

### Test Configuration

Before running a full sync, test your setup:

```bash
npx tsx lib/erp/test.ts
```

Expected output:
```
🧪 Testing ERPNext Sync System

1️⃣  Checking configuration...
   ERP URL: https://your-erp.com
   API Key: ✓
   API Secret: ✓

2️⃣  Testing ERPNext connection...
   ✅ Connection successful

3️⃣  Fetching sample items...
   ✅ Fetched 1234 items

4️⃣  Testing normalization...
   Sample item: ITEM-001 - Product Name
   Normalized category: Bottle
   Normalized brand: MaxFresh
   ✅ Normalization working

5️⃣  Testing attachment fetching...
   Found 2 attachments for ITEM-001
   Sample attachment: image.jpg
   ✅ Attachment fetching working

✅ All tests passed!
```

### Run Full Sync

```bash
npm run sync
```

This will:
1. ✅ Fetch all items from ERPNext
2. ✅ Download and optimize images to WebP
3. ✅ Generate `public/catalog.json`
4. ✅ Commit and push to GitHub
5. ✅ Trigger Vercel deployment

### Sync Output

```
🚀 Starting ERPNext Sync...
   ERP URL: https://your-erp.com
   Output: /path/to/public/catalog.json
   Images: /path/to/public/images/items

📡 Step 1: Testing ERPNext connection...
✅ ERPNext connection successful

📥 Step 2: Fetching items from ERPNext...
✅ Fetched 1234 items from ERPNext

🖼️  Step 3: Processing images...
   Processed 50/1234 items...
   Processed 100/1234 items...
   ...
   ✅ Processed 1234 items

🔄 Step 4: Normalizing product data...
   ✅ Normalized 1230 products

📦 Step 5: Building catalog...
✅ Catalog saved to public/catalog.json
   Items: 1230
   Categories: 12
   Brands: 5
   Items with images: 856
   Total images: 1024

✅ Step 6: Validating catalog...
   ✅ Catalog is valid

🗑️  Step 7: Cleaning up old images...
🗑️  Cleaned up 15 old images

📤 Step 8: Committing and pushing to GitHub...
   ✅ Changes pushed to GitHub

📊 Sync Statistics:
   ─────────────────────────────────
   Total Items:       1234
   Successful:        1230
   Failed:            4
   Total Images:      1024
   Images Processed:  1009
   Images Failed:     15
   Duration:          45.23s
   ─────────────────────────────────

✅ Sync completed successfully!
```

## Verify Results

### 1. Check Catalog

```bash
# View metadata
cat public/catalog.json | jq '.metadata'

# Count products
cat public/catalog.json | jq '.products | length'

# View first product
cat public/catalog.json | jq '.products[0]'
```

### 2. Check Images

```bash
# List images
ls -lh public/images/items/ | head -10

# Verify WebP format
file public/images/items/*.webp | head -5

# Check total size
du -sh public/images/items/
```

### 3. Check Git Commit

```bash
# View last commit
git log -1

# View changed files
git show --name-only
```

### 4. Check Vercel Deployment

1. Visit your Vercel dashboard
2. Look for new deployment triggered by the commit
3. Verify deployment completes successfully
4. Visit your live site to see updated products

## Troubleshooting

### Connection Failed

```
❌ ERPNext connection failed: connect ECONNREFUSED
```

**Solution:**
- Check `ERP_NEXT_URL` is correct
- Ensure ERPNext is accessible from your network
- Verify API credentials are valid

### Missing Images

```
⚠️  Failed to process image 0 for ITEM-001
```

**Solution:**
- Some items may not have images in ERPNext
- This is normal and sync will continue
- Check ERPNext to add images if needed

### Git Push Failed

```
⚠️  Git push failed: Permission denied
```

**Solution:**
- Ensure git credentials are configured
- Run `git config --list | grep user`
- Set up SSH key or credential helper

### Sharp Installation Issues

```
Error: Cannot find module 'sharp'
```

**Solution:**
```bash
npm install sharp --save
```

## Scheduling Automatic Syncs

### Option 1: Cron Job (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add line to sync daily at 2 AM
0 2 * * * cd /path/to/ntweb && npm run sync >> /var/log/erp-sync.log 2>&1
```

### Option 2: GitHub Actions

Create `.github/workflows/sync.yml`:

```yaml
name: ERPNext Sync
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run sync
        env:
          ERP_NEXT_URL: ${{ secrets.ERP_NEXT_URL }}
          ERP_API_KEY: ${{ secrets.ERP_API_KEY }}
          ERP_API_SECRET: ${{ secrets.ERP_API_SECRET }}
```

### Option 3: ERPNext Webhook (Future)

See [lib/erp/README.md](file:///home/naman/projects/ntweb/lib/erp/README.md) for webhook integration details.

## Next Steps

1. ✅ Run test script to verify setup
2. ✅ Run full sync manually
3. ✅ Verify catalog and images
4. ✅ Check Vercel deployment
5. 🔄 Set up automatic syncing (optional)
6. 🔄 Configure webhook integration (optional)

## Support

For issues or questions:
- Check [lib/erp/README.md](file:///home/naman/projects/ntweb/lib/erp/README.md) for detailed documentation
- Review error messages in console output
- Verify environment variables are set correctly
