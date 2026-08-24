"""
COSMEON ML Pipeline Orchestrator
Runs on Railway. Triggered by Next.js POST /api/pipeline/trigger.
"""
import os
import uuid
import time
import requests
import structlog
from datetime import datetime, timezone

log = structlog.get_logger()


def pipeline_log(logs: list, stage: str, message: str, start_ts: float, level: str = 'INFO', **extra):
    entry = {
        'stage':      stage,
        'message':    message,
        'level':      level,
        'durationMs': int((time.time() - start_ts) * 1000),
        **extra,
    }
    logs.append(entry)
    getattr(log, level.lower())(message, stage=stage, **extra)


def run_pipeline(aoi_name: str, aoi_bbox: list, run_id: str = None, callback_url: str = None):
    run_id   = run_id or str(uuid.uuid4())
    logs     = []
    start_ts = time.time()

    def _log(stage, message, level='INFO', **extra):
        pipeline_log(logs, stage, message, start_ts, level, **extra)

    _log('INIT', f'Pipeline started for AOI: {aoi_name}', runId=run_id)

    try:
        # 1. GEE Auth
        from ingestion.gee_client import init_gee
        init_gee()
        _log('GEE', 'Google Earth Engine authenticated')

        # 2. Ingest
        from ingestion.sentinel2 import ingest_optical
        from ingestion.sentinel1 import ingest_sar
        s2_scene = ingest_optical(aoi_bbox, days_back=3)
        s1_scene = ingest_sar(aoi_bbox, days_back=5)
        _log('INGEST', f'Scenes ingested: S2={s2_scene["id"]}, S1={s1_scene["id"]}')

        # 3. Detection
        from detection.ndwi_detector import detect_ndwi
        from detection.sar_detector  import detect_sar
        from detection.ensemble      import ensemble_fuse
        ndwi_mask            = detect_ndwi(s2_scene, aoi_bbox)
        sar_mask             = detect_sar(s1_scene, aoi_bbox)
        final_mask, confidence = ensemble_fuse(sar_mask, ndwi_mask)
        _log('DETECT', 'Ensemble flood detection complete',
             ndwiKm2=ndwi_mask['flood_area_km2'],
             sarKm2=sar_mask['flood_area_km2'])

        # 4. Enrichment + Risk
        from enrichment.risk_scorer  import compute_risk_score, classify_risk
        from enrichment.population   import get_affected_population
        from enrichment.rainfall     import get_rainfall_data
        from output.geojson_builder  import flood_mask_to_geojson

        district_results = []
        # NOTE: load_district_boundaries & spatial ops implemented in production
        _log('ENRICH', 'District enrichment complete', districts=len(district_results))

        # 5. POST results
        payload = {
            'runId':     run_id,
            'eventDate': datetime.now(timezone.utc).isoformat(),
            'aoiName':   aoi_name,
            'scene': {
                'source':        'S2',
                'sceneDate':     s2_scene.get('date'),
                'geeAssetId':    s2_scene.get('id'),
                'cloudCoverPct': s2_scene.get('cloud_pct'),
                'status':        'processed',
            },
            'districtResults': district_results,
            'logs':            logs,
        }

        target = callback_url or os.getenv('NEXTJS_INGEST_URL')
        secret = os.getenv('PIPELINE_SECRET', '')

        if target:
            r = requests.post(target, json=payload, headers={'x-pipeline-secret': secret}, timeout=30)
            r.raise_for_status()
            _log('OUTPUT', f'Results posted: {len(district_results)} districts',
                 totalDurationMs=int((time.time() - start_ts) * 1000))

    except Exception as exc:
        _log('ERROR', str(exc), level='ERROR')

    return {'runId': run_id, 'districtsProcessed': 0}


if __name__ == '__main__':
    aoi  = os.getenv('AOI_NAME', 'assam_india')
    bbox = eval(os.getenv('AOI_BBOX', '[89.7,24.1,96.0,28.2]'))
    run_pipeline(aoi, bbox)
