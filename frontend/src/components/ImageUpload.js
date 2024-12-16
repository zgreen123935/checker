import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Upload, ImagePlus, X, Code, ArrowLeft, ExternalLink } from 'lucide-react';
import '../App.css';

const ImageUpload = () => {
    const [description, setDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDevInfo, setShowDevInfo] = useState(false);
    const [versionInfo, setVersionInfo] = useState(null);
    const [view, setView] = useState('upload'); // 'upload', 'analyzing', 'results'
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Fetch version info on component mount
        const fetchVersion = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/version');
                setVersionInfo(response.data);
            } catch (err) {
                console.error('Error fetching version:', err);
            }
        };
        fetchVersion();
    }, []);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            setError('Maximum 5 images allowed');
            return;
        }
        setSelectedFiles(files);
        setError(null);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description && selectedFiles.length === 0) {
            setError('Please provide a thermostat description and/or upload images');
            return;
        }

        setLoading(true);
        setView('analyzing');
        setError(null);
        setAnalysis(null);

        try {
            const formData = new FormData();
            formData.append('description', description);
            selectedFiles.forEach(file => {
                formData.append('images', file);
            });

            const response = await axios.post('http://localhost:5000/api/analyze', 
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.data.results && response.data.results.length > 0) {
                setAnalysis(response.data.results[0]);
                setView('results');
            }
        } catch (error) {
            console.error('Error:', error);
            setError(error.response?.data?.error || 'Error analyzing thermostat');
            setView('upload');
        } finally {
            setLoading(false);
        }
    };

    const handleStartOver = () => {
        setDescription('');
        setSelectedFiles([]);
        setAnalysis(null);
        setError(null);
        setView('upload');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const renderUploadForm = () => (
        <div className="space-y-4 w-full max-w-2xl">
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                <h2 className="text-xl font-semibold mb-4">Thermostat Analysis</h2>
                
                {/* Text Description */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                        className="w-full h-32 p-3 border rounded-md"
                        placeholder="Please provide a detailed description of your thermostat, including:
- Wiring terminals and connected wires (labels and colors)
- Display features and buttons
- Model name or number
- Any other visible markings or text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium">Images (Optional)</label>
                    <div className="border-2 border-dashed rounded-lg p-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            multiple
                            className="hidden"
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full justify-center"
                            variant="outline"
                        >
                            <ImagePlus className="w-4 h-4 mr-2" />
                            Upload Images
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                            Upload up to 5 images of your thermostat (optional)
                        </p>
                    </div>

                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <span className="text-sm truncate">{file.name}</span>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={(!description && selectedFiles.length === 0) || loading}
                    className="w-full justify-center"
                >
                    {loading ? 'Analyzing...' : 'Analyze Thermostat'}
                </Button>
            </div>
        </div>
    );

    const renderResults = () => (
        <div className="bordered-container results-container">
            <div className="step-indicator">Step 3/3</div>
            <div className="results-header">
                <h2 className="section-title">Analysis Results</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowDevInfo(!showDevInfo)}
                        className="button btn-outline"
                    >
                        <Code className="w-4 h-4 mr-2" />
                        <span>Debug Info</span>
                    </button>
                </div>
            </div>

            <div className="results-content">
                <div className="result-group">
                    <div className="result-item">
                        <h3 className="result-label">Thermostat Type</h3>
                        <p className="result-value">
                            {analysis.thermostatType || 'Not identifiable from information provided'}
                        </p>
                    </div>

                    <div className="result-item">
                        <h3 className="result-label">Compatibility</h3>
                        <p className={`result-value ${analysis.compatibility === 'Compatible' ? 'text-success' : 'text-error'}`}>
                            {analysis.compatibility || 'Unknown'}
                        </p>
                    </div>

                    <div className="result-item">
                        <h3 className="result-label">Confidence</h3>
                        <p className="result-value">
                            {analysis.confidence ? `${analysis.confidence}%` : 'N/A'}
                        </p>
                    </div>
                </div>

                {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="recommendations-section">
                        <h3 className="result-label">Recommendations</h3>
                        <ul className="recommendations-list">
                            {analysis.recommendations.map((rec, index) => (
                                <li key={index} className="recommendation-item">{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {showDevInfo && (
                    <div className="debug-info mt-4">
                        <h3 className="font-bold mb-2">Raw API Response:</h3>
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                            {JSON.stringify(analysis, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="action-buttons">
                    <button
                        onClick={handleStartOver}
                        className="button btn-outline"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Start Over</span>
                    </button>
                    <a
                        href="https://shop.getmysa.com/products/mysa-v2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button btn-primary-black"
                    >
                        <span>Shop Now</span>
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (view) {
            case 'analyzing':
                return (
                    <div className="bordered-container">
                        <div className="step-indicator">Step 2/3</div>
                        <h2 className="section-title">Analyzing Your Thermostat</h2>
                        <p className="section-description">
                            Please wait while we analyze your thermostat's description...
                        </p>
                    </div>
                );

            case 'results':
                return renderResults();

            default: // 'upload'
                return renderUploadForm();
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="text-center mb-8">
                <h1 className="title">Check Your Thermostat Compatibility</h1>
                <p className="subtitle">
                    Provide a description of your thermostat to see if it's compatible with Mysa in 3 easy steps.
                </p>
            </div>

            {renderContent()}

            {error && (
                <div className="error-container">
                    <div className="error-message">
                        {error}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
