const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://dheerajkumarguthikonda161:WODhlo91SOTXNGsy@cluster0.qevxzyg.mongodb.net/";

// User Schema (if not already defined)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Generate test users
const generateTestUsers = (count) => {
  const users = [];
  for (let i = 1; i <= count; i++) {
    users.push({
      name: `Load Test User ${i}`,
      email: `loadtest${i}@test.com`,
      password: 'password123'
    });
  }
  return users;
};

// Populate database with test users
async function populateTestUsers(count = 100) {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log(`👥 Creating ${count} test users...`);
    const testUsers = generateTestUsers(count);
    
    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`⏭️  User ${userData.email} already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Create user
        const newUser = new User({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          isVerified: true
        });

        await newUser.save();
        console.log(`✅ Created user: ${userData.email}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('\n📊 POPULATION SUMMARY:');
    console.log(`   ✅ Created: ${createdCount} users`);
    console.log(`   ⏭️  Skipped: ${skippedCount} users (already existed)`);
    console.log(`   📈 Total: ${createdCount + skippedCount} users available`);

    // Verify users can be found
    const totalUsers = await User.countDocuments();
    console.log(`   🔍 Total users in database: ${totalUsers}`);

    console.log('\n🎉 Test users population completed!');
    console.log('🚀 You can now run the stress test with real users.');

    return {
      created: createdCount,
      skipped: skippedCount,
      total: totalUsers
    };

  } catch (error) {
    console.error('❌ Error populating test users:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  const userCount = process.argv[2] ? parseInt(process.argv[2]) : 100;
  
  console.log('🚀 POPULATING TEST USERS FOR LOAD TESTING');
  console.log('=' .repeat(60));
  console.log(`📊 Target: ${userCount} test users`);
  console.log('📧 Email pattern: loadtest1@test.com, loadtest2@test.com, ...');
  console.log('🔑 Password: password123');
  console.log('=' .repeat(60));

  populateTestUsers(userCount)
    .then(result => {
      console.log('\n✅ Population completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateTestUsers }; 