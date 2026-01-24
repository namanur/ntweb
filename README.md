# ntweb

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/namanur/ntweb?utm_source=oss&utm_medium=github&utm_campaign=namanur%2Fntweb&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
# Nandan Traders Frontend (NTWeb)

**NTWeb** is the Next.js-based e-commerce storefront and admin console for Nandan Traders. It serves as a high-performance, static-first catalog that syncs authoritative data from **ERPNext** and provides a modern shopping experience for B2B customers, along with internal tools for pricing and order management.

---

## 🚀 Key Features

### 🛍️ Digital Storefront
-   **Static Catalog**: High-speed browsing with data mirrored from ERPNext.
-   **Smart Filtering**: Fuzzy search, category filters, and brand detection.
-   **Responsive Design**: Mobile-optimized UI built with Tailwind CSS and HeroUI.
-   **Cart & Checkout**: Local cart management with direct ERP order injection.

### 💼 Pricing Console (Internal)
-   **AG Grid Integration**: efficient bulk pricing management.
-   **Guardrails**: Safety checks for margin, GST rates, and price deltas.
-   **ERP Sync**: Read-only visualization of ERP item snapshots.

### 🛡️ Admin & Ops
-   **Order Management**: View and track customer orders.
-   **Telegram Integration**: Real-time notifications for new orders and delivery updates.
-   **Sync System**: One-way authoritative sync from ERPNext to local JSON/Images.

---

## 🛠️ Tech Stack

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [HeroUI](https://www.heroui.com/)
-   **Data Grid**: [AG Grid Community](https://www.ag-grid.com/)
-   **State/Utils**: generic `useState` / `useEffect` patterns, `framer-motion` for animations.
-   **Backend**: Next.js API Routes (Serverless Functions).
-   **Integration**: Custom ERPNext fetcher (Axios), Telegram Bot API.

---

## 📂 Project Structure

```
├── app/                  # Next.js App Router
│   ├── api/              # Backend API routes (Order, Auth, Admin)
│   ├── login/            # Authentication pages
│   ├── pricing-console/  # Internal Pricing Console tool
│   └── page.tsx          # Storefront Homepage
├── components/           # React UI Components
│   ├── pricing-console/  # Console-specific components
│   └── ...               # Shared storefront components (ProductCard, Header)
├── lib/                  # Core Libraries & Utilities
│   ├── erp/              # ERP Sync & Normalization Logic (Read-Only)
│   ├── erp.ts            # Frontend Data Access Layer (Stubs/Types)
│   └── telegram.ts       # Notification Service
├── scripts/              # Automation & Maintenance Scripts
│   ├── deploy.js         # One-click deployment & git push
│   └── sync_from_erp.ts  # Master script to fetch data from ERPNext
├── public/               # Static Assets
│   ├── catalog.json      # Generated Product Database
│   └── images/items/     # Synced Product Images
└── .env.local            # Environment Secrets
```

---

## ⚡ Getting Started

### Prerequisites
-   **Node.js**: v18.17.0 or higher
-   **ERPNext**: Access to a running ERPNext instance (v14/v15).

### 1. Installation

```bash
git clone <repository_url>
cd ntweb

# Install dependencies
bun install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```env
# --- ERPNext Connection ---
ERP_NEXT_URL="https://your-erp-instance.com"
ERP_API_KEY="your_api_key"
ERP_API_SECRET="your_api_secret"
ERP_COMPANY_ADDRESS="Your Company Address Name"

# --- Authentication & Security ---
ADMIN_PASSWORD="your_admin_console_password"
SESSION_SECRET="complex_random_string_for_jose_jwt"

# --- Telegram Notifications ---
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_orders_chat_id"
TELEGRAM_ALERTS_CHAT_ID="your_alerts_chat_id"

# --- Sync Configuration ---
SYNC_IMAGE_QUALITY="80"
SYNC_IMAGE_MAX_WIDTH="1200"
SYNC_GIT_AUTO_PUSH="false" # Set to true in production context
```

### 3. Running Locally

**Development Server:**
```bash
bun run dev
# Opens http://localhost:3000
```

**Sync Data from ERP (Manual):**
This pulls items/images from ERPNext and updates `public/catalog.json`.
```bash
bun run sync
```

**Production Build:**
```bash
bun run build
bun start
```

---

## 🚢 Deployment

The project includes a helper script for streamlined deployment (Sync -> Commit -> Push).

```bash
# Full Deployment (Syncs Data + Pushes Code)
bun run deploy

# Javascript-only Deployment (Skips Data Sync)
bun run deploy -- --quick
```

---

## 🔮 Roadmap / Future Improvements

-   **Pricing Write-Back**: Implement secure API to write approved pricing changes back to ERPNext (currently Read-Only).
-   **Customer Portal**: Expanded history and invoice download for logged-in B2B customers.
-   **Advanced Search**: Move from fuzzy matching to a dedicated search index (e.g., Fuse.js or Meilisearch) for larger catalogs.
