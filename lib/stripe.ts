
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

if (!stripeSecretKey) {
    console.warn('Missing Stripe Secret Key');
}

export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-12-15.clover', // Using the version typescript expects
    typescript: true,
});
