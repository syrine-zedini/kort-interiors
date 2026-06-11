import { ProductCategory } from '../models';
import { sequelize } from '../config/sequelize';

interface CategorySeed {
    name: string;
    children: string[];
}

const categories: CategorySeed[] = [
    { name: 'La Chambre', children: ['Parure de lit', 'Housse de couette', 'Taie', 'Drap plat', 'Drap housse'] },
    { name: 'Literie', children: ['Couette', 'Oreiller', 'Protège-oreiller', 'Protège-matelas'] },
    { name: 'Art de Table', children: ['Nappe et serviettes', 'Tous nos nappes'] },
    { name: 'Le Bain', children: ['Peignoir', 'Serviette de bain'] },
    { name: 'Décoration', children: ['Plateau', 'Housse de coussin', 'Plaid'] },
    { name: 'Nouveautés', children: [] },
    { name: 'Outlet', children: [] },
];

export const seedCategories = async () => {
    try {
        for (const category of categories) {
            // Créer la catégorie principale si elle n'existe pas
            const [parent] = await ProductCategory.findOrCreate({
                where: { name: category.name },
                defaults: { name: category.name },
            });

            // Créer les sous-catégories si elles n'existent pas et les lier au parent
            for (const childName of category.children) {
                const [child] = await ProductCategory.findOrCreate({
                    where: { name: childName },
                    defaults: { name: childName },
                });

                // Vérifier si le lien parent-enfant existe déjà pour éviter doublon
                const children = await parent.getChildren!({ where: { id: child.id } });
                if (children.length === 0) {
                    await child.addParent!(parent);
                }
            }
        }

        console.log('✅ Categories and subcategories seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
    }
}