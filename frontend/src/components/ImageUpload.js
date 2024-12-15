import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Upload, ImagePlus, X, Code } from 'lucide-react';

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
            setAnalysis(response.data);
        } catch (err) {
            setError(err.response?.data?.details || err.message || 'Error analyzing images. Please try again.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">HVAC Compatibility Checker</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDevInfo(!showDevInfo)}
                        className="flex items-center gap-2"
                    >
                        <Code className="w-4 h-4" />
                        Dev Info
                    </Button>
                </div>
                <p className="text-muted-foreground">
                    Upload images of your thermostat to check compatibility
                </p>
                {showDevInfo && versionInfo && (
                    <div className="text-left p-4 bg-muted rounded-lg text-sm">
                        <h3 className="font-medium mb-2">Version Information</h3>
                        <pre className="whitespace-pre-wrap">
                            {JSON.stringify(versionInfo, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            {!loading && !analysis && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div 
                        className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg border-muted hover:border-muted-foreground/50 transition-colors relative"
                        onDrop={dropHandler}
                        onDragOver={dragOverHandler}
                    >
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 bg-secondary rounded-full">
                                <ImagePlus className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Drag and drop your images here, or click to select files
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Supported formats: JPG, PNG, HEIC (max 5MB each)
                                </p>
                            </div>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {previews.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-medium">Selected Files:</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {previews.map((preview, index) => (
                                    <div key={index} className="relative">
                                        <img 
                                            src={preview} 
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-auto object-contain rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={files.length === 0}
                        className="w-full"
                    >
                        Check Compatibility
                    </Button>
                </form>
            )}

            {loading && (
                <div className="analyzing-container">
                    <div className="space-y-4">
                        {previews.map((preview, index) => (
                            <img 
                                key={index}
                                src={preview} 
                                alt={`Analyzing ${index + 1}`}
                                className="image-preview-large"
                            />
                        ))}
                        <div className="analyzing-text">Analyzing your thermostat...</div>
                        <div className="analyzing-bar"></div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 rounded-lg">
                    {error}
                </div>
            )}

            {analysis && (
                <div className="space-y-4">
                    {previews.map((preview, index) => (
                        <img 
                            key={index}
                            src={preview} 
                            alt={`Analysis ${index + 1}`}
                            className="image-preview-large"
                        />
                    ))}
                    <div className="p-6 bg-card text-card-foreground rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold">Analysis Results</h3>
                        {analysis.results && analysis.results.map((result, index) => (
                            <div key={index} className="space-y-4">
                                {index > 0 && <hr className="border-t border-border" />}
                                <div className="space-y-2">
                                    <p><span className="font-medium">Thermostat Type:</span> {result.compatibility.thermostatType}</p>
                                    <p><span className="font-medium">Compatibility:</span> {result.compatibility.compatibility}</p>
                                    <p><span className="font-medium">Confidence:</span> {(result.compatibility.confidence * 100).toFixed(1)}%</p>
                                </div>
                                {result.compatibility.recommendations && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Recommendations:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {result.compatibility.recommendations.map((rec, recIndex) => (
                                                <li key={recIndex} className="text-sm text-muted-foreground">
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {result.summary && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <h4 className="font-medium mb-2">Summary:</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {result.summary}
                                        </p>
                                    </div>
                                )}
                                {showDevInfo && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <h4 className="font-medium mb-2">Raw Analysis:</h4>
                                        <div className="text-sm bg-muted p-4 rounded-lg">
                                            <pre className="whitespace-pre-wrap text-muted-foreground">
                                                {result.analysis}
                                            </pre>
                                        </div>
                                        <div className="mt-4">
                                            <h5 className="font-medium mb-2">Debug Info:</h5>
                                            <pre className="text-sm text-muted-foreground">
                                                {JSON.stringify(result.debug, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {showDevInfo && (
                        <div className="mt-4 pt-4 border-t border-border">
                            <h4 className="font-medium mb-2">Response Overview:</h4>
                            <pre className="text-sm text-muted-foreground">
                                Images Processed: {analysis.count}
                                Total Processing Time: {analysis.totalProcessingTime}ms
                            </pre>
                        </div>
                    )}
                    <Button
                        onClick={() => {
                            setFiles([]);
                            setPreviews([]);
                            setAnalysis(null);
                            setError(null);
                        }}
                        className="w-full"
                    >
                        Analyze Another Thermostat
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
