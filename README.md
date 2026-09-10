# QuickMap

Paste a URL, QuickMap scans the page for addresses, lets you pick the real
ones, and finds the shortest driving route to visit them all — starting
from a central point.

**Live demo:** `https://<your-username>.github.io/quickMap/` (once you've
completed the deploy steps below).

## Using it

1. Open the site — no signup or setup needed for a first try. QuickMap
   ships with a shared demo key so you can search a few routes right
   away.
2. Set your **central point** — type a starting address or click "Use my
   current location."
3. Add **stops** any combination of ways: paste a URL and click "Scan" to
   pull candidate addresses off the page (confirm the real ones with the
   checkboxes — the parser is a heuristic, so it can miss or misfire),
   type an address directly, or click a location on the map.
4. Click **Find best route**. QuickMap geocodes everything, computes real
   driving distances between every pair of stops, and solves for the
   shortest path that starts at your central point and visits every stop
   once — the layout switches to a map view with the route drawn and an
   ordered list of stops (each with a stable letter so you can match it
   back to what you typed in).
5. **If the demo runs out for the day**, QuickMap will ask you to bring
   your own free key — see [Bring your own Google Maps API
   key](#bring-your-own-google-maps-api-key) below. You can also switch to
   your own key any time via the button in the top corner, even before
   that happens.

### Bring your own Google Maps API key

QuickMap runs entirely in your browser — there's no backend server
relaying map requests — so it talks to Google directly using a key. The
deployed site ships with a shared demo key (capped with a daily quota in
Cloud Console) so first-time visitors can try it with zero setup; once
that shared quota is used up for the day, or if you'd rather not depend
on it, you can bring your own key instead. It's stored only in your
browser (`localStorage`) and never sent anywhere else, including to
QuickMap's own server.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/),
   create a project (or pick an existing one).
2. **APIs & Services → Library**: enable **Maps JavaScript API**,
   **Geocoding API**, and **Routes API**.
3. **APIs & Services → Credentials → Create Credentials → API key**.
4. (Recommended) Restrict the key — *Application restrictions* → HTTP
   referrers → add the QuickMap site's URL; *API restrictions* → limit it
   to the three APIs above. This just limits what the key can be used for
   if it ever leaks; since it's your own key on your own billing, it's
   optional but good hygiene.
5. Google requires a billing account attached even for free-tier usage;
   normal personal use (a handful of routes) should stay comfortably
   within the monthly free usage included with every account.
6. Paste the key into QuickMap when prompted (or via the "Use your own
   API key" button).

## Architecture

```
frontend/   React + TypeScript + Vite SPA, deployed as a static site to
            GitHub Pages. Talks directly to the Google Maps JavaScript API
            (Geocoding, Routes API) from the browser — using a shared demo
            key by default, or a visitor-supplied one — and to worker/
            for crawling.

worker/     A small Cloudflare Worker (TypeScript) that does the one thing
            a browser can't: fetch an arbitrary URL server-side (no CORS
            restriction) and run a regex-based address extractor over the
            page text.
```

`App.tsx` picks which key to use: a visitor-supplied key (persisted via
`frontend/src/lib/apiKeyStorage.ts` to `localStorage` only — never sent
anywhere else) always wins if one is set; otherwise it falls back to the
shared demo key (`VITE_GOOGLE_MAPS_DEMO_KEY`, baked into the build).
`frontend/src/lib/quotaError.ts` detects when a Google API call fails
because the demo key hit its Cloud Console quota, and a loading-status
check (`useApiLoadingStatus`) catches the case where the map script fails
to load at all — either one flips the app into "ask for your own key"
mode (`ApiKeyPrompt.tsx`). `LandingHero.tsx` is the search screen shown
once a usable key exists but no route has been computed yet.

Route optimization (TSP) runs entirely client-side in `frontend/src/lib/tsp.ts`:
exact Held-Karp for ≤13 stops, nearest-neighbor + 2-opt heuristic beyond
that. It solves an **open path** — starting at the central point and
visiting every stop once, with no forced leg back to the start. It uses
real driving distances from the Routes API's `computeRouteMatrix`
(`frontend/src/lib/distanceMatrix.ts`), and draws the route with the same
API's `computeRoutes` (`frontend/src/components/RouteDirections.tsx`) —
the older `google.maps.DistanceMatrixService`/`DirectionsService`/`Marker`
are all on Google's deprecation track, so this project uses their
Routes API / `AdvancedMarkerElement` replacements throughout.

Everything that can run in the browser does, so the only server piece is
the crawler — which keeps hosting to "one free Cloudflare Worker" instead
of a full backend.

## Local development

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
#   VITE_GOOGLE_MAPS_DEMO_KEY=<optional — see below>
#   VITE_GOOGLE_MAPS_MAP_ID=<your Map ID>   (optional locally; defaults to DEMO_MAP_ID)
#   VITE_WORKER_URL=http://localhost:8787
npm run dev             # http://localhost:5173
```

If you leave `VITE_GOOGLE_MAPS_DEMO_KEY` unset, `http://localhost:5173`
will just prompt you for your own key on load — see [Bring your own
Google Maps API key](#bring-your-own-google-maps-api-key) above. It's
saved in your browser's `localStorage`, so you only need to do this once
per browser. Setting the demo key locally too lets you test the
"try-before-you-bring-a-key" flow, including what happens once its quota
is hit.

A Map ID (`VITE_GOOGLE_MAPS_MAP_ID`) is a build-time setting rather than
something visitors provide — it's not a secret and doesn't affect billing
on its own, it just controls marker rendering. See [Cloud Console →
Google Maps Platform → Map
Management](https://console.cloud.google.com/google/maps-apis/studio/maps)
to create one; falls back to Google's `DEMO_MAP_ID` placeholder if unset.

## Deploy

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
   - `VITE_GOOGLE_MAPS_DEMO_KEY` (see below — omit this secret entirely to
     skip the shared-demo experience and always prompt visitors for their
     own key instead)
   - `VITE_GOOGLE_MAPS_MAP_ID` (a real Map ID — `DEMO_MAP_ID` is dev-only)
   - `VITE_WORKER_URL` (your deployed worker URL from above)
3. Push to `master` — [.github/workflows/deploy-frontend.yml](.github/workflows/deploy-frontend.yml)
   builds and publishes automatically.

**Setting up the demo key's quota cap** (do this before sharing the link
widely): create the key following the [Bring your own Google Maps API
key](#bring-your-own-google-maps-api-key) steps above, restricted to your
Pages domain. Then, for each of Geocoding API, Routes API, and Maps
JavaScript API: **Cloud Console → APIs & Services → \<that API\> →
Quotas & System Limits**, find the requests-per-day quota, and edit it
down to a number you're comfortable covering out of pocket if it's fully
used every day (lowering a quota is normally self-service and immediate,
unlike raising one). Once a day's cap is hit, Google rejects further
calls for everyone until it resets, and QuickMap detects that and asks
visitors for their own key instead.

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
- **The demo key's quota is a shared, global bucket, not per-visitor.** A
  handful of heavy users can exhaust the day's quota for everyone else —
  there's no per-IP fairness. Adding that would mean proxying calls
  through the Worker with a per-IP counter (e.g. in Workers KV), which is
  a meaningfully bigger change than a Cloud Console setting.
- **Quota-error detection is a text-match heuristic** (`frontend/src/lib/quotaError.ts`),
  not a guaranteed-stable error code, since the exact error shape Google's
  SDKs throw for a Console-level quota rejection isn't consistently
  documented across the Geocoding/Routes/Maps JS APIs. Worst case it just
  shows as a normal error message instead of prompting for a key.

## Further reading (from original notes)

- [usaddress](https://github.com/datamade/usaddress) — the Python address
  parser this project's parsing approach was originally inspired by.
- [Using Google Geocoding and Street View Image APIs with Go](https://medium.com/@IndianGuru/using-google-geocoding-and-street-view-image-apis-with-go-b67bb4841ff0)
