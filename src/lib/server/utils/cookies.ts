import { type Cookies } from '@sveltejs/kit';
export const setCookies = (cookies: Cookies, accessToken: string, refreshToken: string): void => {
	cookies.set('accessToken', accessToken, {
		path: '/',
		httpOnly: true,
		secure: true,
		maxAge: 60 * 15
	});
	cookies.set('refreshToken', refreshToken, {
		path: '/',
		httpOnly: true,
		secure: true,
		maxAge: 60 * 60 * 24 * 7
	});
};
export const deleteCookies = (cookies: Cookies): void => {
	cookies.delete('accessToken', { path: '/' });
	cookies.delete('refreshToken', { path: '/' });
};
