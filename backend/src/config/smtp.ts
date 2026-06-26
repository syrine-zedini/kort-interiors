import dotenv from 'dotenv';
dotenv.config();

export const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,                     
  user: process.env.SMTP_USER || 'alexa.nitzsche@ethereal.email',
  pass: process.env.SMTP_PASSWORD || 'r3yZSwGpVJx8ywD7mZ'         
};
