import { transporter } from '../config/mail';
import { EMAIL_USER } from '$env/static/private';

export interface IEmailService {
	sendResetEmail(email: string, token: string): Promise<void>;
}

class NodeMailerEmailService implements IEmailService {
	public async sendResetEmail(email: string, token: string): Promise<void> {
		await transporter.sendMail({
			from: `"ThinkStack" <${EMAIL_USER}>`,
			to: email,
			subject: 'Reset Password',
			html: `<a href="http://localhost:5173/reset-password/${token}">Reset Password</a>`
		});
	}
}

export const emailService: IEmailService = new NodeMailerEmailService();

// export const emailService = {
// 	sendResetEmail: async (email: string, token: string): Promise<void> => {
// 		await transporter.sendMail({
// 			from: `"ThinkStack" <${EMAIL_USER}>`,
// 			to: email,
// 			subject: 'Reset Password',
// 			html: `<a href="http://localhost:5173/reset-password/${token}">Reset Password</a>`
// 		});
// 	}
// };
