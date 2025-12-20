# ERPNext Sync System

This directory contains the one-way sync system that fetches data and images from ERPNext and generates a static catalog for the website.

## Architecture

The sync system is modular and consists of the following components:

### Core Modules

- **`types.ts`** - TypeScript interfaces and types
- **`fetcher.ts`** - ERPNext API client with retry logic
- **`normalizer.ts`** - Data transformation and categorization
- **`image-processor.ts`** - Image download and WebP optimization
- **`catalog-builder.ts`** - Catalog.json generation
- **`sync.ts`** - Main orchestration script

## Usage

### Manual Sync

Run the sync script manually:

```bash
npm run sync
```

This will:
1. Fetch all active items from ERPNext
2. Download and optimize product images to WebP
3. Generate `public/catalog.json` with all product data
4. Commit and push changes to GitHub (triggers Vercel deployment)

### Configuration

The sync system uses environment variables from `.env`:

```env
# Required
ERP_NEXT_URL=http://your-erp-instance.com
ERP_API_KEY=your_api_key
ERP_API_SECRET=your_api_secret

# Optional
SYNC_IMAGE_QUALITY=80          # WebP quality (0-100)
SYNC_IMAGE_MAX_WIDTH=1200      # Max image width in pixels
SYNC_GIT_AUTO_PUSH=true        # Auto commit and push to GitHub
```

### Output

- **Catalog**: `public/catalog.json`
- **Images**: `public/images/items/*.webp`

## Features

### Image Optimization

- Downloads images from ERPNext attachments
- Converts to WebP format for optimal web performance
- Resizes to max width while maintaining aspect ratio
- Generates deterministic filenames based on item_code
- Cleans up old images no longer in catalog

### Data Normalization

- Auto-categorizes items based on name patterns
- Detects brands (MaxFresh, Tibros, Sigma, etc.)
- Validates required fields
- Handles missing or invalid data gracefully

### Git Automation

- Automatically stages catalog and images
- Commits with timestamp
- Pushes to GitHub to trigger Vercel deployment

### Error Handling

- Retry logic for network failures
- Graceful handling of missing images
- Detailed error logging
- Continues processing even if individual items fail

## Webhook Integration (Future)

To trigger sync from ERPNext:

1. Create a webhook in ERPNext for Item doctype
2. Set webhook URL to your server endpoint
3. Endpoint should execute: `npm run sync`

Example webhook configuration:
- **DocType**: Item
- **Events**: After Insert, After Update
- **URL**: `https://your-server.com/api/sync-trigger`

## Troubleshooting

### Connection Issues

Test ERPNext connection:
```bash
npx tsx -e "import { ERPFetcher } from './lib/erp/fetcher'; const f = new ERPFetcher(process.env.ERP_NEXT_URL, process.env.ERP_API_KEY, process.env.ERP_API_SECRET); f.testConnection();"
```

### Image Processing Issues

Check sharp installation:
```bash
npm list sharp
```

### Git Push Issues

Ensure git credentials are configured:
```bash
git config --list | grep user
```

## Development

To test individual modules:

```bash
# Test fetcher
npx tsx -e "import { ERPFetcher } from './lib/erp/fetcher'; /* your test code */"

# Test normalizer
npx tsx -e "import { normalizeItem } from './lib/erp/normalizer'; /* your test code */"
```
