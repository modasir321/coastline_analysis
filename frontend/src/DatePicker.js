import React, { useState } from 'react';

const DatePicker = ({ onDateSelect }) => {
    const [endDate, setEndDate] = useState('2023-06-30');

    const handleSubmit = (e) => {
        e.preventDefault();
        onDateSelect(endDate);
    };

    return (
        <div className="date-picker-container">
            <form onSubmit={handleSubmit}>
                <div className="date-input-group">
                    <label>End Date of Analysis:</label>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min="2017-01-01"
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <button type="submit" className="analyze-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z"/>
                    </svg>
                    Analyze Coastal Changes
                </button>
            </form>
        </div>
    );
};

export default DatePicker;