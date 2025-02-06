# Project Owl Data Flow Documentation

## Database Schema

### Core Models
1. `Channel`
   - Represents a Slack channel
   - Fields: id, name, purpose, lastUpdated
   - Has one-to-many relationships with messages and batches
   - Has one-to-one relationship with analysis

2. `Analysis`
   - Stores analysis results for a channel
   - Fields: id, channelId, summary, decisions, actionItems, risks, lastUpdated
   - Connected to a specific message batch
   - One-to-one relationship with Channel

3. `SlackMessage`
   - Individual messages from Slack
   - Fields: id, ts (Slack timestamp), channelId, userId, text, threadTs
   - Connected to both Channel and SlackUser

4. `SlackUser`
   - Slack user information
   - Fields: id, username, realName, email, updatedAt
   - Has many messages

## Data Flow Sequences

### 1. Channel Loading Flow
```mermaid
sequenceDiagram
    Client->>+API: GET /api/channels
    API->>Database: Query channels
    alt No channels found
        API->>Slack API: List channels
        Slack API-->>API: Channel list
        API->>Database: Store channels
    end
    Database-->>API: Channel data
    API-->>-Client: Channel list
```

### 2. Analysis Loading Flow
```mermaid
sequenceDiagram
    Client->>+API: GET /api/channels/{channelId}/analysis
    API->>Database: Query analysis
    alt Analysis not found
        API-->>Client: 404 Not Found
    else Analysis exists
        Database-->>API: Analysis data
        API-->>-Client: Formatted analysis
    end
```

### 3. Analysis Refresh Flow
```mermaid
sequenceDiagram
    Client->>+API: POST /api/analysis/refresh
    API->>Slack API: Fetch messages
    Slack API-->>API: Channel messages
    API->>OpenAI API: Generate analysis
    OpenAI API-->>API: Analysis results
    API->>Database: Store analysis
    API-->>-Client: Success response
```

## Key API Endpoints

### 1. `/api/channels` (GET)
- Purpose: List all channels
- Flow:
  1. Checks database for existing channels
  2. If none found, fetches from Slack API
  3. Stores new channels in database
  4. Returns channel list to client

### 2. `/api/channels/{channelId}/analysis` (GET)
- Purpose: Get analysis for a specific channel
- Flow:
  1. Validates channel exists
  2. Retrieves analysis from database
  3. Formats response with tasks, risks, and decisions
  4. Returns 404 if no analysis found

### 3. `/api/analysis/refresh` (POST)
- Purpose: Generate new analysis for a channel
- Flow:
  1. Fetches recent messages from Slack
  2. Creates a new message batch
  3. Sends to OpenAI for analysis
  4. Stores results in database

## Environment Configuration

Required environment variables:
```env
DATABASE_URL="postgresql://user@localhost:5432/dbname"
OPENAI_API_KEY="your-openai-key"
SLACK_BOT_TOKEN="xoxb-your-bot-token"
SLACK_SIGNING_SECRET="your-signing-secret"
SLACK_APP_ID="A0XXXXXX"
```

## Frontend Components

### Main Page (`/channels/page.tsx`)
1. Loads channels on mount
2. Fetches analysis when channel selected
3. Displays:
   - Channel list
   - Analysis summary
   - Tasks table with:
     - Checkboxes for selection
     - Status badges
     - Priority indicators
   - Risks and decisions sections

## Error Handling

1. Database Connection
   - Validates connection on startup
   - Returns 500 if connection fails

2. Slack API
   - Validates token before requests
   - Handles rate limiting
   - Returns appropriate error codes

3. Analysis
   - Returns 404 if not found
   - Handles empty message batches
   - Validates analysis format

## Data Refresh Strategy

1. Channels
   - Cached in database
   - Refreshed when none found
   - Manual refresh available

2. Analysis
   - Generated on demand
   - Stored with message batch reference
   - Can be refreshed manually

## Security Notes

1. Environment Variables
   - Stored securely in .env
   - Not exposed to client
   - Different values for dev/prod

2. API Routes
   - Validate inputs
   - Check permissions
   - Rate limited where appropriate
