import hmac
import os
from typing import Annotated

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from pipeline.orchestrator import run_pipeline

app = FastAPI(title="NETRA Pipeline Service")


class PipelineTrigger(BaseModel):
    aoi_name: str = Field(alias="aoiName", min_length=1, max_length=200)
    aoi_bbox: tuple[float, float, float, float] = Field(
        default=(89.7, 24.1, 96.0, 28.2), alias="aoiBbox"
    )
    run_id: str | None = Field(default=None, alias="runId")
    callback_url: HttpUrl = Field(alias="callbackUrl")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/trigger")
def trigger_pipeline(
    payload: PipelineTrigger,
    api_key: Annotated[str | None, Header(alias="x-api-key")] = None,
) -> dict[str, object]:
    expected_key = os.getenv("PIPELINE_API_KEY")
    if not expected_key:
        raise HTTPException(status_code=503, detail="Pipeline authentication is not configured")
    if not api_key or not hmac.compare_digest(api_key, expected_key):
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        return run_pipeline(
            aoi_name=payload.aoi_name,
            aoi_bbox=list(payload.aoi_bbox),
            run_id=payload.run_id,
            callback_url=str(payload.callback_url),
        )
    except Exception as exc:
        print(f"Pipeline execution failed: {type(exc).__name__}: {exc}")
        raise HTTPException(status_code=502, detail="Pipeline processing failed") from exc