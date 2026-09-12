# ThinkStack

ThinkStack is a full-stack platform built with SvelteKit, utilizing Prisma, Drizzle ORM, and Redis for background processing.

## Tech Stack
- **Frontend:** SvelteKit, Tailwind CSS
- **Backend:** Node.js, PostgreSQL (Neon), Redis
- **Database:** Prisma (schema), Drizzle ORM (queries)
- **Features:** JWT Authentication, Groq API (AI), Cloudinary (Media), Nodemailer (SMTP)

## Local Development

### 1. Prerequisites
- Node.js (v18+)
- Docker (optional, for running Redis locally)

### 2. Setup
Clone the repository and run the setup script:

```bash
git clone https://github.com/purushothamalli/ThinkStack-svelte.git
cd ThinkStack-svelte
npm install
npm run setup
```

The interactive setup script will automatically generate your local JWT secrets and optionally spin up the Redis container for you.

### 3. Configure `.env`
Ensure you have configured the following secrets in your `.env` file before running the application or pushing the database schema:
- `DATABASE_URL`
- `EMAIL_USER` & `EMAIL_PASS`
- `GROQ_API_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 4. Database Commands
- `npm run db:push` - Pushes the schema to the database (for rapid development)
- `npm run db:generate` - Generates SQL migrations
- `npm run db:migrate` - Applies migrations
- `npm run db:studio` - Launches Drizzle Studio

### 5. Start Application
```bash
npm run dev
```

### 6. Testing
```bash
npm run test:integration
```
