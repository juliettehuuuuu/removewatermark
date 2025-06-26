#!/usr/bin/env node

/**
 * 环境变量验证脚本
 * 检查必需的环境变量是否正确配置
 */

const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

console.log('🔍 验证环境变量配置...\n');

// 必需的环境变量
const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Supabase项目URL',
    pattern: /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/,
    example: 'https://your-project.supabase.co'
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    description: 'Supabase匿名密钥',
    pattern: /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  'REPLICATE_API_TOKEN': {
    description: 'Replicate API令牌',
    pattern: /^r8_[A-Za-z0-9]{30,50}$/,
    example: 'r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  }
};

// 可选的环境变量
const optionalVars = {
  'SUPABASE_SERVICE_ROLE_KEY': {
    description: 'Supabase服务角色密钥',
    pattern: /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
  },
  'STRIPE_SECRET_KEY': {
    description: 'Stripe密钥',
    pattern: /^sk_(test_|live_)[A-Za-z0-9]{24,}$/
  },
  'STRIPE_PUBLISHABLE_KEY': {
    description: 'Stripe公开密钥',
    pattern: /^pk_(test_|live_)[A-Za-z0-9]{24,}$/
  }
};

let hasErrors = false;
let hasWarnings = false;

console.log('✅ 检查必需的环境变量:');
console.log('================================\n');

// 检查必需的环境变量
for (const [varName, config] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: 未设置`);
    console.log(`   描述: ${config.description}`);
    console.log(`   示例: ${config.example}\n`);
    hasErrors = true;
  } else if (value.includes('your_') || value.includes('xxx')) {
    console.log(`⚠️  ${varName}: 仍为示例值`);
    console.log(`   当前值: ${value}`);
    console.log(`   需要替换为实际的${config.description}\n`);
    hasErrors = true;
  } else if (!config.pattern.test(value)) {
    console.log(`❌ ${varName}: 格式不正确`);
    console.log(`   当前值: ${value.substring(0, 20)}...`);
    console.log(`   当前值长度: ${value.length}`);
    console.log(`   期望格式: ${config.example}\n`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: 已正确配置`);
    console.log(`   值: ${value.substring(0, 20)}...\n`);
  }
}

console.log('\n⚙️  检查可选的环境变量:');
console.log('================================\n');

// 检查可选的环境变量
for (const [varName, config] of Object.entries(optionalVars)) {
  const value = process.env[varName];
  
  if (!value) {
    console.log(`ℹ️  ${varName}: 未设置 (可选)`);
    console.log(`   描述: ${config.description}\n`);
  } else if (value.includes('your_') || value.includes('xxx')) {
    console.log(`⚠️  ${varName}: 仍为示例值`);
    console.log(`   如果需要此功能，请替换为实际值\n`);
    hasWarnings = true;
  } else if (!config.pattern.test(value)) {
    console.log(`⚠️  ${varName}: 格式可能不正确`);
    console.log(`   当前值: ${value.substring(0, 20)}...\n`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${varName}: 已配置`);
    console.log(`   值: ${value.substring(0, 20)}...\n`);
  }
}

// 检查已移除的NextAuth配置
console.log('\n🚫 检查已废弃的配置:');
console.log('================================\n');

const deprecatedVars = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'NEXT_PUBLIC_AUTH_CREDENTIALS_ENABLED'];
let hasDeprecated = false;

for (const varName of deprecatedVars) {
  if (process.env[varName]) {
    console.log(`⚠️  ${varName}: 此配置已不再需要（NextAuth已移除）`);
    hasDeprecated = true;
  }
}

if (!hasDeprecated) {
  console.log('✅ 没有发现已废弃的配置');
}

// 总结
console.log('\n📋 配置总结:');
console.log('================================');

if (hasErrors) {
  console.log('❌ 发现配置错误，请修复后重试');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  基本配置正确，但有一些警告');
  console.log('✅ 应用可以启动，可选功能可能需要额外配置');
} else {
  console.log('✅ 所有配置都正确！');
  console.log('🚀 可以安全启动应用');
}

console.log('\n💡 下一步: 运行 npm run dev 启动开发服务器'); 