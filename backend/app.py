import os
import ee
from flask import Flask, jsonify, request
from flask_cors import CORS
from gee_utils import init_gee

# Initialize Earth Engine first
try:
    init_gee()
except Exception as e:
    print(f"❌ Failed to initialize GEE: {str(e)}")
    exit(1)

# Then create Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Fixed baseline parameters
BASELINE_START = '2016-06-01'
BASELINE_END = '2016-06-30'
S2A_FILTER = ee.Filter.eq('SATELLITE', 'SENTINEL_2A')

PEI_COORDINATES = [
    [-64.01293242064978, 47.12687596661579],
    [-64.64462485646094, 46.53607701252924],
    [-62.627488382931254, 45.811699006883686],
    [-61.822433063716446, 46.47970667566474],
    [-64.01293242064978, 47.12687596661579]
]

def calculate_ndwi(image):
    return image.normalizedDifference(['B3', 'B8']).rename('NDWI')

@app.route('/get-map-data', methods=['POST'])
def get_map_data():
    try:
        data = request.json
        required_fields = ['start_date', 'end_date']
        
        if not data or any(field not in data for field in required_fields):
            return jsonify({
                "error": "Missing required fields. Send: start_date, end_date"
            }), 400

        # Validate date format
        try:
            ee.Date(data['start_date'])
            ee.Date(data['end_date'])
        except Exception as e:
            return jsonify({"error": f"Invalid date format: {str(e)}"}), 400

        polygon = ee.Geometry.Polygon(PEI_COORDINATES)

        # Process baseline (fixed)
        baseline_collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(polygon)
            .filterDate(BASELINE_START, BASELINE_END)
            .filter(S2A_FILTER)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
        )
        if baseline_collection.size().getInfo() == 0:
            return jsonify({"error": "No baseline images available"}), 500

        # Process comparison period
        comparison_collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(polygon)
            .filterDate(data['start_date'], data['end_date'])
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
        )
        if comparison_collection.size().getInfo() == 0:
            return jsonify({
                "error": f"No images found for {data['start_date']} to {data['end_date']}"
            }), 400

        # Calculate NDWI masks
        baseline_ndwi = baseline_collection.map(calculate_ndwi).median().gt(0.2)
        comparison_ndwi = comparison_collection.map(calculate_ndwi).median().gt(0.2)

        # Convert to vectors
        baseline_vectors = baseline_ndwi.reduceToVectors(
            geometry=polygon,
            scale=100,
            geometryType='polygon',
            maxPixels=1e10
        )
        
        comparison_vectors = comparison_ndwi.reduceToVectors(
            geometry=polygon,
            scale=100,
            geometryType='polygon',
            maxPixels=1e10
        )

        # Calculate changes
        baseline_geom = baseline_vectors.geometry(maxError=100)
        comparison_geom = comparison_vectors.geometry(maxError=100)
        
        erosion = baseline_geom.difference(comparison_geom, maxError=100)
        accretion = comparison_geom.difference(baseline_geom, maxError=100)

        # Visualization parameters
        vis_params = {
            'min': 0,
            'max': 3000,
            'bands': ['B4', 'B3', 'B2'],
            'region': polygon,
            'dimensions': 1024,
            'format': 'png'
        }

        # Get bounds
        bounds = polygon.bounds().getInfo()['coordinates'][0]
        southwest = bounds[0]
        northeast = bounds[2]

        return jsonify({
            "baseline_info": {
                "start": BASELINE_START,
                "end": BASELINE_END,
                "satellite": "Sentinel-2A"
            },
            "comparison_image": ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                               .filterDate(data['start_date'], data['end_date'])
                               .median().getThumbURL(vis_params),
            "bounds": [
                [southwest[1], southwest[0]],
                [northeast[1], northeast[0]]
            ],
            "water_boundaries": {
                "baseline": baseline_vectors.getInfo(),
                "comparison": comparison_vectors.getInfo(),
                "erosion": erosion.getInfo() if erosion else None,
                "accretion": accretion.getInfo() if accretion else None
            }
        })

    except Exception as e:
        print(f"Server Error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)