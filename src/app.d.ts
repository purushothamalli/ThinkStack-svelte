// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				email: string;
				firstName: string;
				lastName: string;
				profilePic?: string | null;
				createdAt: Date;
			} | null;
			session: {
				id: string;
			} | null;
		}
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
