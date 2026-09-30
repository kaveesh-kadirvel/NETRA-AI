"""GEE auth — authenticates with service account in production."""
import json
import os

import ee

def init_gee(project_id: str = None):
    pid = project_id or os.getenv('GEE_PROJECT_ID')
    key_json = os.getenv('GEE_SERVICE_ACCOUNT_JSON')
    if key_json:
        service_account = json.loads(key_json)
        credentials = ee.ServiceAccountCredentials(
            email=service_account['client_email'],
            key_data=key_json,
        )
        ee.Initialize(credentials=credentials, project=pid)
        return

    ee.Initialize(project=pid)
