import { transporter } from '../config/mail';

export const emailService = {
	sendResetEmail: async (email: string, token: string): Promise<void> => {
		await transporter.sendMail({
			from: `"ThinkStack" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: 'Reset Password',
			html: `<a href="http://localhost:5173/reset-password/${token}">Reset Password</a>`
		});
	}
};
