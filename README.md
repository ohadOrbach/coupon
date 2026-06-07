# Coupons — personal coupon / voucher / ticket keeper

A personal **web app (PWA)** to store coupons, vouchers, and event tickets and
pull them up quickly at checkout. Runs entirely in the browser on each phone —
**no cloud, no server, no account, no paid services.** Hosted free on GitHub
Pages; installs to the home screen like an app.

Built with Vite + React + TypeScript.

## Features

- Add / edit coupons (name, store, code, type, amount, currency, expiry, notes)
- List with **search**, **filter by store and status**, sorted by soonest expiry
- **"Expiring within a week" banner** (you check the app yourself — there are no
  background notifications in a web app; that was a deliberate trade-off)
- **Checkout view**: large tap-to-reveal code to show a cashier
- **Mark as used**; coupons past their expiry auto-flag as expired
- **Backup**: Export all coupons to a JSON file and Import it back (also how you
  move data to another phone, since each phone stores its own data)
- Works **offline** after the first load; installable to the home screen

## How your wife (or any phone) installs it

There is **no app store**. Once it's deployed (below), you just share the URL:

1. Open the link in **Chrome on Android**.
2. Tap the **⋮ menu → "Add to Home screen"** (or "Install app").
3. It now opens full-screen like a normal app, works offline, and keeps its own
   data on that phone.

When you deploy a new version, it updates automatically the next time it's
opened (the service worker is set to auto-update).

> Heads-up: coupons are stored in **that phone's browser storage**. If you clear
> the browser's site data, the coupons are lost — so use **Export** now and then
> to keep a backup file.

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # vitest (core logic: expiry, reminders, formatting)
npm run typecheck  # tsc
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## Deploy to GitHub Pages (free, automatic)

Deployment is handled by GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).
**Every push to `main` builds and publishes the app automatically** — no local
deploy step.

1. Push this code to a GitHub repo named **`coupon`**.
   - The app's base path is `/coupon/` in `vite.config.ts`. If the repo has a
     different name, change `BASE` there to `/<your-repo-name>/`.
2. The workflow runs on push: it installs, tests, builds, enables Pages
   (source = GitHub Actions) automatically, and deploys.
3. Once it finishes, the app is live at
   `https://<your-username>.github.io/coupon/`. Share that URL with both phones.

To ship a change later: commit and `git push`. That's the whole deploy.

> The repo must be **public** (GitHub Pages is free for public repos). There are
> no secrets or personal data in the code — coupon data lives only in each
> phone's browser.

## Project structure

```
src/
  main.tsx          app entry (HashRouter, requests persistent storage)
  App.tsx           routes
  pages/            ListPage, DetailPage, FormPage
  components/       CouponForm, CheckoutCode, StatusBadge
  db/
    storage.ts      IndexedDB (idb-keyval) + persistent-storage request
    coupons.ts      repository: CRUD, filters, export/import backup
  lib/
    types.ts        Coupon data model
    status.ts       auto-expiry logic (unit-tested)
    reminders.ts    "expiring soon" calculation (unit-tested)
    format.ts       amount / expiry / status display (unit-tested)
```

## Deliberately not included (and why)

- **Background expiry notifications** — a web app can't reliably fire a
  scheduled notification while closed without a push server (cost/infra). You
  open the app to see the "expiring soon" banner instead.
- **Auto-extraction from shared messages (Claude API)**, barcode scanning,
  cross-device sync — out of scope for this free, serverless, on-device version.
