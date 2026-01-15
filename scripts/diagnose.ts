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

        const { data: users, error } = await db
            .from('users')
            .select('email, id, images_used, images_quota, subscription_status')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('❌ DB Error fetching users:', error);
        } else {
            console.log('✅ Users found:', users?.length);
            users?.forEach((u: any) => {
                console.log(`- User: ${u.email} | Used: ${u.images_used}/${u.images_quota} | Status: ${u.subscription_status}`);
            });
        }
    } catch (e) {
        console.error('❌ DB Exception:', e);
    }

    // 2. Check Gemini API
    try {
        console.log('\nChecking Gemini API (enhanceImageWithMode)...');
        // A tiny white 1x1 pixel base64 jpeg
        const dummyImage = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9ALAAAAAABAAEAAAICT/8AAgABAA=="

        const result = await enhanceImageWithMode(dummyImage, 'full', 'image/jpeg');

        if (result && result.startsWith('data:image')) {
            console.log('✅ Gemini API Success: Returned image data');
            console.log('Sample length:', result.length);
        } else {
            console.log('❓ Gemini API Unexpected Result:', result ? result.substring(0, 50) : 'null');
        }
    } catch (e) {
        console.error('❌ Gemini API Failed:', e);
    }

    console.log('--- DIAGNOSTIC END ---');
}

main().catch(console.error);
