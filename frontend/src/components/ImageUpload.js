import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Upload, ImagePlus, X, Code, ArrowLeft, ExternalLink } from 'lucide-react';
import '../App.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic'];

const ImageUpload = () => {
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDevInfo, setShowDevInfo] = useState(false);
    const [versionInfo, setVersionInfo] = useState(null);
    const [showPhoto, setShowPhoto] = useState(false);
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

    const validateFile = (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error('Invalid file type. Only JPG, PNG and HEIC files are allowed.');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File too large. Maximum size is 5MB.');
        }
        return true;
    };

    const createPreview = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e) => {
        try {
            const selectedFiles = Array.from(e.target.files || []);
            
            if (selectedFiles.length > 2) {
                throw new Error('Maximum of 2 images allowed.');
            }

            // Validate each file
            selectedFiles.forEach(validateFile);

            // Create previews
            const newPreviews = await Promise.all(selectedFiles.map(createPreview));

            setFiles(selectedFiles);
            setPreviews(newPreviews);
            setError(null);
        } catch (err) {
            setError(err.message);
            setFiles([]);
            setPreviews([]);
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0) return;

        setLoading(true);
        setView('analyzing');
        setError(null);
        setAnalysis(null);

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('images', file);
        });

        try {
            const response = await axios.post('http://localhost:5000/api/analyze', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            // Store the full response for debugging
            const result = response.data.results[0];
            setAnalysis({
                ...result.compatibility,
                rawResponse: response.data
            });
            setView('results');
            setShowPhoto(false);
        } catch (err) {
            setError(err.response?.data?.details || err.message || 'Error analyzing images. Please try again.');
            setView('upload');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartOver = () => {
        setFiles([]);
        setPreviews([]);
        setAnalysis(null);
        setError(null);
        setView('upload');
        setShowPhoto(false);
    };

    const dropHandler = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.dataTransfer.files) {
            handleFileChange({ target: { files: e.dataTransfer.files } });
        }
    }, []);

    const dragOverHandler = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const renderContent = () => {
        switch (view) {
            case 'analyzing':
                return (
                    <div className="bordered-container">
                        <div className="step-indicator">Step 2/3</div>
                        <h2 className="section-title">Analyzing Your Photo</h2>
                        <p className="section-description">
                            Please wait while we analyze your thermostat's wiring configuration...
                        </p>
                        <div className="preview-large">
                            <img 
                                src={previews[0]} 
                                alt="Thermostat wiring"
                                className="preview-image-large"
                            />
                            <div className="scanning-line" />
                        </div>
                    </div>
                );

            case 'results':
                return (
                    <div className="bordered-container results-container">
                        <div className="step-indicator">Step 3/3</div>
                        <div className="results-header">
                            <h2 className="section-title">Analysis Results</h2>
                            <div className="flex gap-2">
                                {previews[0] && (
                                    <button
                                        onClick={() => setShowPhoto(!showPhoto)}
                                        className="button btn-outline"
                                    >
                                        <div className="flex items-center gap-2">
                                            {showPhoto ? (
                                                <>
                                                    <X className="w-4 h-4" />
                                                    <span>Hide Thermostat</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowLeft className="w-4 h-4" />
                                                    <span>Show Thermostat</span>
                                                </>
                                            )}
                                        </div>
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDevInfo(!showDevInfo)}
                                    className="button btn-outline"
                                >
                                    <Code className="w-4 h-4 mr-2" />
                                    <span>Debug Info</span>
                                </button>
                            </div>
                        </div>

                        {showPhoto && previews[0] && (
                            <div className="photo-preview">
                                <img 
                                    src={previews[0]} 
                                    alt="Thermostat wiring"
                                    className="preview-image-large"
                                />
                            </div>
                        )}

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
                                        {JSON.stringify(analysis.rawResponse, null, 2)}
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

            default: // 'upload'
                return (
                    <div className="bordered-container">
                        <div className="step-indicator">Step 1/3</div>
                        <div className="content-wrapper">
                            <h1 className="section-title">Upload Your Thermostat Photo</h1>
                            <p className="section-description">
                                Take a clear photo of your thermostat's wiring setup to check compatibility.
                            </p>
                        </div>

                        {previews.length > 0 ? (
                            <div className="preview-container">
                                <div className="preview-section">
                                    <div className="preview-large">
                                        <img
                                            src={previews[0]}
                                            alt="Selected thermostat"
                                            className="preview-image-large"
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(0);
                                            }}
                                            className="remove-button-large"
                                            aria-label="Remove image"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        {view === 'analyzing' && <div className="scanning-line" />}
                                    </div>
                                    
                                    <div className="thumbnails-container">
                                        <div className="thumbnail-item">
                                            <img 
                                                src={previews[0]} 
                                                alt="Thumbnail 1"
                                                className="thumbnail-image"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(0);
                                                }}
                                                className="remove-button-thumbnail"
                                                aria-label="Remove image"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div 
                                            className="thumbnail-upload"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            <ImagePlus className="w-6 h-6" />
                                            <span>Add Photo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="action-section">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSubmit(e);
                                        }}
                                        disabled={loading}
                                        className="button btn-primary-black"
                                    >
                                        {loading ? 'Analyzing...' : 'Check Compatibility'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="upload-area"
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={dropHandler}
                                    onDragOver={dragOverHandler}
                                >
                                    <ImagePlus className="upload-icon" />
                                    <div className="upload-text">
                                        <span className="primary-text">
                                            Drag and drop your image here, or click to select
                                        </span>
                                        <span className="secondary-text">
                                            Supported formats: JPG, PNG, HEIC (max 5MB)
                                        </span>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/jpeg,image/png,image/heic"
                                        className="file-input"
                                        multiple
                                    />
                                </div>
                            </>
                        )}

                    </div>
                );
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="text-center mb-8">
                <h1 className="title">Check Your Thermostat Compatibility</h1>
                <p className="subtitle">
                    Upload a photo of your thermostat's wiring to see if it's compatible with Mysa in 3 easy steps.
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
