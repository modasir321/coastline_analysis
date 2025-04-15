import React from 'react';
import MapComponent from './MapComponent';
import './styles.css';
// Add to your main index.js or App.js
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>PEI Coastal Erosion Analysis</h1>
      </header>
      <MapComponent />
    </div>
  );
}

export default App;