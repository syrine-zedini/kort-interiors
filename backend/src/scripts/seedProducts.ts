/**
 * Script de seed : initialise les produits d'exemple.
 *
 * Exécution (depuis le dossier backend/) :
 *   npx ts-node src/scripts/seedProducts.ts
 *
 * Prérequis :
 *   - seedCategories.ts doit avoir été exécuté
 *   - seedColors.ts doit avoir été exécuté
 *   - addColorsToProductItems.ts doit avoir été exécuté
 */

import dotenv from 'dotenv';
dotenv.config();

import { Op } from 'sequelize';
import { sequelize } from '../config/sequelize';
import '../models/index';
import { ProductCategory } from '../models/product_categories.model';
import { Color } from '../models/color.model';
import { createProduct } from '../services/product.service';
import { Product } from '../models/product.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLACEHOLDER = '/public/placeholder.jpg';

/** Convertit "27,4" ou "459.000" en number */
const parsePrice = (s: string): number => {
    if (!s) return 0;
    return parseFloat(s.replace(',', '.'));
};

// ─── Données des produits ─────────────────────────────────────────────────────

interface ProductSeed {
    sku: string;
    name: string;
    categoryName: string;            // nom de la sous-catégorie
    shortDesc: string;
    longDesc?: string;
    colors?: string[];               // noms FR des couleurs (doivent exister dans la table colors)
    dimensions?: string;
    price: number;
    items?: { name: string; sizes?: string[] }[];
}

const PRODUCTS: ProductSeed[] = [
    // ── Linge de lit : Parures de lit ──────────────────────────────────────────
    {
        sku: 'LIT-TRIOMPHE-001',
        name: 'Triomphe — Parure de lit',
        categoryName: 'Parures de lit',
        shortDesc: 'Parure en satin coton égyptien 300 fils brodée',
        longDesc: 'La collection Triomphe tissée en satin de coton égyptien 300 fils. Douceur incomparable, éclat satiné.',
        colors: ['Blanc', 'Bleu Marine', 'Taupe', 'Ivoire'],
        dimensions: 'Housse 240×220 cm + 2 taies 50×75 cm',
        price: 459,
        items: [
            { name: 'Housse de couette', sizes: ['240×220'] },
            { name: "Taie d'oreiller", sizes: ['50×75'] },
        ],
    },

    // ── Linge de lit : Collection Jacquard ─────────────────────────────────────
    {
        sku: 'PEX-001',
        name: "Jardin d'Émeraude — Collection Jacquard",
        categoryName: 'Collection Jacquard',
        shortDesc: 'Parure jacquard satin de coton, 260×240 cm',
        longDesc: 'Satin de coton Jacquard, finition brodée. Composition complète : housse de couette 260×240, 2 taies 50×75, drap plat 270×290.',
        dimensions: '260×240 cm',
        price: 590,
        items: [
            { name: 'Housse de couette', sizes: ['260×240'] },
            { name: "Taie d'oreiller", sizes: ['50×75'] },
            { name: 'Drap plat', sizes: ['270×290'] },
        ],
    },
    {
        sku: 'PEX-002',
        name: 'Brise Exotique — Collection Jacquard',
        categoryName: 'Collection Jacquard',
        shortDesc: 'Parure jacquard satin de coton, 260×240 cm',
        longDesc: 'Satin de coton Jacquard, finition brodée. Composition complète : housse de couette 260×240, 2 taies 50×75, drap plat 270×290.',
        dimensions: '260×240 cm',
        price: 590,
        items: [
            { name: 'Housse de couette', sizes: ['260×240'] },
            { name: "Taie d'oreiller", sizes: ['50×75'] },
            { name: 'Drap plat', sizes: ['270×290'] },
        ],
    },
    {
        sku: 'PEX-003',
        name: 'Jardin Lumineux — Collection Jacquard',
        categoryName: 'Collection Jacquard',
        shortDesc: 'Parure jacquard satin de coton, 260×240 cm',
        longDesc: 'Satin de coton Jacquard, finition brodée. Composition complète : housse de couette 260×240, 2 taies 50×75, drap plat 270×290.',
        dimensions: '260×240 cm',
        price: 590,
        items: [
            { name: 'Housse de couette', sizes: ['260×240'] },
            { name: "Taie d'oreiller", sizes: ['50×75'] },
            { name: 'Drap plat', sizes: ['270×290'] },
        ],
    },
    {
        sku: 'PEX-004',
        name: 'Bouquet Sauvage — Collection Jacquard',
        categoryName: 'Collection Jacquard',
        shortDesc: 'Parure jacquard satin de coton, 260×240 cm',
        longDesc: 'Satin de coton Jacquard, finition brodée. Composition complète : housse de couette 260×240, 2 taies 50×75, drap plat 270×290.',
        dimensions: '260×240 cm',
        price: 590,
        items: [
            { name: 'Housse de couette', sizes: ['260×240'] },
            { name: "Taie d'oreiller", sizes: ['50×75'] },
            { name: 'Drap plat', sizes: ['270×290'] },
        ],
    },

    // ── Art de table : Boîtes de rangement ────────────────────────────────────
    {
        sku: 'ER0046F',
        name: 'Boîte ovale Azura Sugar — 11×15 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement ovale en métal à motif Azura Sugar 11×15 cm',
        longDesc: 'Largeur : 10,8 cm — Longueur : 15 cm — Hauteur : 13 cm — Volume : 1,7 litre. Couvercle hermétique, apte au contact alimentaire. Certifiée FSSC 22000 et TS EN ISO 9001:2015. Fabriquée en Turquie.',
        price: 27.4,
    },
    {
        sku: 'ER0047F',
        name: 'Boîte ovale Azura Café — 11×15 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement ovale en métal à motif café Azura 11×15 cm',
        longDesc: 'Largeur : 10,8 cm — Longueur : 15 cm — Hauteur : 13 cm — Volume : 1,7 litre. Couvercle hermétique, apte au contact alimentaire.',
        price: 27.4,
    },
    {
        sku: 'ER0048F',
        name: 'Boîte ovale Azura Thé — 11×15 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement ovale en métal à motif thé Azura 11×15 cm',
        longDesc: 'Largeur : 10,8 cm — Longueur : 15 cm — Hauteur : 13 cm — Volume : 1,7 litre. Couvercle hermétique, apte au contact alimentaire.',
        price: 27.4,
    },
    {
        sku: 'ER0227F',
        name: 'Boîte rectangulaire Azura — couvercle transparent',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement rectangulaire en métal à motif sucre, couvercle verrouillable',
        longDesc: 'La boîte rectangulaire en métal Evle, dotée d\'un couvercle transparent verrouillable, allie praticité et design moderne. Dimensions : 7,5 × 10 × 17 cm — Volume : 1,1 litre.',
        price: 24.5,
    },
    {
        sku: 'ER0228F',
        name: 'Boîte carrée Azura Thé — 20×20 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement carrée en métal à motif thé Azura',
        longDesc: 'Dimensions : 19,8 × 19,8 × 10 cm — Volume : 3,7 litres. Idéale pour les produits secs.',
        price: 24.5,
    },
    {
        sku: 'ER0236F',
        name: 'Boîte carrée Azura Sugar — 12×12 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement carrée en métal à motif Azura Sugar, 12×12 cm',
        longDesc: 'Dimensions : 12 × 12 × 13,7 cm — Volume : 1,8 litre. Poignée bouton, couvercle hermétique. Certifiée FSSC 22000. Fabriquée en Turquie.',
        price: 45.85,
    },
    {
        sku: 'ER0237F',
        name: 'Boîte carrée Azura Café — 12×12 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement carrée en métal à motif café Azura, 12×12 cm',
        longDesc: 'Dimensions : 12 × 12 × 13,7 cm — Volume : 1,8 litre. Poignée bouton, couvercle hermétique.',
        price: 59.999,
    },
    {
        sku: 'ER0238F',
        name: 'Boîte carrée Azura Thé — 12×12 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement carrée en métal à motif thé Azura, 12×12 cm',
        longDesc: 'Dimensions : 12 × 12 × 13,7 cm — Volume : 1,8 litre. Poignée bouton, couvercle hermétique.',
        price: 59.999,
    },
    {
        sku: 'ER0246F',
        name: 'Boîte carrée Azura Sucre — 12×12 cm (A)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement carrée en métal à motif sucre Azura',
        longDesc: 'Dimensions : 12 × 12 × 13,7 cm — Volume : 1,8 litre. Grande capacité, couvercle hermétique.',
        price: 27.85,
    },
    {
        sku: 'ER0247F',
        name: 'Boîte carrée Azura Sucre — 12×12 cm (B)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement carrée en métal à motif sucre Azura',
        longDesc: 'Dimensions : 12 × 12 × 13,7 cm — Volume : 1,8 litre.',
        price: 27.85,
    },
    {
        sku: 'ER0248F',
        name: 'Boîte carrée Azura Thé — 12×12 cm (B)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement carrée en métal à motif thé Azura',
        longDesc: 'Dimensions : 12 × 12 × 13,7 cm — Volume : 1,8 litre.',
        price: 27.85,
    },
    {
        sku: 'ER0486F',
        name: 'Boîte rectangulaire Azura Sucre — 7,5×10 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement rectangulaire en métal à motif sucre, couvercle transparent',
        longDesc: 'Dimensions : 7,5 × 10 × 17 cm — Volume : 1,1 litre.',
        price: 27.85,
    },
    {
        sku: 'ER0288F',
        name: 'Boîte carrée Azura Thé — 20×20 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement carrée en métal à motif thé Azura, 20×20 cm',
        longDesc: 'Dimensions : 19,8 × 19,8 × 10 cm — Volume : 3,7 litres.',
        price: 33.5,
    },
    {
        sku: 'ER0297F',
        name: 'Boîte carrée Azura Café — 24×24 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement carrée en métal à motif café Azura, 24×24 cm',
        longDesc: 'Dimensions : 23,5 × 23,5 × 11 cm — Volume : 5,8 litres. Idéale pour les besoins de rangement volumineux.',
        price: 44.9,
    },
    {
        sku: 'ER0436F',
        name: 'Boîte rectangulaire Azura Sugar — 8×10 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement rectangulaire en métal à motif Azura Sugar, 8×10 cm',
        longDesc: 'Dimensions : 7,5 × 10 × 15 cm — Volume : 1 litre. Couvercle transparent verrouillable.',
        price: 27.99,
    },
    {
        sku: 'ER0438F',
        name: 'Boîte rectangulaire Azura Thé — 8×10 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement rectangulaire en métal à motif thé Azura, 8×10 cm',
        longDesc: 'Dimensions : 7,5 × 10 × 15 cm — Volume : 1 litre. Couvercle transparent verrouillable.',
        price: 27.99,
    },
    {
        sku: 'ER0537F',
        name: 'Boîte rectangulaire métal — 75×100×190 mm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte en métal rectangulaire avec fermoir en fil et couvercle transparent',
        longDesc: '75×100×190 mm — 1,3 litre. Rangement très haut, sécurisé et visible.',
        price: 34.99,
    },
    {
        sku: 'ER0806F',
        name: 'Pot à épices Azura Sucre — Ø9 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Pot à épices à motif sucre Azura 0,6 L',
        longDesc: 'Diamètre : 9 cm — Hauteur : 11 cm — Volume : 0,6 litre. Couvercle hermétique.',
        price: 24.85,
    },
    {
        sku: 'ER0807F',
        name: 'Pot à épices Azura Café — Ø9 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Pot à épices à motif café Azura 0,6 L',
        longDesc: 'Diamètre : 9 cm — Hauteur : 11 cm — Volume : 0,6 litre. Couvercle hermétique.',
        price: 24.85,
    },
    {
        sku: 'ER0808F',
        name: 'Pot à épices Azura Thé — Ø9 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Pot à épices à motif thé Azura 0,6 L',
        longDesc: 'Diamètre : 9 cm — Hauteur : 11 cm — Volume : 0,6 litre. Couvercle hermétique.',
        price: 24.85,
    },
    {
        sku: 'ER1416F',
        name: 'Boîte décorative texturée Azura — Ø14 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement décorative en métal texturé multi-usage, 14 cm',
        longDesc: 'Diamètre : 14 cm — Hauteur : 10 cm — Volume : 1,3 litre. Couvercle hermétique, certifiée FSSC 22000.',
        price: 55.85,
    },
    {
        sku: 'ER0827F',
        name: 'Pot à épices Azura Café — couvercle transparent',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Pot à épices à motif café Azura, couvercle verrouillable',
        longDesc: 'Diamètre : 9 cm — Hauteur : 11 cm — Volume : 0,6 litre.',
        price: 27.84,
    },
    {
        sku: 'ER1176F',
        name: 'Boîte ronde métal + couvercle bois — Ø105×150 mm (A)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte en métal Ø105×150 mm avec fermoir à fil et couvercle bois',
        longDesc: 'Dimensions : Ø 105×150 mm — 1,1 litre. Finition impression offset, couvercle en bois naturel.',
        price: 32.5,
    },
    {
        sku: 'ER1177F',
        name: 'Boîte ronde métal + couvercle bois — Ø105×150 mm (B)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte métallique ronde 1,1 L Ø105×150 mm avec couvercle bois',
        longDesc: 'Finition impression offset, couvercle en bois naturel. Idéale pour le rangement polyvalent.',
        price: 32.5,
    },
    {
        sku: 'ER1178F',
        name: 'Boîte ronde métal + couvercle bois — Ø105×150 mm (C)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte en métal Ø105×150 mm, fermoir à fil et couvercle bois',
        longDesc: 'Finition impression offset, couvercle en bois naturel. Idéale pour épices, café, thé ou fournitures.',
        price: 32.5,
    },
    {
        sku: 'ER1157F',
        name: 'Pot à épices Azura Café — Ø10,5 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Pot à épices à motif café Azura, 1,1 litre',
        longDesc: 'Diamètre : 10,5 cm — Hauteur : 15 cm — Volume : 1,1 litre. Couvercle hermétique.',
        price: 22.4,
    },
    {
        sku: 'EE1717F',
        name: 'Plateau rectangulaire Azura — 235×305 mm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Plateau rectangulaire en métal Azura 235×305 mm',
        longDesc: 'Conçu pour la durabilité et la polyvalence. Construit en métal de haute qualité avec finition offset.',
        price: 24.6,
    },
    {
        sku: 'EE1616F',
        name: 'Plateau à thé Azura — 23×31 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Plateau en métal à motif Azura — plateau à thé/café',
        longDesc: 'Design élégant et épuré. Convient à toutes les occasions, du petit-déjeuner au service des en-cas.',
        price: 25.8,
    },
    {
        sku: 'ERB05V3',
        name: 'Ensemble 3 boîtes rondes Azura — Ø9 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Ensemble de 3 boîtes de rangement cylindriques en métal Ø9 cm',
        longDesc: '3 boîtes rondes — Ø9×11 cm, couvercle bombé, 0,6 litre chacune.',
        price: 54.99,
        items: [
            { name: 'Boîte ronde Café', sizes: ['Ø9×11 cm'] },
            { name: 'Boîte ronde Thé', sizes: ['Ø9×11 cm'] },
            { name: 'Boîte ronde Sucre', sizes: ['Ø9×11 cm'] },
        ],
    },
    {
        sku: 'ERB09V3SET',
        name: 'Ensemble 3 boîtes carrées Azura — 105×105 mm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Ensemble de 3 boîtes de rangement carrées en métal 105×105×160 mm',
        longDesc: '3 boîtes de rangement carrées (105×105×160 cm).',
        price: 89.89,
        items: [
            { name: 'Boîte carrée Café', sizes: ['105×105×160 mm'] },
            { name: 'Boîte carrée Thé', sizes: ['105×105×160 mm'] },
            { name: 'Boîte carrée Sucre', sizes: ['105×105×160 mm'] },
        ],
    },
    {
        sku: 'ER1456F',
        name: 'Boîte ronde Azura — Ø17,5 cm (2,9 L)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement ronde en métal Azura',
        longDesc: 'Diamètre : 17,5 cm — Hauteur : 13 cm — Volume : 2,9 litres. Couvercle hermétique, certifiée FSSC 22000.',
        price: 69.999,
    },
    {
        sku: 'ER1467F',
        name: 'Boîte de conservation Azura — Ø17,5 cm (3,5 L)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de conservation alimentaire ronde en métal',
        longDesc: 'Diamètre : 17,5 cm — Hauteur : 15,5 cm — Volume : 3,5 litres. Couvercle hermétique.',
        price: 69.999,
    },
    {
        sku: 'ER1493O',
        name: 'Seau à pop-corn Azura — Ø17,5 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Seau à pop-corn en métal Azura, 2,6 litres',
        longDesc: 'Diamètre : 17,5 cm — Hauteur : 17 cm — Volume : 2,6 litres. Design esthétique.',
        price: 24.6,
    },
    {
        sku: 'EE1628F',
        name: 'Plateau à thé Azura avec poignées — 21×31 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Plateau en métal Azura avec poignées ergonomiques — 21×31 cm',
        longDesc: 'Grande facilité de transport grâce aux poignées ergonomiques. Design élégant et épuré.',
        price: 25.8,
    },
    {
        sku: 'ER1478F',
        name: 'Boîte ronde Azura — Ø17,5 cm (4,1 L)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement en métal, grande capacité 4,1 litres',
        longDesc: 'Diamètre : 17,5 cm — Hauteur : 18 cm — Volume : 4,1 litres. Couvercle hermétique.',
        price: 55.85,
    },
    {
        sku: 'ERB18V3SET',
        name: 'Lot 3 boîtes cylindriques Azura — Ø10,5 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Lot de 3 boîtes de conservation cylindriques Ø105 avec système de fermeture',
        longDesc: 'Diamètre : 10,5 cm — Hauteur : 15 cm — Capacité : 1,1 litre chacune. Corps en métal apte au contact alimentaire.',
        price: 79.9,
        items: [
            { name: 'Boîte cylindrique Café', sizes: ['Ø10,5×15 cm'] },
            { name: 'Boîte cylindrique Thé', sizes: ['Ø10,5×15 cm'] },
            { name: 'Boîte cylindrique Sucre', sizes: ['Ø10,5×15 cm'] },
        ],
    },
    {
        sku: 'EE163U9',
        name: 'Plateau rond Tales — Ø37 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Plateau rond en métal à motifs Tales — plateau à thé/café',
        longDesc: 'Plateau de service Ø37 cm. Design classique et élégant, construction robuste.',
        price: 28.8,
    },
    {
        sku: 'ERB25V3SET',
        name: 'Ensemble 3 boîtes carrées — 9×9×12,5 cm (Azura)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Ensemble de 3 boîtes de rangement carrées en métal 9×9×12,5 cm',
        longDesc: '3 boîtes carrées — 9×9×12,5 cm, 1 litre chacune.',
        price: 55,
        items: [
            { name: 'Boîte carrée Café', sizes: ['9×9×12,5 cm'] },
            { name: 'Boîte carrée Thé', sizes: ['9×9×12,5 cm'] },
            { name: 'Boîte carrée Sucre', sizes: ['9×9×12,5 cm'] },
        ],
    },
    {
        sku: 'ERB24V3SET',
        name: 'Ensemble 3 boîtes carrées — 7,5×7,5 cm (Azura)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Ensemble de 3 boîtes de rangement carrées en métal 7,5×7,5 cm',
        longDesc: '3 boîtes carrées — 7,5×7,5×10,2 cm, 0,5 litre chacune.',
        price: 42,
        items: [
            { name: 'Boîte carrée Café', sizes: ['7,5×7,5×10,2 cm'] },
            { name: 'Boîte carrée Thé', sizes: ['7,5×7,5×10,2 cm'] },
            { name: 'Boîte carrée Sucre', sizes: ['7,5×7,5×10,2 cm'] },
        ],
    },
    {
        sku: 'ERB36V3SET',
        name: 'Ensemble 3 boîtes rectangulaires — 8×12 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Ensemble de 3 boîtes de rangement rectangulaires 8×12 cm',
        longDesc: '3 boîtes rectangulaires — 8×12×12 cm, 1 litre chacune.',
        price: 69,
        items: [
            { name: 'Boîte rectangulaire Café', sizes: ['8×12×12 cm'] },
            { name: 'Boîte rectangulaire Thé', sizes: ['8×12×12 cm'] },
            { name: 'Boîte rectangulaire Sucre', sizes: ['8×12×12 cm'] },
        ],
    },
    {
        sku: 'ERB13V3SET',
        name: 'Ensemble 3 boîtes carrées assorties (Azura)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Ensemble de 3 boîtes de rangement carrées en métal, volumes différents',
        longDesc: '1 boîte 19,8×19,8×10 cm (3,7 L) + 1 boîte 23,5×23,5×11 cm (5,8 L) + 1 boîte 15,8×15,8×8,7 cm (2,2 L).',
        price: 99,
        items: [
            { name: 'Grande boîte carrée', sizes: ['23,5×23,5×11 cm — 5,8 L'] },
            { name: 'Boîte carrée medium', sizes: ['19,8×19,8×10 cm — 3,7 L'] },
            { name: 'Petite boîte carrée', sizes: ['15,8×15,8×8,7 cm — 2,2 L'] },
        ],
    },
    {
        sku: 'ER181T7',
        name: 'Panier à pommes de terre métal BIRDS — 9 L',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Panier à pommes de terre / étagère à légumes en métal BIRDS, 9 litres',
        longDesc: 'Diamètre : 22,5 cm — Hauteur : 24 cm — Volume : 9 litres. Aérations spéciales anti-humidité.',
        price: 99,
    },
    {
        sku: 'ERB13T7SET',
        name: 'Ensemble 3 boîtes carrées BIRDS',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Ensemble de 3 boîtes de rangement carrées en métal à motif cage à oiseaux',
        longDesc: '1 boîte 19,8×19,8×10 cm (3,7 L) + 1 boîte 23,5×23,5×11 cm (5,8 L) + 1 boîte 15,8×15,8×8,7 cm (2,2 L).',
        price: 119.999,
        items: [
            { name: 'Grande boîte carrée BIRDS', sizes: ['23,5×23,5×11 cm — 5,8 L'] },
            { name: 'Boîte carrée medium BIRDS', sizes: ['19,8×19,8×10 cm — 3,7 L'] },
            { name: 'Petite boîte carrée BIRDS', sizes: ['15,8×15,8×8,7 cm — 2,2 L'] },
        ],
    },
    {
        sku: 'ERB13U1SET',
        name: 'Ensemble 3 boîtes carrées mosaïque',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Ensemble de 3 boîtes de rangement carrées en métal à motif mosaïque',
        longDesc: '1 boîte 19,8×19,8×10 cm (3,7 L) + 1 boîte 23,5×23,5×11 cm (5,8 L) + 1 boîte 15,8×15,8×8,7 cm (2,2 L).',
        price: 119.999,
        items: [
            { name: 'Grande boîte mosaïque', sizes: ['23,5×23,5×11 cm — 5,8 L'] },
            { name: 'Boîte medium mosaïque', sizes: ['19,8×19,8×10 cm — 3,7 L'] },
            { name: 'Petite boîte mosaïque', sizes: ['15,8×15,8×8,7 cm — 2,2 L'] },
        ],
    },
    {
        sku: 'ERB13U3SET',
        name: 'Ensemble 3 boîtes carrées (U3)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Ensemble de 3 boîtes de rangement carrées en métal, volumes différents',
        longDesc: '1 boîte 19,8×19,8×10 cm (3,7 L) + 1 boîte 23,5×23,5×11 cm (5,8 L) + 1 boîte 15,8×15,8×8,7 cm (2,2 L).',
        price: 119.999,
        items: [
            { name: 'Grande boîte carrée', sizes: ['23,5×23,5×11 cm — 5,8 L'] },
            { name: 'Boîte carrée medium', sizes: ['19,8×19,8×10 cm — 3,7 L'] },
            { name: 'Petite boîte carrée', sizes: ['15,8×15,8×8,7 cm — 2,2 L'] },
        ],
    },
    {
        sku: 'ERB24U8SET',
        name: 'Ensemble 3 boîtes carrées Tales — 7,5×7,5 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Lot de 3 boîtes de rangement carrées en métal Tales 75×75 cm',
        longDesc: '3 boîtes carrées Tales. Couvercle pratique, conservation fraîcheur.',
        price: 42,
        items: [
            { name: 'Boîte carrée Tales Café', sizes: ['7,5×7,5 cm'] },
            { name: 'Boîte carrée Tales Thé', sizes: ['7,5×7,5 cm'] },
            { name: 'Boîte carrée Tales Sucre', sizes: ['7,5×7,5 cm'] },
        ],
    },
    {
        sku: 'ER141V1',
        name: 'Boîte décorative Tales — Ø14 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement décorative en métal Tales, 14 cm',
        longDesc: 'Diamètre : 14 cm — Hauteur : 10 cm — Volume : 1,3 litre. Couvercle hermétique.',
        price: 59.999,
    },
    {
        sku: 'ER0029A',
        name: 'Boîte à pain ovale Tales',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Oval Bread Box métal Tales — 178×338×200 mm',
        longDesc: 'Construction métallique durable, poignée pratique. Intérieur spacieux pour pain et viennoiseries.',
        price: 99,
    },
    {
        sku: 'ER1439A',
        name: 'Boîte ronde Tales — 2,1 L',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte ronde en métal Tales avec couvercle à bouton',
        longDesc: 'Capacité : 2,1 litre. Couvercle à bouton, finition impression offset.',
        price: 69.999,
    },
    {
        sku: 'EE1619A',
        name: 'Plateau rectangulaire Tales — 23×31 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Plateau rectangulaire en métal Tales — plateau à thé/café',
        longDesc: 'Design élégant et épuré. Plateau de service 23×31 cm.',
        price: 25.8,
    },
    {
        sku: 'EE161V1',
        name: 'Plateau Casse-Noisette Tales — 23×31 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Plateau en métal à motif Casse-Noisette Tales — plateau à thé/café',
        longDesc: 'Design élégant et épuré. Convient à toutes les occasions. Plateau de service 23×31 cm.',
        price: 25.8,
    },
    {
        sku: 'ER1499A',
        name: 'Seau à pop-corn Alice Tales — Ø17,5 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Seau à popcorn à motifs Tales Alice, 2,6 litres',
        longDesc: 'Diamètre : 17,5 cm — Hauteur : 17 cm — Volume : 2,6 litres.',
        price: 24.6,
    },
    {
        sku: 'ER149U9',
        name: 'Seau à pop-corn Cendrillon Tales — Ø17,5 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Seau à pop-corn thème Cendrillon Tales, 2,6 litres',
        longDesc: 'Diamètre : 17,5 cm — Hauteur : 17 cm — Volume : 2,6 litres. Finition impression offset.',
        price: 24.6,
    },
    {
        sku: 'ER146U9',
        name: 'Boîte ronde Tales — Ø175×155 mm (3,5 L)',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte ronde en métal Ø175×155 mm avec poignée bouton Tales',
        longDesc: 'Dimensions : Ø175×155 mm — 3,5 litres. Conception extra large et haute.',
        price: 69.999,
    },
    {
        sku: 'ERB25GASET',
        name: 'Ensemble 3 boîtes carrées Tales — 9×9×12,5 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Lot de 3 boîtes de rangement carrées en métal Tales 9×9 cm',
        longDesc: '3 boîtes carrées — 9×9×12,5 cm, 1 litre chacune.',
        price: 55,
        items: [
            { name: 'Boîte carrée Tales Café', sizes: ['9×9×12,5 cm'] },
            { name: 'Boîte carrée Tales Thé', sizes: ['9×9×12,5 cm'] },
            { name: 'Boîte carrée Tales Sucre', sizes: ['9×9×12,5 cm'] },
        ],
    },
    {
        sku: 'ERB25GDSET',
        name: 'Boîte carrée New Year — 9×9×12,5 cm',
        categoryName: 'Boîtes de rangement',
        shortDesc: 'Boîte de rangement carrée en métal thème Nouvel An',
        longDesc: '3 boîtes carrées — 9×9×12,5 cm, 1 litre chacune.',
        price: 55,
        items: [
            { name: 'Boîte New Year (1)', sizes: ['9×9×12,5 cm'] },
            { name: 'Boîte New Year (2)', sizes: ['9×9×12,5 cm'] },
            { name: 'Boîte New Year (3)', sizes: ['9×9×12,5 cm'] },
        ],
    },
];

// ─── Script principal ──────────────────────────────────────────────────────────

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connecté à la base de données\n');

        // ── 1. Charger toutes les catégories ──────────────────────────────────
        const allCats = await ProductCategory.findAll();
        const catByName = new Map(allCats.map((c) => [c.name.toLowerCase(), c]));

        // Helper : trouve une catégorie par nom (insensible à la casse et aux accents)
        const findCat = (name: string): ProductCategory | undefined => {
            const key = name.toLowerCase();
            // Correspondance exacte
            if (catByName.has(key)) return catByName.get(key)!;
            // Correspondance partielle (ex : "boîtes de rangement" ~ "boites de rangement")
            for (const [k, v] of catByName) {
                if (k.replace(/[éèêë]/g, 'e').replace(/[àâ]/g, 'a') === key.replace(/[éèêë]/g, 'e').replace(/[àâ]/g, 'a')) {
                    return v;
                }
            }
            return undefined;
        };

        // Créer "Collection Jacquard" sous "Linge de lit" si elle n'existe pas
        let jacquardCat = findCat('Collection Jacquard');
        if (!jacquardCat) {
            jacquardCat = await ProductCategory.create({ name: 'Collection Jacquard' });
            catByName.set('collection jacquard', jacquardCat);
            const lingedeLit = findCat('Linge de lit');
            if (lingedeLit?.addChild) {
                await lingedeLit.addChild(jacquardCat.id);
                console.log('📁 Créé : Collection Jacquard (sous Linge de lit)');
            }
        }

        // ── 2. Charger toutes les couleurs ────────────────────────────────────
        const allColors = await Color.findAll();
        const colorByName = new Map(allColors.map((c) => [c.nameFr.toLowerCase(), c.id]));

        // ── 3. Créer les produits ─────────────────────────────────────────────
        console.log('\n📦 Création des produits…\n');
        let created = 0;
        let skipped = 0;

        for (const p of PRODUCTS) {
            // Idempotence : skip si déjà existant (par nom)
            const existing = await Product.findOne({ where: { name: p.name } });
            if (existing) {
                console.log(`   ~ Existant : ${p.name}`);
                skipped++;
                continue;
            }

            // Résoudre la catégorie
            const cat = findCat(p.categoryName);
            if (!cat) {
                console.warn(`   ⚠ Catégorie introuvable : "${p.categoryName}" — ${p.name} ignoré`);
                continue;
            }

            // Résoudre les couleurs (IDs)
            const colorIds = (p.colors ?? [])
                .map((name) => colorByName.get(name.toLowerCase()))
                .filter((id): id is string => !!id);

            // Description complète
            const description = [p.longDesc ?? p.shortDesc, p.dimensions ? `Dimensions : ${p.dimensions}` : '']
                .filter(Boolean)
                .join('\n\n');

            // Items (sous-pièces)
            const items = p.items?.map((it) => ({
                name: it.name,
                sizes: it.sizes,
                images: [PLACEHOLDER],
            }));

            await createProduct({
                name: p.name,
                code: `PROD-${p.name.toUpperCase().replace(/\s+/g, '-').substring(0, 20)}-${Date.now().toString().slice(-6)}`,
                description,
                categoryId: cat.id,
                prices: [p.price],
                colors: colorIds.length > 0 ? colorIds : undefined,
                images: [PLACEHOLDER],
                items,
            });

            console.log(`   + ${p.name}`);
            created++;
        }

        console.log(`\n🎉 Seed produits terminé !`);
        console.log(`   • ${created} produit(s) créé(s)`);
        console.log(`   • ${skipped} déjà existant(s) (ignorés)`);
    } catch (err) {
        console.error('❌ Erreur :', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();
