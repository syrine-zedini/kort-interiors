import bcrypt from 'bcrypt';
import { User, Role } from './models';
import { sequelize } from './config/sequelize';

async function createAdmin() {
  try {
    await sequelize.authenticate();

    // Ensure the SuperAdmin role exists
    let [role] = await Role.findOrCreate({
      where: { name: 'SuperAdmin' },
      defaults: { description: 'Full access' }
    });

    const hashedPassword = await bcrypt.hash('Admin2026!', 10);

    // Find or create admin user
    const [user, created] = await User.findOrCreate({
      where: { email: 'admin@kort.com' },
      defaults: {
        username: 'Admin',
        email: 'admin@kort.com',
        password: hashedPassword,
        roleId: role.id,
        IsValid: true,
        is_mobile_auth: true
      }
    });

    if (!created) {
      // Use raw UPDATE to bypass Sequelize class field shadowing bug on is_mobile_auth
      await sequelize.query(
        `UPDATE users SET "roleId" = :roleId, "IsValid" = true, "is_mobile_auth" = true, "password" = :password WHERE email = 'admin@kort.com'`,
        { replacements: { roleId: role.id, password: hashedPassword } }
      );
      console.log('User already existed. Updated to SuperAdmin.');
    } else {
      console.log('New SuperAdmin user created!');
    }

    console.log('---- ADMIN CREDENTIALS ----');
    console.log('Email: admin@kort.com');
    console.log('Password: Admin2026!');
    console.log('---------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin:', error);
    process.exit(1);
  }
}

createAdmin();
