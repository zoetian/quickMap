# QuickMap

Paste a URL, QuickMap scans the page for addresses, lets you pick the real
ones, and draws the shortest driving route to visit them all — starting and
ending at a central point.

## Architecture

```
frontend/   React + TypeScript + Vite SPA, deployed as a static site to
            GitHub Pages. Talks directly to the Google Maps JavaScript API
            (Geocoding, Routes/Route Matrix, Directions) from the browser, and
            to worker/ for crawling.

worker/     A small Cloudflare Worker (TypeScript) that does the one thing
            a browser can't: fetch an arbitrary URL server-side (no CORS
            restriction) and run a regex-based address extractor over the
            page text.
```

Route optimization (TSP) runs entirely client-side in `frontend/src/lib/tsp.ts`:
exact Held-Karp for ≤13 stops, nearest-neighbor + 2-opt heuristic beyond
that. It uses real driving distances from the Routes API's
`computeRouteMatrix` (`frontend/src/lib/distanceMatrix.ts`), not
straight-line distance — the older `google.maps.DistanceMatrixService` is
on Google's deprecation track, so this project uses its replacement.

Everything that can run in the browser does, so the only server piece is
the crawler — which keeps hosting to "one free Cloudflare Worker" instead
of a full backend.

## Setup

### 1. Google Maps API key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/),
   create a project (or pick an existing one).
2. **APIs & Services → Library**: enable **Maps JavaScript API**,
   **Geocoding API**, **Directions API**, and **Routes API**. Each of these
   is a separate billable product in Cloud Console even though the
   frontend only ever talks to the single Maps JavaScript API library —
   skipping one gives a `REQUEST_DENIED` error from that specific service
   at runtime, with everything else still working.
3. **APIs & Services → Credentials → Create Credentials → API key**.
4. Restrict the key (Edit API key):
   - *Application restrictions* → HTTP referrers → add
     `https://<your-username>.github.io/*` and `http://localhost:5173/*`.
   - *API restrictions* → restrict to the four APIs enabled above.
5. Google requires a billing account to be attached even for free-tier
   usage; a hobby project's traffic should stay comfortably within the
   monthly free usage included with every account.
6. **Google Maps Platform → Map Management → Create Map ID** (any map
   type). Markers use `AdvancedMarkerElement`, which requires a Map ID to
   render — locally this falls back to Google's `DEMO_MAP_ID` placeholder
   automatically, but production needs a real one set as
   `VITE_GOOGLE_MAPS_MAP_ID`.

### 2. Local development

```bash
# Terminal 1 — worker (crawler API)
cd worker
npm install
npm run dev            # http://localhost:8787

# Terminal 2 — frontend
cd frontend
npm install
cp .env.example .env.local
# edit .env.local:
#   VITE_GOOGLE_MAPS_API_KEY=<your key>
#   VITE_GOOGLE_MAPS_MAP_ID=<your Map ID>   (optional locally; defaults to DEMO_MAP_ID)
#   VITE_WORKER_URL=http://localhost:8787
npm run dev             # http://localhost:5173
```

### 3. Deploy

**Worker → Cloudflare Workers** (free tier):

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Note the deployed URL (`https://quickmap-worker.<you>.workers.dev`), then
edit `worker/wrangler.toml`'s `ALLOWED_ORIGINS` to include your GitHub
Pages origin (`https://<your-username>.github.io`) and redeploy.

**Frontend → GitHub Pages**, via the included Actions workflow:

1. Repo **Settings → Pages → Source** → set to "GitHub Actions" (one-time).
2. Repo **Settings → Secrets and variables → Actions**, add:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_GOOGLE_MAPS_MAP_ID` (a real Map ID — `DEMO_MAP_ID` is dev-only)
   - `VITE_WORKER_URL` (your deployed worker URL from above)
3. Push to `master` — [.github/workflows/deploy-frontend.yml](.github/workflows/deploy-frontend.yml)
   builds and publishes automatically.

There's also [.github/workflows/deploy-worker.yml](.github/workflows/deploy-worker.yml)
to auto-deploy the worker on push, if you add a `CLOUDFLARE_API_TOKEN`
secret (Cloudflare dashboard → My Profile → API Tokens → "Edit Cloudflare
Workers" template). Not required — `wrangler deploy` by hand works fine.

## Known limitations / ideas for next steps

These map to the open questions in the original project brainstorm:

- **Address parsing is a regex heuristic**, not real NLP — it's US-address-shaped
  pattern matching, so it will miss some real addresses and flag some false
  positives. That's why the UI makes you confirm each candidate with a
  checkbox rather than trusting it blindly.
- **The route matrix caps out at 25 stops per request** (a Google API limit),
  so the "100+ locations" case from the original notes isn't handled yet —
  it would need the matrix built from tiled/batched requests.
- **Only one central point** is supported right now; the "two central
  points that both need to be on the route" case isn't implemented.
- **Crawling only sees server-rendered HTML.** A page whose addresses are
  injected by client-side JavaScript won't expose them to a simple fetch —
  handling that would mean rendering the page (e.g. headless browser),
  which is a much heavier piece of infrastructure than a Worker.

## Further reading (from original notes)

- [usaddress](https://github.com/datamade/usaddress) — the Python address
  parser this project's parsing approach was originally inspired by.
- [Using Google Geocoding and Street View Image APIs with Go](https://medium.com/@IndianGuru/using-google-geocoding-and-street-view-image-apis-with-go-b67bb4841ff0)
