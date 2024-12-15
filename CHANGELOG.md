# Changelog

All notable changes to the Mysa HVAC Compatibility Checker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Express backend and React frontend
- Basic file structure and configuration
- OpenAI API integration setup
- Image upload functionality
- Basic compatibility analysis endpoint
- Frontend components and styling
- shadcn/ui integration
- Tailwind CSS configuration
- Modern UI components with proper styling
- Drag and drop file upload interface
- Loading states and animations
- Error handling and success messages
- Responsive layout design
- Git version control setup
- GitHub repository initialization (https://github.com/zgreen123935/checker)

### Technical Details

#### Version Control Setup (2024-12-14)
- Initialized Git repository
- Created .gitignore file for Node.js project
- Set up GitHub remote repository
- Configured Git workflow with main branch
- Added initial commit with complete project structure
- Pushed codebase to GitHub

#### Backend Setup (2024-12-14)
- Created Express server with necessary middleware
- Implemented file upload handling with multer
- Added OpenAI integration
- Set up basic API endpoints (/api/analyze, /api/health)
- Added environment variable configuration
- Created uploads directory for temporary image storage

#### Frontend Setup (2024-12-14)
- Initialized React application using Create React App
- Added axios for API communication
- Implemented ImageUpload component
- Added shadcn/ui Button component
- Configured Tailwind CSS
- Added global styles and theme variables
- Implemented responsive layout
- Added drag and drop file upload interface

#### Dependencies Added
- Backend:
  - express
  - cors
  - dotenv
  - openai
  - pg (PostgreSQL client)
  - multer
  - body-parser

- Frontend:
  - axios
  - tailwindcss
  - postcss
  - autoprefixer
  - @radix-ui/react-slot
  - class-variance-authority
  - clsx
  - tailwind-merge
  - lucide-react
  - tailwindcss-animate

#### File Structure
```
/
├── backend/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUpload.js
│   │   │   └── ui/
│   │   │       └── button.jsx
│   │   ├── lib/
│   │   │   └── utils.js
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.js
│   │   └── index.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── uploads/
├── .env
├── package.json
└── README.md
```

### Fixed
- Import path issues with shadcn/ui components
- CSS import configuration
- Port conflicts for development servers

### Pending
- Dark mode toggle implementation
- Database integration
- Additional shadcn/ui components
- Enhanced error handling
- User authentication
- Results storage
- Image optimization
- Test coverage
- GitHub Actions setup for CI/CD
- Issue templates for bug reports and feature requests
- Project documentation in GitHub wiki
- Contributing guidelines
- Security policy
- Development branch setup
- Automated deployment workflow

## [0.2.2] - 2024-12-14

### Added
- Developer features:
  - New Dev Info button in UI
  - Version information display
  - Raw AI analysis view
  - Debug information panel
  - Processing time metrics
- Version tracking:
  - Added version.json for build tracking
  - New /api/version endpoint
  - Build date and environment info

### Changed
- Enhanced AI prompts:
  - Added detailed image description request
  - Increased token limit for more comprehensive analysis
- UI Improvements:
  - Added collapsible dev panel
  - Better formatting for raw analysis display
  - Structured debug information presentation

## [0.2.1] - 2024-12-14

### Changed
- Updated OpenAI integration:
  - Migrated from deprecated gpt-4-vision-preview to gpt-4-turbo model
  - Improved system prompts for better JSON formatting
  - Added natural language responses alongside structured data

### Added
- Enhanced error handling:
  - JSON validation and fallback values
  - Detailed error logging
  - Graceful degradation for parsing failures
  - Field validation for analysis results

### Fixed
- JSON parsing issues in OpenAI responses
- Response format compatibility with GPT-4 Turbo
- Frontend display of detailed analysis text

## [0.2.0] - 2024-12-14

### Added
- Backend improvements:
  - File validation for type (JPG, PNG, HEIC) and size (5MB limit)
  - Automatic file cleanup after processing
  - Health check endpoint (`/api/health`)
  - Environment-aware error details
  - Error handling middleware for multer errors
  - Required dependencies: express, cors, multer, openai, dotenv
  - Uploads directory for file handling

- Frontend enhancements:
  - Drag and drop file upload support
  - Image preview functionality
  - File validation on client side
  - Loading states and improved error feedback
  - Ability to remove selected files
  - Enhanced analysis results display
  - Improved UI components and organization

### Changed
- Refactored server.js for better error handling and organization
- Updated ImageUpload component with modern UI patterns
- Improved error messages for better user experience
- Moved environment configuration to backend directory
- Updated port configuration for development environment

### Fixed
- Port conflicts resolution for development servers
- Environment variable loading in backend
- File upload directory structure

## [0.1.0] - 2024-12-14
### Initial Release
- Basic functionality for HVAC compatibility checking
- Image upload and analysis capabilities
- Modern UI with shadcn/ui components
