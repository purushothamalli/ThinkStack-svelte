import { EMAIL_USER, EMAIL_PASS } from '$env/static/private';
import { createTransport } from 'nodemailer';

export const transporter = createTransport({
	service: 'gmail',
	auth: {
		user: EMAIL_USER,
		pass: EMAIL_PASS
	}
});
