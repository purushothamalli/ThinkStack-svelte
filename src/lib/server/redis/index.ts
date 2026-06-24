import { createClient } from 'redis';
import { REDIS_URL } from '$env/static/private';
import { backgroundWorker } from './worker';

export const redis = createClient({ url: REDIS_URL });

redis.on('connect', (a) => {
	console.log('Redis client Connected successfully!', a);
	backgroundWorker().catch((err) => console.error('Failed to run background worker!', err));
});
redis.on('error', (err) => console.log('Redis client connection error!', err));

if (!redis.isOpen) {
	redis.connect();
}
