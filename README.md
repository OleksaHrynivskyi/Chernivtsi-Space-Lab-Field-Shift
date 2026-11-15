# Field Shift

Our project for NASA Space Apps 2026, challenge
[Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/).

Team: Chernivtsi Space Lab.

Field Shift is a website for US farmers. You pick a field on the map, set what matters to you
(water, soil, erosion, income), and the site compares your current crop rotation with three
alternatives. For every option it shows a score, the reasons, the data behind it and what to
check with a local agronomist. It works for the 48 contiguous states. The interface is in
English and Ukrainian.

## How to run

You need Python 3.11+ and Node.js.

Backend (terminal 1):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows. On Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

API docs: http://127.0.0.1:8000/docs

Frontend (terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

Keys go to a `.env` file in the project root (it is not in the repo):

```
EARTHDATA_TOKEN=...   # NASA Earthdata token, needed for SMAP and IMERG
NASS_API_KEY=...      # optional, real USDA prices: https://quickstats.nass.usda.gov/api
```

The three demo fields (Iowa, Kansas, North Carolina) work without keys, their data is saved in `backend/cache`.

## Deploy

The backend can serve the built frontend, so one web service is enough (we use Render).

- Build command: `pip install -r backend/requirements.txt && cd frontend && npm install && npm run build`
- Start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `EARTHDATA_TOKEN`, `NASS_API_KEY`

There is also a `Dockerfile` in the repo root that does the same build (we use it on Railway).

## Data sources

| Source | What we take | Key |
|---|---|---|
| NASA POWER | daily temperature and rain, 2001–2025 | no |
| NASA GPM IMERG | satellite rainfall | Earthdata token |
| NASA SMAP L4 | root-zone soil moisture | Earthdata token |
| NASA MODIS MOD13Q1 (ORNL DAAC) | NDVI at the field point, 250 m | no |
| NASA GIBS | map layers (SMAP, NDVI, IMERG) | no |
| USDA SSURGO | soil at the field point | no |
| USDA Cropland Data Layer | what was grown each year, 2016–2025 | no |
| USDA NASS QuickStats | yields and prices | optional |
| FAO GAEZ v4 | crop water need and deficit, 2011–2040 and 2041–2070 | no |
| USGS The National Map (USDA NAIP) | satellite basemap | no |
| OpenStreetMap Nominatim | place search | no |

## Project structure

```
backend/
  main.py             API endpoints
  services/
    power.py          NASA POWER climate
    earthdata.py      IMERG rainfall and SMAP soil moisture
    ndvi.py           MODIS NDVI
    soil.py           USDA SSURGO soil
    cdl.py            crop history and current rotation
    nass.py           yields and prices
    gaez.py           crop water needs
    strategies.py     rotation options, scores, explanations
    texts.py          texts in English and Ukrainian
    cache.py          JSON file cache
  data/crops.json     crop list
  cache/              saved data for the demo fields
frontend/
  src/pages/          Field, Suggestion, Options, Report, Statistics, How it works
  src/components/     map, calendar, charts
  src/i18n.jsx        translations
```

## API

| Method | URL | Returns |
|---|---|---|
| GET | `/api/field?lat=42.1&lon=-93.55` | climate, soil, current rotation |
| POST | `/api/strategies` | 4 rotation options with scores and explanations |
| GET | `/api/satellite?lat=42.1&lon=-93.55` | IMERG rain and SMAP soil moisture by year |
| GET | `/api/ndvi?lat=42.1&lon=-93.55` | peak NDVI for each season |
| GET | `/api/geocode?q=Ames, Iowa` | coordinates of a place |

## What is our estimate, not data

Some crop traits in `crops.json` (the `estimated` part: heat tolerance, residue, income without
NASS prices, cover crop water use) and the planting and harvest dates are our own estimates.
The score formulas are simple rules and were not checked by agronomists. The tool is meant to
help a farmer think, not to replace local advice.
