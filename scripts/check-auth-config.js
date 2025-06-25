#!/usr/bin/env node

/**
 * 认证配置检查脚本
 * 检查 NextAuth 和 Supabase 配置是否正确
 */

const fs = require('fs')
const path = require('path')

const ENV_FILE = path.join(process.cwd(), '.env.local')

console.log('🔍 检查认证配置...\n')

// 检查环境文件是否存在
if (!fs.existsSync(ENV_FILE)) {
  console.error('❌ .env.local 文件不存在')
  console.log('💡 请复制 env.example 为 .env.local 并配置环境变量')
  process.exit(1)
}

// 读取环境文件
const envContent = fs.readFileSync(ENV_FILE, 'utf8')
const envLines = envContent.split('\n')

const config = {}
envLines.forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    config[key.trim()] = value.trim()
  }
})

const checks = [
  {
    name: '🔑 NextAuth Secret',
    key: 'NEXTAUTH_SECRET',
    required: true,
    validate: (value) => {
      if (!value || value === 'your_nextauth_secret_key_32_chars_min') {
        return {
          valid: false,
          message: '需要设置一个强随机字符串（至少32字符）'
        }
      }
      if (value.length < 32) {
        return {
          valid: false,
          message: 'NextAuth Secret 长度需要至少32字符'
        }
      }
      return { valid: true }
    }
  },
  {
    name: '🌐 NextAuth URL',
    key: 'NEXTAUTH_URL',
    required: true,
    validate: (value) => {
      if (!value) {
        return {
          valid: false,
          message: '需要设置应用的完整URL'
        }
      }
      return { valid: true }
    }
  },
  {
    name: '🔐 认证功能开关',
    key: 'NEXT_PUBLIC_AUTH_CREDENTIALS_ENABLED',
    required: true,
    validate: (value) => {
      if (value !== 'true') {
        return {
          valid: false,
          message: '需要设置为 "true" 以启用邮箱密码登录'
        }
      }
      return { valid: true }
    }
  },
  {
    name: '🗄️ Supabase URL',
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    validate: (value) => {
      if (!value || !value.includes('supabase.co')) {
        return {
          valid: false,
          message: '需要有效的 Supabase 项目 URL'
        }
      }
      return { valid: true }
    }
  },
  {
    name: '🔑 Supabase Anon Key',
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    validate: (value) => {
      if (!value || value.length < 100) {
        return {
          valid: false,
          message: '需要有效的 Supabase 匿名密钥'
        }
      }
      return { valid: true }
    }
  },
  {
    name: '🔧 Supabase Service Role Key',
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    validate: (value) => {
      if (!value || value.length < 100) {
        return {
          valid: false,
          message: '需要有效的 Supabase 服务角色密钥'
        }
      }
      return { valid: true }
    }
  }
]

let allValid = true

checks.forEach(check => {
  const value = config[check.key]
  const result = check.validate(value)
  
  if (result.valid) {
    console.log(`✅ ${check.name}`)
  } else {
    console.log(`❌ ${check.name}`)
    console.log(`   💡 ${result.message}`)
    allValid = false
  }
})

console.log('\n' + '='.repeat(50))

if (allValid) {
  console.log('🎉 所有认证配置检查通过！')
  console.log('\n💡 建议接下来：')
  console.log('1. 运行 npm run dev 启动开发服务器')
  console.log('2. 测试用户注册和登录功能')
  console.log('3. 检查浏览器控制台是否有错误')
} else {
  console.log('🚨 发现配置问题，请修复后重试')
  console.log('\n🔧 修复步骤：')
  console.log('1. 编辑 .env.local 文件')
  console.log('2. 修复上述标记为 ❌ 的配置项')
  console.log('3. 重新运行此脚本验证')
  process.exit(1)
}

console.log('\n📚 更多帮助：')
console.log('- NextAuth 文档: https://next-auth.js.org/')
console.log('- Supabase 文档: https://supabase.com/docs')
console.log('- 项目 README 文件') 