# 🍲 Smart Canteen

**Live demo → <https://hananmtplen-oss.github.io/smart-canteen/>**

**Intelligent Pre-Ordering, Crowd Management & Food Demand Planning System** — a college hackathon prototype.

A realistic, fully interactive web app that removes the canteen queue by moving ordering into the phone,
spreading collection across capacity-controlled 12-minute windows, and feeding confirmed demand straight to
the kitchen.

> **Everything external is simulated.** Payments, QR scanners, ESP32 Time-of-Flight sensors and the database
> are all mocked implementations. No API keys, credentials or hardware are required — the whole prototype runs
> offline in the browser.

---

## Quick start

```bash
cd smart-canteen
npm install
npm run dev      # http://127.0.0.1:5273
```

Other scripts:

| Script              | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `npm run build`     | Typecheck + production bundle into `dist/` |
| `npm run preview`   | Serve the production build                 |
| `npm run typecheck` | TypeScript check only                      |
| `npm run deploy`    | Build and publish to Vercel (see below)    |

**Stack:** React 19 · TypeScript (strict) · Vite 7 · Tailwind CSS v4 · React Router 7 · Recharts · qrcode.react · lucide-react.
No backend — all state lives in one reducer mirrored into `localStorage`.

---

## The pitch deck

Opening the site root (`/`) plays a **ten-slide presentation** rather than dropping straight into the app —
cover page, problem statement, root cause, solution, the student flow, the kitchen side, benefits, simulated
impact and a roadmap — ending on a **Let's look at the website** button that hands off to the real product.

- **Navigate:** `←` `→`, `Space`, `PageUp`/`PageDown`, `Home`/`End`, swipe on touch, or the dots in the footer.
- **Skip:** `Esc`, the **Skip intro** button, or opening any deep link (`/#/kitchen`).
- **Replay:** the **Pitch Deck** button in the app header, or `/#/intro` directly.

Slides live in `src/components/Presentation.tsx` — the slide list is a plain array, so adding or reordering a
slide is a one-line change.

> Deep links skip the deck on purpose. Reloading mid-demo on `/#/scanner` should never bounce you back to
> slide one in front of judges.

---

## The four interfaces

Switch between them with the segmented control in the header.

| Interface   | Route            | What it does                                                                 |
| ----------- | ---------------- | ---------------------------------------------------------------------------- |
| **Student** | `/`              | Menu, cart, slot booking, mock payment, QR token, order status, crowd levels  |
| **Kitchen** | `/kitchen`       | Live order log, demand forecast, slot load, occupancy, preparation worksheet   |
| **Scanner** | `/scanner`       | Kiosk that validates QR tokens and redeems them exactly once                  |
| **Demo**    | `/demo`          | Presenter console that drives every simulation                                |

Every screen reads and writes the **same shared state**, which is why a student paying instantly changes the
kitchen dashboard.

---

## Recommended 3-minute demo script

1. **`/`** — Land on the home page. Point out the live canteen status card: `🟡 MODERATELY BUSY · 118/180`.
2. **`/crowd`** — Show the occupancy trend, then hit **+5 entering** a couple of times and watch the crowd
   level recalculate from the documented thresholds (0–40% low, 41–75% moderate, 76–100% high).
3. **`/menu`** — Kerala Meals opens the add-on chooser: pick **Fish Fry** and **Egg**, then **Add to cart**. Add a Chicken Biryani too.
4. **`/slots`** — Show that `12:12–12:24` is **FULL and locked** while the system highlights the quietest open
   window as *Recommended*. Mention the policy: **late collection never loses your food.**
5. **`/checkout`** → **Proceed to Payment** → pick **UPI** → **Pay**. Watch the three-stage authorisation,
   then `✅ PAYMENT SUCCESSFUL` with a demo transaction ID.
6. **View Digital Food Token** — a real, scannable QR encoding an **opaque token**, not the order payload.
   **Download QR** saves it as a PNG so it can be printed or shown from another screen.
7. **`/kitchen/queue`** — The new order is sitting at the top of the log. Press **Start**, then **Ready**.
8. Back on the token page, the status has already flipped to 🟢 **Ready for Collection**.
9. **`/scanner`** — **Scan & Verify** → `✅ ORDER VERIFIED` → **CONFIRM COLLECTION**.
10. **`/demo`** → **Simulate duplicate QR** → `❌ ALREADY REDEEMED` (anti-screenshot protection).
11. **`/kitchen/demand`** — Show confirmed demand per dish and the **+15% walk-in buffer**, then drag the
    buffer slider and watch every recommendation recalculate.
12. **`/analytics`** — Close on the projected impact, clearly labelled **DEMO / SIMULATED ANALYTICS**.
13. Finish with **Reset demo data** on the Demo Panel to restore the pristine state.

### Useful demo levers

- **Off-slot collection** — jumps the simulated clock past the order's window; the scanner still allows
  collection but logs it. Set the off-slot threshold to `1` to see the **₹5 scheduling adjustment** apply at
  the next checkout.
- **Simulated payment failure** — flips a toggle so the next payment declines. No order is created, no slot
  consumed, nothing debited.
- **Clock control** — freeze real-time advance during the pitch, or jump `+12 / +30` minutes.
- **Search box** in the kitchen queue finds any of the 247 seeded orders by ID or student.

---

## Menu

Lunch service serves four dishes. Add-ons are ordered as an optional extra on the Kerala Meals and are never
listed as standalone cards — but they price and forecast exactly like any other dish.

| Dish           | Price | Notes                                        |
| -------------- | ----: | -------------------------------------------- |
| Kerala Meals   |  ₹60  | Optional **Fish Fry** (₹40) or **Egg** (₹15) |
| Chicken Biryani|  ₹80  |                                              |
| Veg Biryani    |  ₹70  |                                              |
| Fried Rice     |  ₹70  |                                              |

---

## Deploying

### GitHub Pages (what the live demo uses)

Every push to `main` builds and publishes automatically via
`.github/workflows/deploy-pages.yml`, so the shared link always reflects the latest commit.

Asset paths are relative (`base: './'` in `vite.config.ts`), which is why one build works both at a domain
root and under the `/smart-canteen/` subfolder a Pages project site uses.

### Vercel

The build is a static bundle, and the app uses a `HashRouter`, so no server-side routing rules are needed.
`vercel.json` already declares the framework, build command and output directory.

```bash
cd smart-canteen
npm run deploy        # = npx vercel deploy --prod --yes
```

The first run opens a browser to log in to Vercel and asks which project to link. After that, the same command
re-deploys to the same URL, which is the one to share with friends.

To share a URL without any account, drag the `dist/` folder onto <https://app.netlify.com/drop> after
`npm run build`.

> Every visitor gets their own browser-local copy of the demo data, so a friend clicking **Reset Demo Data**
only affects their own session.

---

## What is real vs. simulated

| Feature                 | Status                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| Ordering, cart, totals  | Real logic                                                             |
| Slot capacity + locking | Real, first-come-first-served, enforced in the reducer                 |
| Demand aggregation      | Real — derived live from paid orders                                   |
| QR codes                | **Real, scannable.** Payload is an opaque token mapped to an order; downloadable as PNG |
| Redemption / duplicate detection | Real logic in the shared store                                 |
| Payments                | **Simulated** gateway (UPI / Card / Wallet), no network calls           |
| QR scanner hardware     | **Simulated** kiosk, manual scan + demo triggers                        |
| ESP32 / ToF occupancy   | **Simulated** feed with manual overrides                                |
| Database                | `localStorage`                                                          |
| Impact percentages      | **Projections, clearly labelled** — not measured field results          |

### Data model

`User` · `FoodItem` · `Order` · `Slot` · `Occupancy` — see `src/types.ts` for the full shape and
`/how-it-works` for the on-screen documentation.

---

## Project layout

```
src/
  types.ts                 shared data model + reducer actions
  lib/
    seed.ts                deterministic demo dataset (247 pre-orders, menu, slots)
    store.tsx              reducer, localStorage persistence, sensor + clock simulation
    selectors.ts           demand forecasting, slot analytics, kitchen metrics
    utils.ts               formatting, crowd thresholds, PRNG, token generation
  components/              UI kit, app shell, charts, QR ticket, payment modal
  pages/
    student/               Home, Menu, Cart, Slots, Checkout, OrderDetail, MyOrders, CrowdStatus, Analytics, HowItWorks
    kitchen/               Overview, Queue, Demand, Slots, Occupancy
    scanner/               Scanner kiosk
    demo/                  Demo control panel
```

> **Tip:** the seeded dataset is generated from a fixed seed, so *Reset Demo Data* always reproduces exactly
> the same canteen — no surprises mid-presentation.

---

## Privacy note

Occupancy is estimated from anonymous entrance/exit counting only. No facial recognition, no phone or device
tracking, and no personal identity is ever recorded.
