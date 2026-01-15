import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
console.log('Loading env from:', envPath);
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            if (!process.env[key] && key.length > 0) {
                process.env[key] = value;
            }
        }
    });
} else {
    console.log('❌ No .env.local found!');
}

async function main() {
    console.log('--- DIAGNOSTIC START ---');

    // Dynamic imports to ensure env vars are loaded first
    // Note: ensure paths are correct properly for tsx
    const { db } = await import('../lib/supabase');
    const { enhanceImageWithMode } = await import('../lib/gemini');

    // 1. Check DB Connection and Users
    try {
        console.log('Checking Users...');

        // Select specific fields that we know exist
        const { data: users, error } = await db
            .from('users')
            .select('email, id, images_used, images_quota, payment_status')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('❌ DB Error fetching users:', error);
        } else {
            console.log('✅ Users found:', users?.length);
            users?.forEach((u: any) => {
                console.log(`- User: ${u.email} | Used: ${u.images_used}/${u.images_quota} | Status: ${u.payment_status}`);
            });
        }
    } catch (e) {
        console.error('❌ DB Exception:', e);
    }

    // 2. Check Gemini API
    try {
        console.log('\nChecking Gemini API (enhanceImageWithMode)...');
        // Valid 1x1 PNG Base64 (black pixel)
        const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgDNjd8qAAAAAElFTkSuQmCC";

        const result = await enhanceImageWithMode(dummyImage, 'full', 'image/png');

        if (result && result.startsWith('data:image')) {
            console.log('✅ Gemini API Success: Returned image data');
            console.log('Sample length:', result.length);
        } else {
            console.log('❓ Gemini API Unexpected Result:', result ? result.substring(0, 50) : 'null');
        }
    } catch (e: any) {
        console.error('❌ Gemini API Failed:', e.message || e);
        if (e.message && e.message.includes('400')) {
            console.log('⚠️  Hint: 400 error often means Invalid API Key, Invalid Project, or Invalid Image Format.');
        }
    }

    console.log('--- DIAGNOSTIC END ---');
}


main().catch(console.error);
