Follow these simple steps to run this project locally on your machine after cloning:

### 1. Install Dependencies
Open your terminal inside the `eduverse-backend` folder and run this command to download the required packages:
```bash
npm install



Create .env file and paste this:

PORT=3000
CORS_ORIGIN=http://localhost:3001

# Mock database string to bypass Prisma's initialization check 
# (Replace with the real Supabase string when our tables are finalized)
DATABASE_URL="postgresql://postgres:password@localhost:5432/eduverse_mock?schema=public"


Now, run these last two commands to compile the Prisma configuration and boot up your local server:
# Build the local database client
npx prisma generate

# Start the NestJS backend in development mode
npm run start:dev

Once you see the message 🚀 Eduverse API is running on: http://localhost:3000, your server is officially live and watching for code changes!