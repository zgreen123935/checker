# Mysa HVAC Compatibility Checker

This application helps users determine if their HVAC system is compatible with Mysa products by analyzing images of their thermostat and wiring.

## Features

- Upload images of thermostat (front view and wiring)
- AI-powered analysis using GPT-4 Turbo (multimodal model capable of image and text processing)
- Instant compatibility results
- Detailed recommendations

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- PostgreSQL

## Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Create a `.env` file in the root directory and add your configuration:
   ```
   PORT=5000
   OPENAI_API_KEY=your_api_key_here
   POSTGRES_URI=postgresql://localhost:5432/mysa_compatibility
   NODE_ENV=development
   ```

## Running the Application

1. Start the backend server:
   ```bash
   npm start
   ```
2. In a new terminal, start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```
3. Open your browser and navigate to `http://localhost:3000`

## Development

- Backend server runs on `http://localhost:5000`
- Frontend development server runs on `http://localhost:3000`
- API endpoints:
  - POST `/api/analyze` - Upload and analyze thermostat images
  - GET `/api/health` - Health check endpoint

## UI Architecture

The frontend application follows a component-based architecture with a focus on reusability, maintainability, and consistent design. Here's a detailed breakdown of the UI structure:

### Directory Structure
```
frontend/src/
├── components/
│   ├── layout/           # Layout components
│   │   ├── StepContainer.js
│   │   └── ContentLayout.js
│   ├── shared/          # Reusable components
│   │   ├── Typography.js
│   │   └── UploadArea.js
│   └── steps/           # Step-specific components
│       ├── UploadStep.js
│       ├── AnalysisStep.js
│       └── ResultsStep.js
└── styles/
    └── tokens/          # Design system tokens
        ├── spacing.css
        ├── colors.css
        └── typography.css
```

### Design System

#### 1. Design Tokens
- **Spacing**: Uses a consistent 0.25rem (4px) unit scale
  - xs: 0.5rem (8px)
  - sm: 1rem (16px)
  - md: 1.5rem (24px)
  - lg: 2rem (32px)
  - xl: 2.5rem (40px)
  - 2xl: 3rem (48px)
  - 3xl: 4rem (64px)

- **Colors**:
  - Primary: #E6F7F1 (light mint), #027A48 (dark mint)
  - Gray Scale: #101828 to #F9FAFB
  - Semantic colors for text, borders, and backgrounds

- **Typography**:
  - Font sizes: 0.875rem to 2rem
  - Line heights: 1.1 to 1.5
  - Weights: 400 (normal) to 700 (bold)

#### 2. Component Architecture

##### Layout Components
- **StepContainer**: Main container for each step
  - Consistent padding and border radius
  - Responsive width and height
  - Shadow and border styling

- **ContentLayout**: Manages content spacing
  - Configurable vertical spacing
  - Responsive padding
  - Maintains consistent rhythm

##### Shared Components
- **Typography**:
  - Title: Large headings with consistent spacing
  - Description: Secondary text with max-width for readability
  - StepIndicator: Shows current step progress

- **UploadArea**:
  - Drag and drop functionality
  - File type validation
  - Visual feedback for interactions
  - Responsive sizing

### Responsive Design
- Mobile-first approach
- Breakpoints:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px

### Best Practices
1. **Consistent Spacing**:
   - Use spacing tokens instead of arbitrary values
   - Maintain vertical rhythm with consistent margins

2. **Typography**:
   - Use relative units (rem) for font sizes
   - Maintain readable line lengths
   - Consistent text hierarchy

3. **Color Usage**:
   - Use semantic color variables
   - Ensure sufficient contrast
   - Consistent hover states

4. **Component Props**:
   - Clear prop interfaces
   - Default values for optional props
   - Consistent naming conventions

### State Management
- Uses React's useState for local state
- Step progression:
  1. Upload Step: Handles file selection
  2. Analysis Step: Processes image
  3. Results Step: Displays compatibility

### CSS Architecture
- CSS Modules for component-specific styles
- Design tokens for global variables
- BEM-like naming convention
- Mobile-first media queries

### Accessibility
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Focus management

### Performance Considerations
- Lazy loading for step components
- Optimized image handling
- Minimal CSS bundle size
- Efficient re-renders

This architecture ensures:
- Consistent user experience across all steps
- Easy maintenance and updates
- Scalable component system
- Responsive design across devices
- Accessible user interface

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
