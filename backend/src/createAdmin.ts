import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { User, Role } from './models';
import { sequelize } from './config/sequelize';

async function createAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be defined in the .env file');
    }

    await sequelize.authenticate();

    // Ensure the SuperAdmin role exists
    let [role] = await Role.findOrCreate({
      where: { name: 'SuperAdmin' },
      defaults: { description: 'Full access' }
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Find or create admin user
    const [user, created] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        username: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        roleId: role.id,
        IsValid: true,
        is_mobile_auth: true
      }
    });

    if (!created) {
      // Use raw UPDATE to bypass Sequelize class field shadowing bug on is_mobile_auth
      await sequelize.query(
        `UPDATE users SET "roleId" = :roleId, "IsValid" = true, "is_mobile_auth" = true, "password" = :password WHERE email = :email`,
        { replacements: { roleId: role.id, password: hashedPassword, email: adminEmail } }
      );
      console.log('User already existed. Updated to SuperAdmin.');
    } else {
      console.log('New SuperAdmin user created!');
    }

    console.log('---- ADMIN CREATION ----');
    console.log(`Admin user initialized successfully with email: ${adminEmail}`);
    console.log('---------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin:', error);
    process.exit(1);
  }
}

createAdmin();
