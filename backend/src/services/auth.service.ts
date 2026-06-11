import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { col, fn, Op, where } from 'sequelize';

import { User, Role } from '../models';
import { Config } from '../models/config.model';
import { checkConfiguration } from './config.service';
import {
  generateToken,
  generateOtp,
  isExpired,
  sendValidationEmail,
  TOKEN_EXP_MINUTES,
} from '../helpers/auth';
import { sendOtpSms } from '../config/sms';


//SIGNUP

interface SignupInput {
  username: string;
  phoneNumber?: string;
  email: string;
  password: string;
  roleName?: string;
}

export const signup = async (data: SignupInput) => {
  const { username, phoneNumber, email, password, roleName } = data;
  const normalizedEmail = email?.trim().toLowerCase();

  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Invalid email format');
  }

  const orConditions: any[] = [{ username }];
  if (phoneNumber) orConditions.push({ phoneNumber });
  if (normalizedEmail) {
    orConditions.push(where(fn('LOWER', col('email')), normalizedEmail));
  }

  const existingUser = await User.findOne({ where: { [Op.or]: orConditions } });
  if (existingUser) throw new Error('Impossible de créer le compte : cet utilisateur existe déjà.');

  const role = roleName
    ? await Role.findOne({ where: { name: roleName } })
    : await Role.findOne({ where: { name: 'user' } });
  if (!role) throw new Error('Role not found');

  const configRoles = await Config.findOne({ where: { name: 'roles_to_signup' } });
  if (configRoles && configRoles.value) {
    const allowedRoles = configRoles.value.split(',').map(r => r.trim());
    if (!allowedRoles.includes(role.name)) throw new Error('Invalid role');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let otpCode = null;
  let otpSentAt = null;
  
  if (phoneNumber) {
    otpCode = generateOtp(); 
    otpSentAt = new Date();
  }

  const user = await User.create({
    username,
    phoneNumber: phoneNumber || null,
    email: normalizedEmail || null,
    password: hashedPassword,
    roleId: role.id,
    IsValid: false,
    emailValidationToken: normalizedEmail ? generateToken() : null,
    validationSentAt: normalizedEmail ? new Date() : null,
    is_mobile_auth: false,
    otpCode: otpCode, 
    otpSentAt: otpSentAt, 

  });

  if (phoneNumber && otpCode) {
    const isMobileValidation = await checkConfiguration('is_mobile_validation');
    if (isMobileValidation) {
      try {
        await sendOtpSms(user.phoneNumber, otpCode);
        return {
          message: 'Signup successful - OTP envoyé sur le téléphone',
          user: {
            validationMethod: 'phoneNumber',
          },
        };
      } catch (err) {
        console.error('Erreur envoi SMS:', err);
        return {
          message: 'Signup successful - OTP généré mais erreur d\'envoi SMS',
          user: {
            validationMethod: 'phoneNumber_error',
          },
        };
      }
    }
  }

  if (normalizedEmail) {
    const isEmailValidation = await checkConfiguration('is_email_validation');
    if (isEmailValidation) {
      await sendValidationEmail(user);

      return {
        message: 'Signup successful - Email de validation envoyé',
        user: {
          validationMethod: 'email',
        },
      };
    }
  }

  const responseMessage = phoneNumber 
    ? 'Signup successful - OTP généré mais validation mobile désactivée' 
    : 'Signup successful';
  
  const validationMethod = phoneNumber ? 'phoneNumber_pending' : null;

  return {
    message: responseMessage,
    user: { 
      id: user.id, 
      validationMethod: validationMethod,
      ...(phoneNumber && { otpSentAt: user.otpSentAt }),
    },
  };
};




export const validateEmail = async (token: string) => {
  const user = await User.findOne({
    where: { emailValidationToken: token },
  });
  if (!user) throw new Error('Invalid token');
  if (!user.validationSentAt || isExpired(user.validationSentAt)) {
    throw new Error('Token expired');
  }

  user.IsValid = true;
  user.validatedAt = new Date();
  user.emailValidationToken = null;

  await user.save();

  return {
    message: 'Account validated successfully',
    validatedAt: user.validatedAt,
  };
};



export const validatePhoneOtp = async (
  phoneNumber: string,
  otp: string
) => {
  const user = await User.findOne({ where: { phoneNumber } });
  if (!user) throw new Error('Utilisateur introuvable');

  if (!user.otpSentAt || isExpired(user.otpSentAt)) {
    throw new Error('OTP expiré');
  }

  if (user.otpCode !== otp) {
    throw new Error('OTP incorrect');
  }

  user.is_mobile_auth = true;
  user.otpCode = null;
  user.otpSentAt = null;

  await user.save();

  return { message: 'Téléphone validé avec succès' };

};



//RESEND EMAIL VALIDATION

export const resendValidation = async (email: string) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('User not found');
  if (user.IsValid) throw new Error('Account already validated');

  if (
    user.emailValidationToken &&
    user.validationSentAt &&
    !isExpired(user.validationSentAt)
  ) {
    return sendValidationEmail(user);
  }

  user.emailValidationToken = generateToken();
  user.validationSentAt = new Date();
  await user.save();
  return sendValidationEmail(user);
};

//RESEND PHONE OTP

export const resendPhoneOtp = async (phoneNumber: string) => {
  const user = await User.findOne({ where: { phoneNumber } });
  if (!user) throw new Error('User not found');
  
  const isMobileValidation = await checkConfiguration('is_mobile_validation');
  if (!isMobileValidation) {
    throw new Error('Validation mobile désactivée');
  }

  const otpCode = generateOtp();
  const otpSentAt = new Date();

  user.otpCode = otpCode;
  user.otpSentAt = otpSentAt;
  await user.save();

  try {
    await sendOtpSms(user.phoneNumber, otpCode);
    return {
      message: 'Nouvel OTP envoyé sur le téléphone',
      otpSentAt: user.otpSentAt,
    };
  } catch (err) {
    console.error('Erreur envoi SMS:', err);
    throw new Error('Erreur lors de l\'envoi du SMS');
  }
};


//LOGIN

interface LoginInput {
  email?: string;
  phoneNumber?: string;
  password: string;
}

export const login = async (data: LoginInput) => {
  const { phoneNumber, email, password } = data;

  let user: any;

  if (phoneNumber) {
    user = await User.findOne({ where: { phoneNumber }, include: [{ model: Role, as: 'role' }] });
  } else if (email) {
    user = await User.findOne({ where: { email }, include: [{ model: Role, as: 'role' }] });
  }

  if (!user) throw new Error('Identifiants invalides');

  const isValidDisabled = await checkConfiguration('is_valid_disabled');
  
  if (!isValidDisabled) {
    const isMobileValidation = await checkConfiguration('is_mobile_validation');
    if (isMobileValidation && !user.is_mobile_auth) {
      throw new Error('Veuillez valider votre téléphone');
    }
    
    const isEmailValidation = await checkConfiguration('is_email_validation');
    if (isEmailValidation && !user.IsValid) {
      throw new Error('Veuillez valider votre email');
    }
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) throw new Error('Identifiants invalides');

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username, role: user.role?.name },
    process.env.JWT_SECRET || 'dridibackupkey',
    { expiresIn: '7d' }
  );

  return {
    message: `Bienvenue ${user.username} !`,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role?.name,
    },
  };
};