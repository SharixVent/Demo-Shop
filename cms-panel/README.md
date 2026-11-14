# DemoShop — Admin CMS Panel (`cms-panel`)

Dedicated Content Management System (CMS) built with **React 18 + TypeScript + Vite** for managing store products, categories, homepage sections, customer orders, promotions, dynamic shipping costs (`store_settings`), legal policies, and on-page SEO.

---

## Module Architecture (`cms-panel`)

- **`/src/components`** — Management views:
  - **`EditItem/`** — Product creator and editor with multi-image upload, size management, and Yoast-style SEO analyzer.
  - **`OrdersPanel.tsx`** — Order management table, customer billing details, parcel locker codes, and status updates (`unpaid`, `paid`, `shipped`, `cancelled`).
  - **`EditPromotions/`** — Flash-sale manager and real-time editor for `store_settings` (`courier_price`, `parcel_locker_price`, `free_delivery_threshold`).
  - **`EditCategory/` & `EditSection/`** — Navigation categories and homepage layout configuration.
  - **`EditNews/` & `Policies/`** — Blog article editor and legal policy pages (Terms, Privacy, Returns, Shipping).
- **`/src/context/AuthContext.tsx`** — Authentication context connected to PocketBase.
- **`/src/main.tsx`** — Configured with `<BrowserRouter basename="/zarzadzanie-d8a2">`.
- **`vite.config.ts`** — Runs the CMS dev server on port `5174` with `base: '/zarzadzanie-d8a2/'`.

---

## Step-by-Step Installation & Setup

### Step 1: Install CMS NPM Packages
Open a terminal inside `cms-panel/` and install the dependencies:

    cd cms-panel
    npm install

Verify the example environment variables in `cms-panel/.env`:

    VITE_POCKETBASE_URL=http://127.0.0.1:8090
    VITE_PUBLIC_SITE_URL=http://localhost:5173

### Step 2: Create a CMS Admin Account in PocketBase
`cms-panel` authenticates against the **`users`** collection in the PocketBase server located in `store-core/pocketbase/`.

1. Make sure PocketBase is running (`cd store-core/pocketbase && ./pocketbase serve`).
2. Open the PocketBase Admin UI at [http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/).
3. Open the **`users`** collection and click **New record**.
4. Enter your desired **`email`** and **`password`**, toggle **`verified: true`**, and click **Create**.

### Step 3: Run the CMS Panel
Start the development server inside `cms-panel/`:

    npm run dev

- **Access via Storefront Proxy (Recommended):** [http://localhost:5173/zarzadzanie-d8a2/login](http://localhost:5173/zarzadzanie-d8a2/login)
- **Direct Dev Server Access:** [http://localhost:5174/zarzadzanie-d8a2/login](http://localhost:5174/zarzadzanie-d8a2/login)