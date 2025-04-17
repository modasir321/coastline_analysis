import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, ImageOverlay } from 'react-leaflet';
import axios from 'axios';
import DatePicker from './DatePicker';
import 'leaflet/dist/leaflet.css';
import './styles.css';

const MapComponent = () => {
    const [mapData, setMapData] = useState({
        baseline: null,
        thumbnail: null,
        waterMask: null,
        bounds: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load baseline on mount
    useEffect(() => {
        const loadBaseline = async () => {
            try {
                const response = await axios.get('http://localhost:5000/get-baseline');
                setMapData(prev => ({
                    ...prev,
                    baseline: response.data
                }));
            } catch (error) {
                console.error('Failed to load baseline:', error);
                setError("Failed to load 2000 coastline data");
            }
        };
        loadBaseline();
    }, []);

    const handleAnalyze = async (endDate) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('http://localhost:5000/get-analysis', {
                end_date: endDate
            });

            setMapData(prev => ({
                ...prev,
                thumbnail: response.data.thumbnail,
                waterMask: response.data.water_mask,
                bounds: response.data.bounds
            }));

        } catch (error) {
            const errorMsg = error.response?.data?.error || 
                            error.message || 
                            "Analysis failed. Try dates between 2017-06-01 and today";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="map-container">
            <MapContainer 
                bounds={mapData.bounds}  // Auto-zoom to AOI
                style={{ height: '100vh', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {/* 2000 Baseline Coastline */}
                {mapData.baseline && (
                    <GeoJSON 
                        data={mapData.baseline}
                        style={{
                            color: '#ff0000',
                            weight: 3,
                            fillColor: '#ff0000',
                            fillOpacity: 0.1
                        }}
                        onEachFeature={(feature, layer) => {
                            layer.bindTooltip("2000 Baseline Coastline");
                        }}
                    />
                )}

                {/* Satellite Imagery Overlay */}
                {mapData.thumbnail && mapData.bounds && (
                    <ImageOverlay 
                        url={mapData.thumbnail}
                        bounds={mapData.bounds}
                        opacity={0.9}
                    />
                )}

                {/* Water Mask */}
                {mapData.waterMask && (
                    <GeoJSON 
                        data={mapData.waterMask}
                        style={{
                            color: '#0000ff',
                            weight: 2,
                            fillColor: '#0000ff',
                            fillOpacity: 0.3
                        }}
                    />
                )}

                {/* Control Panel */}
                <div className="control-panel">
                    <div className="control-section">
                        <h3>Coastal Change Analysis</h3>
                        <DatePicker onDateSelect={handleAnalyze} />
                        
                        {loading && (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                Analyzing Satellite Imagery...
                            </div>
                        )}

                        {error && (
                            <div className="error-state">
                                ⚠️ {error}
                            </div>
                        )}
                    </div>
                </div>
            </MapContainer>
        </div>
    );
};

export default MapComponent;