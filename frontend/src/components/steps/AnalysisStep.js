import React, { useEffect } from 'react';
import axios from 'axios';
import StepContainer from '../layout/StepContainer';
import ContentLayout from '../layout/ContentLayout';
import { Title, Description, StepIndicator } from '../shared/Typography';

const AnalysisStep = ({ file, onAnalysisComplete }) => {
  useEffect(() => {
    const analyzeImage = async () => {
      try {
        const formData = new FormData();
        formData.append('images', file);

        const response = await axios.post('http://localhost:5000/api/analyze', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Extract the compatibility data from the first result and include raw response
        const result = response.data.results[0];
        onAnalysisComplete({
          ...result.compatibility,
          rawResponse: response.data
        });
      } catch (error) {
        console.error('Error analyzing image:', error);
        onAnalysisComplete({ error: error.response?.data?.details || 'Error analyzing image' });
      }
    };

    if (file) {
      analyzeImage();
    }
  }, [file, onAnalysisComplete]);

  return (
    <StepContainer>
      <StepIndicator step={2} totalSteps={3} />
      <ContentLayout spacing="large">
        <Title>Analyzing Your Photo</Title>
        <Description>
          Please wait while we analyze your thermostat's wiring configuration...
        </Description>
        {file && (
          <div className="preview-container">
            <div className="preview-large">
              <img
                src={URL.createObjectURL(file)}
                alt="Uploaded thermostat"
                className="preview-image"
              />
              <div className="scanning-line" />
            </div>
          </div>
        )}
      </ContentLayout>
    </StepContainer>
  );
};

export default AnalysisStep;
