import { Config } from '../models/config.model';
import { parseBooleanValue } from '../helpers/helper';

export const initializeConfigs = async () => {
  const defaultConfigs = [
    { name: 'is_email_auth', value: 'true' },
    { name: 'is_mobile_auth', value: 'false' },
    { name: 'is_email_validation', value: 'true' },
    { name: 'is_mobile_validation', value: 'false' },
    { name: 'smtp_config_file', value: 'config/smtp.ts' },
    { name: 'mobile_config', value: 'config/sms.ts' },
    { name: 'is_valid_disabled', value: 'true' },
    { name: 'roles_to_signup', value: 'user' },

  ];

  for (const cfg of defaultConfigs) {
    const existing = await Config.findOne({ where: { name: cfg.name } });

    if (existing) {
      console.log(`Config "${cfg.name}" existe déjà, pas d'insertion`);
    } else {
      await Config.create({ name: cfg.name, value: cfg.value });
      console.log(` Config "${cfg.name}" insérée avec succès`);
    }
  }

  console.log(' Initialisation des configurations terminée');
};

export const checkConfiguration = async (name: string): Promise<boolean> => {
  const config = await Config.findOne({ where: { name } });
  if (!config) throw new Error(`Config "${name}" introuvable`);
  return parseBooleanValue(config.value);
};
