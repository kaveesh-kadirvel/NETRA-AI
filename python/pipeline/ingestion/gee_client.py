"""GEE auth — authenticates with service account in production."""
import ee

def init_gee(project_id: str = None):
    pid = project_id or __import__('os').getenv('GEE_PROJECT_ID')
    try:
        credentials = ee.ServiceAccountCredentials(email=None, key_file='/secrets/gee-key.json')
        ee.Initialize(credentials=credentials, project=pid)
    except Exception:
        ee.Authenticate()
        ee.Initialize(project=pid)
