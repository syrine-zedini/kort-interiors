import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { smtpConfig } from '../config/smtp';
import { User } from '../models';

export const TOKEN_EXP_MINUTES = 1;

// TOKEN EMAIL (long)
export const generateToken = (): string =>
  crypto.randomBytes(32).toString('hex');

// 🔢 OTP SMS 6 chiffres
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// CHECK EXPIRATION
export const isExpired = (sentAt: Date): boolean => {
  const diff = (Date.now() - sentAt.getTime()) / 60000; // en minutes
  return diff > TOKEN_EXP_MINUTES;
};

// SEND EMAIL
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

  await transporter.sendMail({
    from: `"No Reply" <${smtpConfig.user}>`,
    to,
    subject,
    text,
    html,
  });
};

// SEND VALIDATION EMAIL
export const sendValidationEmail = async (user: User) => {
  if (!user.emailValidationToken) {
    throw new Error('User has no validation token');
  }

  const link = `${process.env.BACKEND_URL}/api/auth/validate-email?token=${user.emailValidationToken}`;

  await sendEmail(
    user.email,
    'Validation de compte',
    `Lien valide ${TOKEN_EXP_MINUTES} minutes`,
    `<p>Lien valide <b>${TOKEN_EXP_MINUTES} minutes</b></p>
     <a href="${link}">Valider mon compte</a>`
  );
};
