import React, { useState } from 'react';

const DatePicker = ({ onDateSelect }) => {
    const [startDate, setStartDate] = useState('2023-06-01');
    const [endDate, setEndDate] = useState('2023-06-30');
    
    // Correct baseline period (matches backend)
    const baselineInfo = {
        start: '2016-06-01',  // Original operational period for Sentinel-2A
        end: '2016-06-30',    // Fixed 1-month baseline
        satellite: 'Sentinel-2A'
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate dates before submission
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
        onDateSelect(startDate, endDate);
    };

    return (
        <div className="date-picker-overlay">
            <div className="date-picker-modal">
                <h3>Coastline Change Analysis</h3>
                <div className="baseline-info">
                    <h4>Baseline Period (Fixed)</h4>
                    <p>
                        {baselineInfo.start} to {baselineInfo.end}<br />
                        <em>({baselineInfo.satellite} imagery)</em>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="period-section">
                        <h4>Comparison Period</h4>
                        <div className="date-input-group">
                            <label>Start Date:</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min="2017-01-01"
                                max={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <div className="date-input-group">
                            <label>End Date:</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                max={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                    </div>

                    <div className="analysis-info">
                        <p>
                            Analysis compares your selected period against<br />
                            June 2016 baseline using Sentinel-2A imagery<br />
                            (PEI region, &lt;30% cloud cover)
                        </p>
                    </div>

                    <button type="submit" className="analyze-button">
                        Analyze Coastal Changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DatePicker;