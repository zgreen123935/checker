import React from 'react';
import StepContainer from '../layout/StepContainer';
import ContentLayout from '../layout/ContentLayout';
import { Title, Description, StepIndicator } from '../shared/Typography';
import { UploadArea } from '../shared/UploadArea';

const UploadStep = ({ onFileSelect }) => {
  return (
    <StepContainer>
      <StepIndicator step={1} totalSteps={3} />
      <ContentLayout spacing="large">
        <Title>Upload Your Thermostat Photo</Title>
        <Description>
          Take a clear photo of your thermostat's wiring setup to check compatibility.
        </Description>
        <UploadArea onFileSelect={onFileSelect} />
      </ContentLayout>
    </StepContainer>
  );
};

export default UploadStep;
