import React, { useState } from 'react';

const DatePicker = ({ onDateSelect }) => {
    const [endDate, setEndDate] = useState('2023-06-30');

    const handleSubmit = (e) => {
        e.preventDefault();
        onDateSelect(endDate);
    };

    return (
        <div className="date-picker-overlay">
            <div className="date-picker-modal">
                <h3>Coastline Change Analysis</h3>
                <form onSubmit={handleSubmit}>
                    <div className="date-input-group">
                        <label>Select End Date:</label>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min="2017-01-01"
                            max={new Date().toISOString().split('T')[0]}
                        />
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