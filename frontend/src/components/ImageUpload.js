import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Upload, ImagePlus } from 'lucide-react';

const ImageUpload = () => {
    const [files, setFiles] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

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
            setError('Error analyzing images. Please try again.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">HVAC Compatibility Checker</h2>
                <p className="text-muted-foreground">
                    Upload images of your thermostat to check compatibility
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg border-muted hover:border-muted-foreground/50 transition-colors">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-secondary rounded-full">
                            <ImagePlus className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2 text-center">
                            <p className="text-sm text-muted-foreground">
                                Drag and drop your images here, or click to select files
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Supported formats: JPG, PNG, HEIC
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

                {files.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-medium">Selected Files:</h3>
                        <ul className="space-y-2">
                            {files.map((file, index) => (
                                <li key={index} className="text-sm text-muted-foreground">
                                    {file.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={files.length === 0 || loading}
                    className="w-full"
                >
                    {loading ? (
                        <span className="flex items-center space-x-2">
                            <Upload className="w-4 h-4 animate-spin" />
                            <span>Analyzing...</span>
                        </span>
                    ) : (
                        'Check Compatibility'
                    )}
                </Button>
            </form>

            {error && (
                <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 rounded-lg">
                    {error}
                </div>
            )}

            {analysis && (
                <div className="space-y-4 p-6 bg-card text-card-foreground rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold">Analysis Results</h3>
                    <div className="space-y-2">
                        <p><span className="font-medium">Thermostat Type:</span> {analysis.thermostatType}</p>
                        <p><span className="font-medium">Compatibility:</span> {analysis.compatibility}</p>
                        <p><span className="font-medium">Confidence:</span> {(analysis.confidence * 100).toFixed(1)}%</p>
                    </div>
                    {analysis.recommendations && (
                        <div className="space-y-2">
                            <h4 className="font-medium">Recommendations:</h4>
                            <ul className="list-disc list-inside space-y-1">
                                {analysis.recommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-muted-foreground">
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
