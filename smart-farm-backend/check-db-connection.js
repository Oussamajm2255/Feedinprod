// Quick script to check DATABASE_URL format
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

console.log('\n=== Database Connection Check ===\n');

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is NOT set!');
  console.log('\n📝 To fix:');
  console.log('1. Open your .env file');
  console.log('2. Add: DATABASE_URL=postgresql://username:password@host/database?sslmode=require');
  console.log('3. Get connection string from Neon Console: https://console.neon.tech\n');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set');
console.log('\n🔍 Checking format...\n');

// Check format
if (!databaseUrl.startsWith('postgresql://')) {
  console.error('❌ ERROR: DATABASE_URL must start with "postgresql://"');
  console.log(`   Current: ${databaseUrl.substring(0, 20)}...`);
  console.log('\n📝 Correct format:');
  console.log('   postgresql://username:password@host/database?sslmode=require\n');
  process.exit(1);
}

// Parse URL
try {
  const url = new URL(databaseUrl);
  
  console.log('✅ Format is valid');
  console.log(`\n📊 Connection Details:`);
  console.log(`   Protocol: ${url.protocol}`);
  console.log(`   Username: ${url.username || 'NOT SET'}`);
  console.log(`   Password: ${url.password ? '***' + url.password.slice(-3) : 'NOT SET'}`);
  console.log(`   Host: ${url.hostname || 'NOT SET'}`);
  console.log(`   Port: ${url.port || '5432 (default)'}`);
  console.log(`   Database: ${url.pathname.substring(1) || 'NOT SET'}`);
  console.log(`   SSL Mode: ${url.searchParams.get('sslmode') || 'NOT SET'}`);
  
  // Check for common issues
  console.log('\n🔍 Validation:\n');
  
  if (!url.username) {
    console.error('   ❌ Username is missing');
  } else {
    console.log('   ✅ Username is set');
  }
  
  if (!url.password) {
    console.error('   ❌ Password is missing');
  } else {
    console.log('   ✅ Password is set');
  }
  
  if (!url.hostname || url.hostname === 'base' || url.hostname === 'localhost') {
    console.error(`   ❌ Hostname is invalid: ${url.hostname}`);
    console.log('   📝 Should be: ep-xxxxx-xxxxx.region.aws.neon.tech');
  } else {
    console.log(`   ✅ Hostname: ${url.hostname}`);
  }
  
  if (!url.pathname || url.pathname === '/') {
    console.error('   ❌ Database name is missing');
  } else {
    console.log(`   ✅ Database: ${url.pathname.substring(1)}`);
  }
  
  if (url.searchParams.get('sslmode') !== 'require') {
    console.warn('   ⚠️  SSL mode should be "require" for Neon');
    console.log('   📝 Add: ?sslmode=require to connection string');
  } else {
    console.log('   ✅ SSL mode is set');
  }
  
  console.log('\n✅ Connection string looks good!');
  console.log('\n💡 Next steps:');
  console.log('1. Make sure your Neon database is running');
  console.log('2. Run: npm start');
  console.log('3. If still errors, check Neon Console for correct connection string\n');
  
} catch (error) {
  console.error('❌ ERROR: Invalid URL format');
  console.error(`   ${error.message}`);
  console.log('\n📝 Correct format:');
  console.log('   postgresql://username:password@ep-xxxxx-xxxxx.region.aws.neon.tech/database_name?sslmode=require\n');
  process.exit(1);
}

