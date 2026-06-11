import 'dotenv/config';
import { connectDB } from '../config/sequelize';
import { seedCategories } from './seedCategories';

(async () => {
    try {
        await connectDB();
        await seedCategories();
        console.log("✅ Seed script finished successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seed script failed:", error);
        process.exit(1);
    }
})();
