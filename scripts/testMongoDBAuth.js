import dbConnect from '../lib/dbConnect.js';
import { User } from '../lib/models/User.js';

async function testAuth() {
  await dbConnect();

  console.log('🔍 Checking existing users in MongoDB...');
  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users in MongoDB:`);
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.fullName} (${u.role}) - Phone: ${u.phone}`);
  });

  console.log('\n➕ Simulating a new Citizen signing up on PARVAAH website...');
  const newUser = await User.create({
    fullName: 'Priya Sharma (New Citizen)',
    phone: '+919876543210',
    role: 'citizen',
    languagePreference: 'as',
    isActive: true,
  });

  console.log(`✅ Created new user in MongoDB! Name: ${newUser.fullName}, ID: ${newUser._id}`);

  const updatedUsers = await User.find({}).lean();
  console.log(`🎉 Total users in MongoDB is now: ${updatedUsers.length}`);
}

testAuth()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error in testAuth:', err);
    process.exit(1);
  });
