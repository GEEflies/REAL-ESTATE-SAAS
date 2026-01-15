import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envVars: any = { ...process.env };

// Helper to load env file
function loadEnv(filePath: string) {
    console.log('Loading env from:', filePath);
    if (fs.existsSync(filePath)) {
        const envConfig = fs.readFileSync(filePath, 'utf8');
        envConfig.split('\n').forEach(line => {
            let cleanLine = line.trim();
            if (cleanLine.startsWith('#') || cleanLine === '') return;
            if (cleanLine.startsWith('export ')) cleanLine = cleanLine.substring(7).trim();

            const parts = cleanLine.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                if (key.length > 0) {
                    envVars[key] = value;
                }
            }
        });
    } else {
        console.log('File not found:', filePath);
    }
}

loadEnv(path.resolve(__dirname, '../.env'));
loadEnv(path.resolve(__dirname, '../.env.local'));

console.log('Available Env Keys:', Object.keys(envVars));
if (!envVars.DATABASE_URL) {
    console.error('CRITICAL: DATABASE_URL is missing!');
    process.exit(1);
}

console.log('Running prisma db push with loaded env...');
try {
    execSync('npx prisma db push', {
        stdio: 'inherit',
        env: envVars,
        cwd: path.resolve(__dirname, '..')
    });
} catch (e) {
    console.error('Prisma failed');
    process.exit(1);
}
