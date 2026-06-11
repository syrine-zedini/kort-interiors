import 'dotenv/config';
import app from './app';
import { connectDB } from './config/sequelize';
import './models';

import { seedCategories } from './seed/seedCategories';
import { logRoutes } from './helpers/logRoutes';
import { seedRolesPermissions } from './seed/seedRoles';
import { initializeConfigs } from './services/config.service';

(async () => {
  try {
    await connectDB();
    console.log('✅ DB connectée');


    await initializeConfigs();
    //console.log('✅ Configs initialisées');
    await seedRolesPermissions();
    //await seedCategories();
    logRoutes(app)

    app.listen(process.env.PORT, () =>
      console.log(`🚀 Server running on port ${process.env.PORT}`)
    );
  } catch (err) {
    console.error('❌ Erreur au démarrage :', err);
  }
})();
