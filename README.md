# DemoShop — Full-Stack E-Commerce & CMS Platform

A complete full-stack e-commerce platform built with a modern customer storefront (**React + TypeScript + Vite**), a dedicated Admin CMS panel (`/zarzadzanie-d8a2/`), and an embedded **PocketBase** backend with custom server-side logic (`pb_hooks`) and a pre-populated demo database.

---

## Project Architecture

The project is organized into two primary application modules within a single monorepo:

- **[`/store-core`](./store-core)** — Contains the customer-facing e-commerce storefront and the embedded database server:
  - **`/store-core/src`** — Online store for customers running on port `5173` (includes Vite Proxy rules routing `/zarzadzanie-d8a2` to the CMS).
  - **`/store-core/pocketbase`** — **PocketBase** server (port `8090`) containing:
    - **`pb_hooks/`** — Server-side scripts handling cart price verification, Przelewy24 payment registration (`/api/p24/register`), email notifications, and an automated CRON job clearing expired promotions.
    - **`pb_data/`** — Pre-populated Seed Database containing sample products, images, categories, blog articles, and delivery settings (`store_settings`), with order history (`orders`) cleared.
    - **`pb_schema.json`** — Complete export of collection structures and API Rules for clean installations.
- **[`/cms-panel`](./cms-panel)** — Standalone Admin CMS application running in the background on port `5174` and served under `/zarzadzanie-d8a2/` via Vite Proxy.

---

## Application Screenshots

### Customer Storefront (`store-core`)
| Home Page (`/`) | Catalog & Filters (`/collections`) |
| :---: | :---: |
| ![Home Page](./docs/screenshots/01-home.png) | ![Catalog](./docs/screenshots/02-catalog.png) |

| Product Card (`/item/:id`) | Shopping Cart & Checkout (`/cart`) |
| :---: | :---: |
| ![Product Page](./docs/screenshots/03-product.png) | ![Cart & Checkout](./docs/screenshots/04-cart-checkout.png) |

| News & Blog (`/news`) |
| :---: |
| ![News](./docs/screenshots/05-news.png) |

### Admin CMS Panel (`/zarzadzanie-d8a2/`)
| Product Management & SEO Analyzer | Customer Order Fulfillment |
| :---: | :---: |
| ![Admin Products](./docs/screenshots/06-admin-products.png) | ![Admin Orders](./docs/screenshots/07-admin-orders.png) |

| Promotions & Dynamic Delivery Costs (`store_settings`) |
| :---: |
| ![Admin Promotions](./docs/screenshots/08-admin-promotions.png) |

---

## Complete Installation & Launch Guide (Step-by-Step)

### Step 1: Clone the repository and install NPM packages
Required environment: **Node.js (v18+)**.

    git clone https://github.com/SharixVent/Demo-Shop.git
    cd demoshop
    npm run install:all

### Step 2: Download PocketBase and place it inside `/store-core/pocketbase`
The PocketBase executable binary is not tracked in the Git repository due to OS differences (Windows, macOS, Linux).

1. Download the official PocketBase package for your OS from: [https://pocketbase.io/docs/](https://pocketbase.io/docs/)
2. Extract the downloaded `.zip` archive and copy **`pocketbase.exe`** (Windows) or **`pocketbase`** (macOS/Linux) directly into the **`store-core/pocketbase/`** folder.
3. Verify that `store-core/pocketbase/` contains the `pb_hooks/` and `pb_data/` directories (included in the repository).

## Pre-Populated Demo Database & Default Login Credentials

This repository comes with a ready-to-use demo database (`store-core/pocketbase/pb_data/`) so you can explore the entire store and CMS immediately after launching:

**Included Sample Data**: Pre-loaded products (`items`) with royalty-free studio photography, categories (`categories`), homepage hero banners (`sections`), editorial blog articles (`news`), legal documents (`documents`), and dynamic delivery pricing (`store_settings`).

**Clean Order History**: All test orders in the orders collection have been cleared.

## Demo Login Credentials

Use the following default credentials to sign in locally (you can change them anytime in the PocketBase dashboard):

| Panel / Service              | Local URL                                                        | Email / Login     | Password    |
|------------------------------|------------------------------------------------------------------|-------------------|-------------|
| Admin CMS Panel              | (/zarzadzanie-d8a2/)http://localhost:5173/zarzadzanie-d8a2/login | email@example.com | haslo123456 |
| PocketBase Database UI (/_/) | http://127.0.0.1:8090/_/                                         | email@example.com | haslo123456 |

### Step 3: Create your own Administrator accounts (First Launch)
The repository includes a ready-to-use product database (`store-core/pocketbase/pb_data/`), but for security reasons **does not include private login credentials**. Create your access accounts before logging in:

1. **Create the main PocketBase Database Administrator account (Superuser):**
   Open a terminal inside `store-core/pocketbase/` and run the command below (using your own email and a password of at least 10 characters):

       cd store-core/pocketbase
       # Windows:
       ./pocketbase.exe superuser upsert admin@demoshop.local YourStrongPassword123!
       # macOS / Linux:
       chmod +x pocketbase
       ./pocketbase superuser upsert admin@demoshop.local YourStrongPassword123!

2. **Start PocketBase and create an account for the Store CMS Panel (`/zarzadzanie-d8a2/`):**
   - Start the database: `./pocketbase serve` (or `pocketbase.exe serve`).
   - Open the database admin panel at: `http://127.0.0.1:8090/_/` and log in with the credentials from point 1.
   - Navigate to the **`users`** collection (used for Store CMS authentication), click **New record**, enter your `email` and `password`, enable `verified: true`, and save the record.
   - You will use these credentials to log into the store CMS panel at `http://localhost:5173/zarzadzanie-d8a2/login`.

### Step 4: Launch the entire project (Storefront + Admin CMS + Backend)
Return to the root `demoshop/` folder and start all 3 servers simultaneously with a single command:

    npm run dev

Available local addresses:
- **Customer Storefront:** [http://localhost:5173/](http://localhost:5173/)
- **Admin CMS Panel:** [http://localhost:5173/zarzadzanie-d8a2/](http://localhost:5173/zarzadzanie-d8a2/) (served via Vite Proxy from port `5174`)
- **PocketBase Admin UI:** [http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/)
- **PocketBase REST API:** `http://127.0.0.1:8090/api/`