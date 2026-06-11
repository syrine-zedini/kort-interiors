import nodemailer from 'nodemailer';
import { smtpConfig } from '../config/smtp';

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
) => {
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: false, 
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  try {
    await transporter.sendMail({
      from: `"No Reply" <${smtpConfig.user}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Email envoyé à ${to}`);
  } catch (err: any) {
    console.error('❌ Erreur SMTP :', err.message);
  }
};
