import ee
import os

# Construct absolute path to the key file
key_file = os.path.join(os.path.dirname(__file__), "credentials", "ee-mohammadmudassir531-49a6534fb225.json")
service_account = "gee-4-9@ee-mohammadmudassir531.iam.gserviceaccount.com"

def init_gee():
    try:
        if not os.path.exists(key_file):
            raise FileNotFoundError(f"GEE Service account key file not found: {key_file}")

        credentials = ee.ServiceAccountCredentials(service_account, key_file)
        ee.Initialize(credentials)
        print("✅ Google Earth Engine Initialized Successfully")
        
    except Exception as e:
        print(f"❌ GEE Initialization Error: {str(e)}")
        raise