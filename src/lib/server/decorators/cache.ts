import { redis } from '../redis';

export function Cache(prefix: string, ttl: number) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;
		descriptor.value = async function (this: any, ...args: any[]) {
			let cacheKey: string = prefix;
			if (args.length > 0) {
				cacheKey += `:${args.join(':')}`;
			}
			try {
				const cached = await redis.get(cacheKey);
				if (cached !== null && cached !== undefined) {
					return JSON.parse(cached);
				}
			} catch (error) {
				console.error(`Cache get error for key ${cacheKey}:`, error);
			}
			const result = await originalMethod.apply(this, args);
			if (result !== null && result !== undefined) {
				try {
					await redis.set(cacheKey, JSON.stringify(result), {
						expiration: { type: 'EX', value: ttl }
					});
				} catch (error) {
					console.error(`Cache set error for key ${cacheKey}:`, error);
				}
			}
			return result;
		};
	};
}
