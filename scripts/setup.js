#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up GitLab Assistant with Chat Persistence...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local already exists');
} else {
  console.log('📝 Creating .env.local file...');
  const envContent = `# Database
DATABASE_URL="file:./dev.db"

# AI Provider (Cerebras)
CEREBRAS_API_KEY="your-cerebras-api-key"

# GitLab Integration
GITLAB_TOKEN="your-gitlab-token"
GITLAB_URL="https://gitlab.com/api/v4"
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
  console.log('⚠️  Please update the API keys in .env.local before running the app');
}

console.log('\n📋 Next steps:');
console.log('1. Update API keys in .env.local');
console.log('2. Run: npm install');
console.log('3. Run: npx prisma generate');
console.log('4. Run: npx prisma db push');
console.log('5. Run: npm run dev');
console.log('\n🎉 Happy coding!');
