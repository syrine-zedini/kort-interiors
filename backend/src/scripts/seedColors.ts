/**
 * Script de seed : initialise les couleurs.
 *
 * Exécution (depuis le dossier backend/) :
 *   npx ts-node src/scripts/seedColors.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/sequelize';
import '../models/index';
import { Color } from '../models/color.model';

const COLORS = [
    { nameFr: 'Blanc', hex: '#FFFFFF' },
    { nameFr: 'Bleu Marine', hex: '#1B2A4A' },
    { nameFr: 'Taupe', hex: '#8B7355' },
    { nameFr: 'Ivoire', hex: '#FFFFF0' },
    { nameFr: 'Angora', hex: '#D8CFC4' },
    { nameFr: 'Glacier', hex: '#CFE9F3' },
    { nameFr: 'Mint', hex: '#98E2C6' },
    { nameFr: 'Sauge', hex: '#A8BBA2' },
    { nameFr: 'Canard', hex: '#0F5E5E' },
    { nameFr: 'Lin', hex: '#E6D5B8' },
    { nameFr: 'Camel', hex: '#C19A6B' },
    { nameFr: 'Gold', hex: '#D4AF37' },
    { nameFr: 'Dahlia', hex: '#B5335E' },
    { nameFr: 'Crépuscule', hex: '#5B4B6A' },
    { nameFr: 'Bleu Nuit', hex: '#0B1A3A' },
    { nameFr: 'Titane', hex: '#878A8C' },
    { nameFr: 'Souris', hex: '#9B9B9B' },
    { nameFr: 'Taupe Clair', hex: '#8B7D6B' },
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connecté à la base de données\n');

        for (const c of COLORS) {
            const [, created] = await Color.findOrCreate({
                where: { nameFr: c.nameFr },
                defaults: c,
            });
            console.log(`${created ? '+ Créée' : '~ Existante'} : ${c.nameFr} (${c.hex})`);
        }

        console.log('\n🎉 Seed couleurs terminé !');
    } catch (err) {
        console.error('❌ Erreur :', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();
