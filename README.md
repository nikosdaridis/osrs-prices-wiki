# OSRS Prices Wiki

> Real-time Old School RuneScape Grand Exchange price dashboard.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Live Site](https://img.shields.io/badge/Live-osrsprices.wiki-2ea44f)](https://osrsprices.wiki)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

## Scripts

| Command                | Description                               |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start the Astro development server        |
| `npm run build`        | Build the static site for production      |
| `npm run preview`      | Preview the production build locally      |
| `npm run check`        | Type-check the project with `astro check` |
| `npm run format`       | Format all files with Prettier            |
| `npm run format:check` | Verify formatting without writing         |
| `npm run test`         | Run the unit test suite once (Vitest)     |
| `npm run test:watch`   | Run tests in watch mode                   |

## Data Source

Price data comes from the [OSRS Wiki Prices API](https://prices.runescape.wiki/api/v1/osrs), consumed in `src/scripts/api.ts` and polled in `src/scripts/poll.ts`:

| Endpoint                                             | Purpose                                        |
| ---------------------------------------------------- | ---------------------------------------------- |
| `/mapping`                                           | Item metadata (name, icon, members, buy limit) |
| `/latest`                                            | Current buy/sell prices and timestamps         |
| `/volumes`                                           | Trading volume data                            |
| `/24h`                                               | 24-hour average prices and volumes             |
| `/timeseries?timestep={5m\|1h\|6h\|24h}&id={itemId}` | Historical price series                        |

Data refreshes on load and every **60 seconds** thereafter. Requests send the `x-application: osrsprices.wiki` header per the API's identification guidelines.

## License

Released under the [MIT License](LICENSE).

## Disclaimer

This project is **not affiliated with, endorsed by, or associated with Jagex Ltd.** Old School RuneScape and RuneScape are trademarks of Jagex Ltd.
