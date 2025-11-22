// Script to fix DATABASE_URL in .env file
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

console.log('📝 Reading .env file...\n');

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let fixed = false;
const newLines = lines.map(line => {
  if (line.startsWith('DATABASE_URL=')) {
    let value = line.substring('DATABASE_URL='.length).trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Remove psql command if present
    if (value.startsWith('psql ')) {
      value = value.substring(5).trim();
      // Remove quotes again if added by psql command
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
    }
    
    // Remove any other command prefixes
    if (value.includes('postgresql://')) {
      const match = value.match(/postgresql:\/\/[^\s'"]+/);
      if (match) {
        value = match[0];
        fixed = true;
        console.log('✅ Fixed DATABASE_URL!');
        console.log(`   Old: ${line.substring(0, 50)}...`);
        console.log(`   New: DATABASE_URL=${value.substring(0, 50)}...\n`);
      }
    }
    
    return `DATABASE_URL=${value}`;
  }
  return line;
});

if (fixed) {
  // Backup original
  const backupPath = path.join(__dirname, '.env.backup');
  fs.writeFileSync(backupPath, envContent);
  console.log(`💾 Backup saved to: .env.backup\n`);
  
  // Write fixed version
  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log('✅ .env file updated successfully!\n');
  console.log('📝 Next steps:');
  console.log('1. Verify the connection string is correct');
  console.log('2. Run: node check-db-connection.js');
  console.log('3. Run: npm start\n');
} else {
  console.log('ℹ️  DATABASE_URL looks correct or not found');
  console.log('   Current value:', lines.find(l => l.startsWith('DATABASE_URL=')) || 'Not found');
}

