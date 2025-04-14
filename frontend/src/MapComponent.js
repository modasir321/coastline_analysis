import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, ImageOverlay, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import * as turf from '@turf/turf';
import DatePicker from './DatePicker';
import 'leaflet/dist/leaflet.css';
import './styles.css';

const layerStyles = {
  waterBoundary: {
    color: '#00f',
    weight: 2,
    fillOpacity: 0
  },
  studyArea: {
    color: '#ff0000',
    weight: 2
  },
  changeErosion: {
    color: '#ff0000',
    weight: 3,
    dashArray: '5,5',
    fillColor: '#ff0000',
    fillOpacity: 0.3
  },
  changeAccretion: {
    color: '#00ff00',
    weight: 3,
    dashArray: '5,5',
    fillColor: '#00ff00',
    fillOpacity: 0.3
  }
};

const MapComponent = () => {
  const [mapInstance, setMapInstance] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeLayer, setActiveLayer] = useState('change');
  const [selectedPeriod, setSelectedPeriod] = useState('both');

  const handleDateSelect = async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:5000/get-map-data', {
        start_date: startDate,
        end_date: endDate
      });

      if (response.data.error) throw new Error(response.data.error);
      setMapData(response.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      const response = await axios.post('http://localhost:5000/download-change-data', {
        geojson: mapData.water_boundaries
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'coastline_changes.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download change data');
    }
  };

  const simplifyGeometry = (geometry) => {
    try {
      return turf.simplify(turf.feature(geometry), {
        tolerance: 0.001,
        highQuality: true
      }).geometry;
    } catch (e) {
      console.error('Geometry simplification failed:', e);
      return geometry;
    }
  };

  const renderChangeAnalysis = () => {
    if (!mapData?.water_boundaries) return null;

    return (
      <>
        {/* Baseline coastline */}
        {selectedPeriod !== 'comparison' && mapData.water_boundaries.baseline?.features?.map((feature, index) => (
          <GeoJSON
            key={`base-${index}`}
            data={simplifyGeometry(feature.geometry)}
            style={{ ...layerStyles.waterBoundary, color: '#0000ff' }}
          />
        ))}

        {/* Comparison coastline */}
        {selectedPeriod !== 'baseline' && mapData.water_boundaries.comparison?.features?.map((feature, index) => (
          <GeoJSON
            key={`comp-${index}`}
            data={simplifyGeometry(feature.geometry)}
            style={{ ...layerStyles.waterBoundary, color: '#00ff00' }}
          />
        ))}

        {/* Erosion areas */}
        {mapData.water_boundaries.erosion?.features?.map((feature, index) => (
          <GeoJSON
            key={`ero-${index}`}
            data={simplifyGeometry(feature.geometry)}
            style={layerStyles.changeErosion}
          />
        ))}

        {/* Accretion areas */}
        {mapData.water_boundaries.accretion?.features?.map((feature, index) => (
          <GeoJSON
            key={`acc-${index}`}
            data={simplifyGeometry(feature.geometry)}
            style={layerStyles.changeAccretion}
          />
        ))}
      </>
    );
  };

  const renderLayerControls = () => (
    <div className="layer-controls">
      <div className="time-period-selector">
        <button
          className={`time-period-btn ${selectedPeriod === 'both' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('both')}
        >
          Both
        </button>
        <button
          className={`time-period-btn ${selectedPeriod === 'baseline' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('baseline')}
        >
          Baseline
        </button>
        <button
          className={`time-period-btn ${selectedPeriod === 'comparison' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('comparison')}
        >
          Current
        </button>
      </div>

      <button
        className={activeLayer === 'change' ? 'active' : ''}
        onClick={() => setActiveLayer('change')}
      >
        Change Analysis
      </button>
      
      <button
        className={activeLayer === 'rgb' ? 'active' : ''}
        onClick={() => setActiveLayer('rgb')}
      >
        Satellite
      </button>

      {mapData?.water_boundaries && (
        <button
          className="download-btn"
          onClick={handleDownloadData}
        >
          Export Data
        </button>
      )}
    </div>
  );

  const ChangeLegend = () => (
    <div className="change-legend">
      <h4>Legend</h4>
      <div className="legend-item">
        <div className="legend-color" style={{ backgroundColor: '#0000ff' }} />
        <span>2016 Baseline</span>
      </div>
      <div className="legend-item">
        <div className="legend-color" style={{ backgroundColor: '#00ff00' }} />
        <span>Current Coast</span>
      </div>
      <div className="legend-item">
        <div className="legend-color" style={{ backgroundColor: '#ff0000' }} />
        <span>Erosion</span>
      </div>
      <div className="legend-item">
        <div className="legend-color" style={{ backgroundColor: '#00ff00' }} />
        <span>Accretion</span>
      </div>
    </div>
  );

  return (
    <div className="map-container">
      <MapContainer 
        center={[46.5107, -63.4168]}
        zoom={9}
        style={{ height: '600px', width: '100%' }}
        whenCreated={setMapInstance}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {activeLayer === 'rgb' && mapData?.comparison_image && (
          <ImageOverlay
            url={mapData.comparison_image}
            bounds={mapData.bounds}
            opacity={0.8}
          />
        )}

        {activeLayer === 'change' && renderChangeAnalysis()}

        <GeoJSON 
          data={mapData?.geojson}
          style={layerStyles.studyArea}
        />
        <ChangeLegend />
      </MapContainer>

      <div className="sidebar right-sidebar">
        <div className="sidebar-header">
          <h3>Coastal Change Analyzer</h3>
          <DatePicker onDateSelect={handleDateSelect} />
        </div>
        {renderLayerControls()}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          Analyzing coastal changes...
        </div>
      )}
      {error && <div className="error-overlay">{error}</div>}
    </div>
  );
};

export default MapComponent;