import { DataTypes, Sequelize } from 'sequelize';

export const migrateUsersAddress = async (sequelize: Sequelize) => {
  const qi = sequelize.getQueryInterface();
  const users = await qi.describeTable('users').catch(() => null);

  if (users && !('address' in users)) {
    await qi.addColumn('users', 'address', {
      type: DataTypes.TEXT,
      allowNull: true,
    });
    console.log('✅ Added users.address column');
  }
};
