import ee
import geopandas as gpd
from flask import Flask, jsonify, request
from flask_cors import CORS
from gee_utils import init_gee

app = Flask(__name__)
CORS(app)

# Initialize Earth Engine
init_gee()

# Load and prepare baseline shapefile
SHAPEFILE_PATH = r"C:\Users\dell\Desktop\Coastline\coastline_analysis\backend\data\pei.shp"
gdf = gpd.read_file(SHAPEFILE_PATH).to_crs(epsg=4326)
BASELINE_GEOM = ee.Geometry.MultiPolygon(gdf.geometry[0].__geo_interface__['coordinates'])
BASELINE_GEOJSON = gdf.__geo_interface__

def calculate_ndwi(image):
    return image.normalizedDifference(['B3', 'B8']).rename('NDWI')

@app.route('/get-map-data', methods=['POST'])
def get_map_data():
    try:
        data = request.get_json()
        if not data or 'end_date' not in data:
            return jsonify({"error": "Missing end_date parameter"}), 400

        end_date = data['end_date']
        start_date = ee.Date(end_date).advance(-1, 'year').format().getInfo()

        # Get Sentinel-2 imagery
        collection = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                     .filterBounds(BASELINE_GEOM)
                     .filterDate(start_date, end_date)
                     .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20)))

        if collection.size().getInfo() == 0:
            return jsonify({"error": "No clear images available for selected dates"}), 404

        # Create water mask and convert to vectors
        water_mask = collection.map(calculate_ndwi).median().gt(0.2)
        vectors = water_mask.reduceToVectors(
            geometry=BASELINE_GEOM,
            scale=10,
            geometryType='polygon',
            maxPixels=1e13
        )

        # Compare with baseline
        current_geom = vectors.geometry(maxError=1)
        erosion = BASELINE_GEOM.difference(current_geom, maxError=1)
        accretion = current_geom.difference(BASELINE_GEOM, maxError=1)

        return jsonify({
            "baseline": BASELINE_GEOJSON,
            "current": vectors.getInfo(),
            "erosion": erosion.getInfo(),
            "accretion": accretion.getInfo()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)