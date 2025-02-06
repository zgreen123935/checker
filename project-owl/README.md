This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Project Owl

A Slack integration that uses AI to generate daily project insights, track action items, and identify risks from your project channels.

## Features

- Automatic daily summaries of Slack conversations
- AI-powered identification of action items and risks
- Task tracking with assignees and due dates
- Project context maintenance
- Daily updates posted back to Slack

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL`: SQLite database URL
   - `SLACK_BOT_TOKEN`: Your Slack bot token
   - `OPENAI_API_KEY`: Your OpenAI API key

4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Slack App Setup

1. Create a new Slack app at https://api.slack.com/apps
2. Add the following OAuth scopes:
   - channels:history
   - channels:read
   - chat:write
   - groups:history
3. Install the app to your workspace
4. Copy the Bot User OAuth Token to your .env file

## Running the Sync Job

To manually run the sync job:
```bash
npx ts-node src/scripts/sync-insights.ts
```

For production, set up a cron job to run this script daily.

## Tech Stack

- Next.js with TypeScript
- Prisma with SQLite
- OpenAI API
- Slack Web API
- shadcn/ui components

## License

MIT

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
