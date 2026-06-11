/**
 * Script: Create a test commande for payment callback testing
 * 
 * Usage: npx ts-node src/scripts/createTestCommande.ts
 * 
 * This script will:
 * 1. Connect to the database
 * 2. Find an existing user (or create a test user)
 * 3. Create a test commande with status 'pending' and paymentStatus 'unpaid'
 * 4. Print the commande ID for use in Postman
 */

import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/sequelize';
import { User } from '../models/user.model';
import { Commande } from '../models/commande.model';
import '../models/index'; // Ensure all associations are loaded
import bcrypt from 'bcrypt';

async function main() {
  try {
    // Connect to DB
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Sync models (without altering)
    await sequelize.sync({ alter: false });

    // Step 1: Find an existing user
    let user = await User.findOne();

    if (!user) {
      console.log('⚠️  No users found. Creating a test user...');
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
      user = await User.create({
        username: 'test_user',
        email: 'test@kortinteriors.com',
        password: hashedPassword,
      } as any);
      console.log(`✅ Test user created: ${user.id} (test@kortinteriors.com)`);
    } else {
      console.log(`✅ Found existing user: ${user.id} (${(user as any).email || (user as any).username})`);
    }

    // Step 2: Create a test commande
    const commande = await Commande.create({
      userId: user.id,
      totalAmount: 250.00,
      paymentMethod: 'clictopay',
      shippingAddress: {
        firstName: 'Test',
        lastName: 'User',
        address: '123 Rue de Test',
        city: 'Tunis',
        postalCode: '1000',
        country: 'Tunisia',
        phone: '+216 12 345 678',
      },
      billingAddress: {
        firstName: 'Test',
        lastName: 'User',
        address: '123 Rue de Test',
        city: 'Tunis',
        postalCode: '1000',
        country: 'Tunisia',
      },
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMMANDE DE TEST CRÉÉE AVEC SUCCÈS !');
    console.log('='.repeat(60));
    console.log(`\n📋 Commande ID: ${commande.id}`);
    console.log(`👤 User ID:     ${user.id}`);
    console.log(`💰 Montant:     ${commande.totalAmount} TND`);
    console.log(`📦 Status:      ${commande.status}`);
    console.log(`💳 Paiement:    ${commande.paymentStatus}`);
    console.log('\n' + '-'.repeat(60));
    console.log('\n📮 Utilisez cet ID dans Postman pour tester le callback :');
    console.log('\n--- TEST PAIEMENT RÉUSSI ---');
    console.log(JSON.stringify({
      commandeId: commande.id,
      status: 'paid',
      transactionId: 'TEST-TXN-001',
      provider: 'clictopay',
    }, null, 2));
    console.log('\n--- TEST PAIEMENT ÉCHOUÉ ---');
    console.log(JSON.stringify({
      commandeId: commande.id,
      status: 'failed',
      transactionId: 'TEST-TXN-002',
      provider: 'clictopay',
    }, null, 2));
    console.log('\n' + '='.repeat(60));

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

main();
