# Mysa HVAC Compatibility Checker

This application helps users determine if their HVAC system is compatible with Mysa products by analyzing images of their thermostat and wiring.

## Features

- Upload images of thermostat (front view and wiring)
- AI-powered analysis using OpenAI Vision API
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

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
