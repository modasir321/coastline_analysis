import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:5000/upload-shapefile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUploadSuccess(response.data.geojson);
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-container">
            <form onSubmit={handleUpload}>
                <input 
                    type="file" 
                    accept=".zip"
                    onChange={(e) => setFile(e.target.files[0])}
                />
                <button type="submit" disabled={!file || loading}>
                    {loading ? 'Uploading...' : 'Upload Shapefile'}
                </button>
            </form>
        </div>
    );
};

export default FileUpload;