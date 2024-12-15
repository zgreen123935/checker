import React, { useState } from 'react';
import UploadStep from './components/steps/UploadStep';
import AnalysisStep from './components/steps/AnalysisStep';
import ResultsStep from './components/steps/ResultsStep';
import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleFileSelect = (files) => {
    if (files && files[0]) {
      setUploadedFile(files[0]);
      setCurrentStep(2);
    }
  };

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    setCurrentStep(3);
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setAnalysisResult(null);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <UploadStep onFileSelect={handleFileSelect} />;
      case 2:
        return <AnalysisStep file={uploadedFile} onAnalysisComplete={handleAnalysisComplete} />;
      case 3:
        return <ResultsStep result={analysisResult} onStartOver={handleStartOver} />;
      default:
        return <UploadStep onFileSelect={handleFileSelect} />;
    }
  };

  return (
    <div className="app">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold text-foreground">Mysa HVAC Compatibility Checker</h1>
        </div>
      </header>
      <main className="container mx-auto py-8">
        {renderCurrentStep()}
      </main>
      <footer className="border-t">
        <div className="container mx-auto py-4 text-center text-sm text-muted-foreground">
          2024 Mysa HVAC Compatibility Checker
        </div>
      </footer>
    </div>
  );
}

export default App;
