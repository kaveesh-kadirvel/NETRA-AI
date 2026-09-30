# Vercel Deployment

## Service layout

- `app` is the only public service. The top-level catch-all rewrite routes all public paths to Next.js.
- `python` is a private FastAPI service. The app has a Vercel service binding that injects `PYTHON_PIPELINE_URL`; there is no public rewrite for Python.
- `cosmeon` is a private Vercel container running the existing Streamlit app. It has no public rewrite and no binding to the app. Its Streamlit interface is not a durable processing API.

Vercel Services and container images are currently gated platform features. Enable both for the Vercel project before deployment. The Python trigger runs inside a function request with a configured 300-second maximum; this is not a persistent worker or queue.

## Verified blockers

The FastAPI service preserves the existing `/trigger` request shape and invokes `pipeline.orchestrator.run_pipeline`. That orchestrator references modules not present in this repository (`pipeline.ingestion.sentinel1`, `pipeline.ingestion.sentinel2`, the `pipeline.detection` package, several enrichment modules, and `pipeline.output`). It also has no implemented district-boundary enrichment. The orchestrator now fails explicitly instead of posting empty results or claiming success. The HTTP endpoint and health route can start, but real trigger processing requires those modules to be implemented and tested.

Studio analysis needs durable job state and processing time beyond a detached Vercel request. `app/api/studio/run` and `app/api/studio/job/[id]` therefore proxy to a separately deployed persistent worker. `app/api/studio/pixel-grid` and `app/api/studio/pdf` proxy to a private COSMEON API. These are not implemented by the Streamlit UI or configured by this repository; the routes return `503` until those endpoints and credentials are configured. The job API contract is `POST /jobs` returning the existing `{ job_id, status }` shape, and `GET /jobs/{id}` returning `{ status, result?, error? }`. Both require Bearer authentication. The COSMEON API contract is authenticated `POST /pixel-grid` returning the existing JSON result and `POST /pdf` returning PDF bytes.

Vercel functions and container images have finite request limits and can scale down. Do not use the Streamlit container or an in-process task as a long-running queue. Host the durable worker on a persistent worker platform or adopt and configure a durable Vercel Workflows/Queues consumer before enabling these processing features.

## Startup commands

From the repository root:

```powershell
npm install
npm run dev
```

For the Python service locally:

```powershell
python -m pip install -r python/requirements.txt
python -m uvicorn app:app --app-dir python --host 127.0.0.1 --port 8000
```

For the existing Streamlit UI locally:

```powershell
python -m pip install -r cosmeon/requirements.txt
python -m streamlit run cosmeon/app.py --server.address 127.0.0.1 --server.port 8501
```

Vercel builds the COSMEON container from `cosmeon/Dockerfile.vercel`. It runs `streamlit run cosmeon/app.py` bound to the platform-provided `PORT`.

## Environment variables

Set secrets in Vercel Project Settings, never in `vercel.json` or source. `PYTHON_PIPELINE_URL` is injected by the service binding and should not be entered manually. `VERCEL_URL` is supplied by Vercel.

| Name | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string used by the Next.js app and seed scripts. |
| `PYTHON_PIPELINE_URL` | Vercel-generated private app-to-Python service URL. |
| `PIPELINE_API_KEY` | Shared app/Python secret for authenticating `POST /trigger` using `x-api-key`. |
| `PIPELINE_SECRET` | Shared app/Python callback secret; Python sends `x-pipeline-secret`, which `/api/pipeline/ingest` verifies. |
| `GEE_PROJECT_ID` | Google Earth Engine project identifier. |
| `GEE_SERVICE_ACCOUNT_JSON` | Google service-account JSON for noninteractive Earth Engine authentication. |
| `NEXTJS_INGEST_URL` | Full app callback URL for standalone Python runners; not needed for the Next-triggered request, which receives a callback URL. |
| `NEXT_PUBLIC_APP_URL` | Optional app origin for local/non-Vercel deployments; Vercel deployments prefer the generated `VERCEL_URL`. |
| `NEXTAUTH_URL` | Optional app origin fallback used by existing auth/email integrations. |
| `STUDIO_JOB_API_URL` | Private base URL of the separately hosted persistent Studio job API. |
| `STUDIO_JOB_API_TOKEN` | Bearer token for the Studio job API. |
| `COSMEON_API_URL` | Private base URL of the separately hosted COSMEON HTTP API for pixel-grid and PDF actions. |
| `COSMEON_API_TOKEN` | Bearer token for the COSMEON HTTP API. |
| `NASA_FIRMS_MAP_KEY` | NASA FIRMS API key used for live fire data. |
| `NASA_EARTHDATA_USERNAME` | Optional NASA Earthdata account name used by the standalone NASA connectivity diagnostic. |
| `NASA_EARTHDATA_PASSWORD` | Optional NASA Earthdata account password used by that diagnostic. |
| `GROQ_API_KEY` | Groq credential for Studio AI chat. |
| `GOOGLE_TRANSLATE_API_KEY` | Google Translate API credential. |
| `SMTP_HOST` | SMTP server hostname for email alerts. |
| `SMTP_PORT` | SMTP server port; defaults to 587 in code. |
| `SMTP_USER` | SMTP account username and default sender/recipient. |
| `SMTP_PASSWORD` or `SMTP_PASS` | SMTP account password. |
| `ALERT_EMAIL` | Optional email alert recipient. |
| `TELEGRAM_BOT_TOKEN` | Telegram bot credential for notifications and webhook calls. |
| `TELEGRAM_CHAT_ID` | Telegram destination chat. |
| `OPENMETEO_FORECAST_URL` | Optional override for the Open-Meteo forecast endpoint used by the standalone runner. |
| `AOI_BBOX` | Optional JSON bounding box for standalone Python runs. |
| `EVENT_DATE` | Optional event date for the standalone Python runner. |

`.env.local` remains ignored by Git. Never commit its contents.

## Manual deployment actions

1. Enable Vercel Services and Container Images for the project and connect the repository at its root.
2. Add the production variables above to the appropriate service environments. Keep `PIPELINE_API_KEY` in app and Python; keep `PIPELINE_SECRET` in app and every callback-producing worker.
3. Configure MongoDB Atlas network access for Vercel egress and verify the Atlas user/database permissions. Vercel egress IPs may be dynamic unless static egress is configured.
4. Rotate the Atlas credential that was embedded in `geo_seeder.js` and the NASA FIRMS key that was embedded in the fire route before this change. Do not reuse the exposed credentials.
5. Deploy the persistent Studio job API and COSMEON HTTP API on a private-capable worker platform, then set their URL/token variables. Do not point these variables at the Streamlit UI.
6. Complete and test the missing Python orchestrator modules before enabling real pipeline triggers.
7. Confirm the intended public routing and service bindings: catch-all public traffic to `app`, with app-to-python binding only; no public route to `python` or `cosmeon`.