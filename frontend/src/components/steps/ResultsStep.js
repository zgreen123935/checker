import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Code } from 'lucide-react';
import StepContainer from '../layout/StepContainer';
import ContentLayout from '../layout/ContentLayout';
import { Title, Description, StepIndicator } from '../shared/Typography';

const ResultsStep = ({ result, onStartOver }) => {
  const [showDevInfo, setShowDevInfo] = useState(false);
  
  if (!result) return null;

  const { error, thermostatType, compatibility, confidence, recommendations } = result;

  return (
    <StepContainer>
      <StepIndicator step={3} totalSteps={3} />
      <ContentLayout spacing="large">
        <div className="flex justify-between items-center">
          <Title>Analysis Results</Title>
          <button
            onClick={() => setShowDevInfo(!showDevInfo)}
            className="button btn-outline"
          >
            <Code className="w-4 h-4 mr-2" />
            <span>Debug Info</span>
          </button>
        </div>
        
        {error ? (
          <>
            <Description className="error-text">
              {error}
            </Description>
            <button 
              onClick={onStartOver}
              className="button button-primary"
            >
              Try Again
            </button>
          </>
        ) : (
          <div className="results-container">
            <div className="results-grid">
              <div className="result-item">
                <h3 className="result-label">Thermostat Type</h3>
                <p className="result-value">
                  {thermostatType || 'Not identifiable from information provided'}
                </p>
              </div>

              <div className="result-item">
                <h3 className="result-label">Compatibility</h3>
                <p className={`result-value ${compatibility === 'Compatible' ? 'text-success' : 'text-error'}`}>
                  {compatibility || 'Unknown'}
                </p>
              </div>

              <div className="result-item">
                <h3 className="result-label">Confidence</h3>
                <p className="result-value">
                  {confidence ? `${Math.round(confidence * 100)}%` : 'N/A'}
                </p>
              </div>
            </div>

            {recommendations && recommendations.length > 0 && (
              <div className="recommendations-section">
                <h3 className="result-label">Recommendations</h3>
                <ul className="recommendations-list">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="recommendation-item">{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {showDevInfo && (
              <div className="debug-info mt-4">
                <h3 className="font-bold mb-2">Raw API Response:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="action-buttons">
              <button
                onClick={onStartOver}
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
        )}
      </ContentLayout>
    </StepContainer>
  );
};

export default ResultsStep;
