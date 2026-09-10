<!--
  TODO: add a logo/icon (e.g. docs/icon.svg or docs/icon.png), then
  uncomment this:
  <p align="center">
    <img src="docs/icon.svg" width="96" height="96" alt="QuickMap icon" />
  </p>
-->

<h1 align="center">QuickMap</h1>

<p align="center">
  <strong>The optimal route from your central point through every stop.</strong>
  <br />
  Turn a list of addresses into the fastest way to visit them all.
</p>

<p align="center">
  <a href="https://github.com/zoetian/quickMap/blob/master/LICENSE"><img src="https://img.shields.io/github/license/zoetian/quickMap?style=flat-square&color=5b7fdb" alt="License" /></a>
  <a href="https://github.com/zoetian/quickMap/actions/workflows/deploy-frontend.yml"><img src="https://img.shields.io/github/actions/workflow/status/zoetian/quickMap/deploy-frontend.yml?style=flat-square&label=deploy" alt="Deploy status" /></a>
  <a href="https://zoetian.me/quickMap/"><img src="https://img.shields.io/badge/demo-live-5b7fdb?style=flat-square" alt="Live demo" /></a>
</p>

<p align="center">
  <a href="https://zoetian.me/quickMap/"><strong>Try the live demo →</strong></a>
</p>

<!--
  TODO: add a hero screenshot or short demo GIF here, e.g.:
  <p align="center"><img src="docs/screenshots/hero.png" alt="QuickMap" width="800"></p>
  <p align="center"><img src="docs/demo.gif" alt="QuickMap demo" width="800"></p>
-->

## What is QuickMap?

QuickMap plans the most efficient driving route to visit a list of
stops, starting from a central point you choose. Pull addresses straight
off a webpage, drop pins on the map, or type them in by hand — QuickMap
calculates real driving distances between every stop and finds the
shortest path to cover them all.

A few ways people use it:

- **Real estate showings** — touring several listings or open houses in
  one trip, in the smartest order, starting from wherever you are.
- **Restaurant hopping ✨** — turn a "Top 10 Italian restaurants in Toronto" article into an actual route, and crawl through them without doubling back.
- **Errand-running** — bank, pharmacy, post office, dry cleaner, grocery
  store — knock them all out in the most efficient order from home.
- **Delivery routes** — plan the shortest run across multiple drop-offs,
  whether it's a side gig or a small business handling its own deliveries.

No installation and no account required — open the live demo and plan a
route in under a minute.

<p align="center"><img src="docs/screenshots/search.gif?v=2" alt="Search screen"></p>


## Features

- **Scan a webpage for addresses** — paste a URL and QuickMap extracts
  address-shaped text for you to confirm.
- **Flexible stop entry** — scan a page, click the map, or type an
  address directly.
- **Real route optimization** — uses live driving distances, not
  straight-line estimates, to compute the shortest path through every
  stop.
- **Clear visual results** — the route is drawn on the map alongside an
  ordered, labeled list of stops.
- **Try it instantly** — a built-in demo mode lets you plan a few routes
  with zero setup.

## Getting started

1. Open [the live demo](https://zoetian.me/quickMap/) — no
   signup needed.
2. Set a **central point** — your starting location.
3. Add **stops** by pasting a URL, clicking the map, or typing addresses
   directly.
4. Click **Find best route** to get your optimized route.

If the shared demo reaches its daily limit, QuickMap will prompt you to
bring your own free Google Maps API key so you can keep going.

### Bring your own Google Maps API key

QuickMap runs entirely in your browser — there's no backend server
relaying map requests — so it talks to Google directly using a key. A
free key takes about five minutes to set up and is stored only in your
browser (`localStorage`), never sent anywhere else.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/),
   create a project (or pick an existing one).
2. **APIs & Services → Library**: enable **Maps JavaScript API**,
   **Geocoding API**, and **Routes API**.
3. **APIs & Services → Credentials → Create Credentials → API key**.
4. *(Recommended)* Restrict the key — *Application restrictions* → HTTP
   referrers → add the QuickMap site's URL; *API restrictions* → limit it
   to the three APIs above.
5. Google requires a billing account attached even for free-tier usage;
   normal personal use (a handful of routes) should stay comfortably
   within the monthly free usage included with every account.
6. Paste the key into QuickMap when prompted, or via the "Use your own
   API key" button.

## Development

Want to run QuickMap locally, understand how it works under the hood, or
deploy your own copy? See [DevNotes.md](DevNotes.md).

## Support this project

<p>
  <a href="https://www.buymeacoffee.com/zoetian">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buymeacoffee&logoColor=black" alt="Buy Me a Coffee">
  </a>
</p>

If QuickMap saved you some time, consider buying me a coffee — it helps
cover hosting costs and keeps the live demo running.
