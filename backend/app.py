import ee
import geopandas as gpd
import os
import zipfile
import io
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from datetime import datetime
from gee_utils import init_gee

app = Flask(__name__)
CORS(app)

# Initialize Earth Engine
init_gee()

# Configuration
SHAPEFILE_PATH = r"C:\Users\dell\Desktop\Coastline\coastline_analysis\backend\data\pei.shp"

# Load and prepare baseline data (2000 coastline)
gdf = gpd.read_file(SHAPEFILE_PATH).to_crs(epsg=4326)
BASELINE_GEOM = ee.Geometry.MultiPolygon(gdf.geometry[0].__geo_interface__['coordinates'])
BASELINE_GEOJSON = gdf.__geo_interface__

@app.route('/get-baseline', methods=['GET'])
def get_baseline():
    return jsonify(BASELINE_GEOJSON)

@app.route('/get-analysis', methods=['POST'])
def get_analysis():
    try:
        data = request.get_json()
        end_date = data['end_date']
        
        # Validate date
        try:
            parsed_date = datetime.strptime(end_date, '%Y-%m-%d')
            if parsed_date < datetime(2017, 6, 1):
                return jsonify({"error": "Date must be after 2017-06-01"}), 400
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        # Date range (3 month window for better coverage)
        start_date = ee.Date(end_date).advance(-3, 'month')
        
        # Get imagery collection
        collection = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                     .filterBounds(BASELINE_GEOM)
                     .filterDate(start_date, end_date)
                     .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
                     .sort('CLOUDY_PIXEL_PERCENTAGE'))

        if collection.size().getInfo() == 0:
            return jsonify({
                "error": f"No images found between {start_date.format().getInfo()} and {end_date}"
            }), 404

        # Process best image
        image = ee.Image(collection.first())
        
        # Calculate AOI bounds for visualization
        coords = BASELINE_GEOM.bounds().coordinates().getInfo()[0]
        bounds = [
            [coords[0][1], coords[0][0]],  # SW
            [coords[2][1], coords[2][0]] ]   # NE

        # Create RGB visualization (non-clipped but bounded)
        rgb_params = {
            'bands': ['B4', 'B3', 'B2'],
            'min': 0,
            'max': 3000,
            'gamma': 1.2
        }
        rgb_thumbnail = image.visualize(**rgb_params).getThumbURL({
            'region': BASELINE_GEOM,
            'dimensions': 1024,
            'format': 'png'
        })

        # Calculate NDWI water mask
        ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI')
        water_mask = ndwi.gt(0.2).selfMask()

        # Convert water mask to vectors
        vectors = water_mask.reduceToVectors(
            geometry=BASELINE_GEOM,
            scale=10,
            geometryType='polygon',
            maxPixels=1e13
        )

        return jsonify({
            "baseline": BASELINE_GEOJSON,
            "thumbnail": rgb_thumbnail,
            "water_mask": vectors.getInfo(),
            "bounds": bounds
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)