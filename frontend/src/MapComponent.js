import React, { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import axios from 'axios';
import DatePicker from './DatePicker';
import 'leaflet/dist/leaflet.css';
import './styles.css';

const MapComponent = () => {
    const [mapData, setMapData] = useState({
        baseline: null,
        current: null,
        erosion: null,
        accretion: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showBaseline, setShowBaseline] = useState(true);

    const layerStyles = {
        baseline: { color: '#ff0000', weight: 2 },
        current: { color: '#0000ff', weight: 2 },
        erosion: { color: '#ff0000', weight: 3, dashArray: '5,5' },
        accretion: { color: '#00ff00', weight: 3, dashArray: '5,5' }
    };

    const handleDateSelect = async (endDate) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('http://localhost:5000/get-map-data', {
                end_date: endDate
            });

            setMapData({
                baseline: response.data.baseline,
                current: response.data.current,
                erosion: response.data.erosion,
                accretion: response.data.accretion
            });

        } catch (error) {
            setError(error.response?.data?.error || "Analysis failed. Try dates between 2017-2023");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="map-container">
            <MapContainer 
                center={[46.5107, -63.4168]}
                zoom={10}
                style={{ height: '100vh', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {/* Conditional rendering of baseline */}
                {showBaseline && mapData.baseline && (
                    <GeoJSON data={mapData.baseline} style={layerStyles.baseline} />
                )}

                {/* Current coastline */}
                {mapData.current && <GeoJSON data={mapData.current} style={layerStyles.current} />}
                
                {/* Changes */}
                {mapData.erosion && <GeoJSON data={mapData.erosion} style={layerStyles.erosion} />}
                {mapData.accretion && <GeoJSON data={mapData.accretion} style={layerStyles.accretion} />}

                {/* Legend remains same */}
            </MapContainer>

            {/* Control Panel Sidebar */}
            <div className="control-panel">
                <div className="control-section">
                    <h3>PEI Coastal Analysis</h3>
                    
                    {/* Baseline Toggle */}
                    <div className="control-item">
                        <label>
                            <input 
                                type="checkbox"
                                checked={showBaseline}
                                onChange={(e) => setShowBaseline(e.target.checked)}
                            />
                            Show 2000 Baseline
                        </label>
                    </div>

                    {/* Date Selection */}
                    <div className="control-item">
                        <h4>Select Sentinel Imagery Date</h4>
                        <DatePicker onDateSelect={handleDateSelect} />
                    </div>

                    {/* Loading/Error States */}
                    {loading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            Loading satellite imagery...
                        </div>
                    )}

                    {error && (
                        <div className="error-state">
                            ⚠️ Error: {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapComponent;