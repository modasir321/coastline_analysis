import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const getMapData = async () => {
    try {
        const response = await axios.post(`${API_URL}/get-map-data`);
        return response.data;
    } catch (error) {
        console.error('Error fetching map data:', error);
        return null;
    }
};