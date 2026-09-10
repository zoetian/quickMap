# QuickMap

<p align="center"><em>The optimal route from your central point through every stop.</em></p>

<p align="center">
  <a href="https://zoetian.github.io/quickMap/"><strong>Try the live demo →</strong></a>
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

No installation and no account required — open the live demo and plan a
route in under a minute.

<!--
  TODO: add a couple of feature screenshots here, e.g.:
  <p align="center"><img src="docs/screenshots/search.png" alt="Search screen" width="49%"><img src="docs/screenshots/route.png" alt="Route result" width="49%"></p>
-->

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

1. Open [the live demo](https://zoetian.github.io/quickMap/) — no
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
