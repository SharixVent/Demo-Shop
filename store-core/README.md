# DemoShop — Store Core (`store-core`)

The core module of the e-commerce platform combining the customer-facing storefront (**React 18 + TypeScript + Vite**) with the embedded **PocketBase** database server (`/pocketbase`), server-side scripts (`pb_hooks`), and the sample database template.

---

## Module Architecture (`store-core`)

- **`/pocketbase`** — Backend PocketBase server (Port `8090`):
  - **`pb_hooks/`** — Server-side scripts (`main.pb.js`) handling order price validation, Przelewy24 payment registration, email notifications, and daily promotion CRON jobs.
  - **`pb_data/`** — Pre-populated sample database (products, images, categories, blog articles, and delivery rates in `store_settings`).
  - **`pb_schema.json`** — Collection structure template for clean database imports.
- **`/src`** — Storefront source code (dynamic cart, live search bar, catalog filters, and Schema.org SEO metadata).
- **`.env`** — Example environment variables for the storefront.
- **`vite.config.ts`** — Configures port `5173` and the Vite Proxy forwarding `/zarzadzanie-d8a2` requests to `cms-panel` (`http://localhost:5174`).

---

## Step-by-Step Installation & Setup

### Step 1: Install Storefront NPM Packages
Open a terminal in the `store-core` directory and install all required dependencies:

    cd store-core
    npm install

Verify the example environment variables in `store-core/.env`:

    VITE_POCKETBASE_URL=http://127.0.0.1:8090
    VITE_SITE_URL=http://localhost:5173
    VITE_STORE_NAME=DemoShop

### Step 2: Install and Launch PocketBase (`store-core/pocketbase`)
1. Download the **PocketBase** executable for your OS from [https://pocketbase.io/docs/](https://pocketbase.io/docs/).
2. Extract the archive and place **`pocketbase.exe`** (Windows) or **`pocketbase`** (macOS/Linux) directly into **`store-core/pocketbase/`**.
3. Create your own database Superuser account:

       cd store-core/pocketbase
       # Windows:
       ./pocketbase.exe superuser upsert admin@demoshop.local YourStrongPassword123!
       # macOS / Linux:
       chmod +x pocketbase
       ./pocketbase superuser upsert admin@demoshop.local YourStrongPassword123!

   *(For PocketBase versions older than v0.23, use: `./pocketbase admin create admin@demoshop.local YourStrongPassword123!`)*.

4. Start the PocketBase server:

       # Windows:
       ./pocketbase.exe serve
       # macOS / Linux:
       ./pocketbase serve

   All server hooks inside `store-core/pocketbase/pb_hooks/` will load automatically upon startup.

---

## Loading the Sample Database (Seed Data vs Schema Template)

### Option A: Use the Pre-Populated Demo Database (`pb_data`)
By default, `store-core/pocketbase/pb_data/` is included in the repository:
- Starting `./pocketbase serve` immediately loads sample products (`items`), images (`storage`), categories, homepage sections, blog posts (`news`), policies, and delivery prices (`store_settings`).
- All test orders (`orders`) have been cleared.

### Option B: Import Clean Database Template (`pb_schema.json`)
If you prefer to start with a clean database from the template file:
1. Start `./pocketbase serve` and log into the Admin UI at [http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/).
2. Go to **Settings** -> **Import collections** -> click **Load from JSON file**.
3. Select **`store-core/pocketbase/pb_schema.json`**, click **Review**, and confirm with **Confirm and import**.
4. Open the **`store_settings`** collection and create one record (**New record**) with your shipping prices:
   - `courier_price`: `15`
   - `parcel_locker_price`: `14`
   - `free_delivery_threshold`: `249`
   *(Ensure `store_settings` -> **API Rules** has both **List/Search rule** and **View rule** unlocked and left empty `""` so the storefront can fetch shipping prices).*

---

## Launching the Storefront

In the `store-core/` directory, run:

    npm run dev

The storefront will be available at: [http://localhost:5173/](http://localhost:5173/)