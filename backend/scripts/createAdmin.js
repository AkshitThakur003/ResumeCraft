/**
 * Script to create an admin user
 * Usage: node scripts/createAdmin.js <email> <password> [firstName] [lastName]
 * Example: node scripts/createAdmin.js admin@example.com Admin@123 Admin User
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get arguments
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error('❌ Usage: node scripts/createAdmin.js <email> <password> [firstName] [lastName]');
      console.error('   Example: node scripts/createAdmin.js admin@example.com Admin@123 Admin User');
      process.exit(1);
    }

    const [email, password, firstName = 'Admin', lastName = 'User'] = args;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists.`);
      
      if (existingUser.role === 'admin') {
        console.log('✅ User is already an admin!');
        await mongoose.disconnect();
        process.exit(0);
      }

      // Update existing user to admin
      existingUser.role = 'admin';
      if (password) {
        existingUser.password = password; // Will be hashed by pre-save middleware
      }
      await existingUser.save();
      console.log(`✅ Updated existing user to admin role`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create new admin user
    const adminUser = await User.create({
      email: email.toLowerCase(),
      password: password,
      firstName,
      lastName,
      role: 'admin',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser._id}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('   Email already exists in database');
    }
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();

