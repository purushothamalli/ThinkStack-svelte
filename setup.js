import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateSecret = () => crypto.randomBytes(32).toString('hex');

async function runSetup() {
    console.log('\n--- 🚀 ThinkStack Setup ---');

    const envPath = path.join(__dirname, '.env');

    if (fs.existsSync(envPath)) {
        console.log('✅ .env already exists. Preserving existing values.');
        console.log('⏩ Skipping .env creation.');
    } else {
        const envContent = `DATABASE_URL="postgresql://user:password@host:port/db-name?sslmode=require"
ACCESS_TOKEN_SECRET="${generateSecret()}"
REFRESH_TOKEN_SECRET="${generateSecret()}"
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_email_app_password"
GROQ_API_KEY="gsk_..."
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
REDIS_URL="redis://127.0.0.1:6379"
`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Created .env with generated JWT secrets and placeholders.');
    }

    console.log('\n✨ Setup Complete! Configure your .env credentials and run "npm run dev".');
}

runSetup().catch(err => {
    console.error('❌ Setup failed:', err);
    process.exit(1);
});
