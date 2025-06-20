#!/usr/bin/env node

/**
 * 🔐 安全配置检查脚本
 * 用于检查项目的安全配置和依赖
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(`🔐 ${title}`, 'bold');
  console.log('='.repeat(50));
}

// 检查环境变量
function checkEnvironmentVariables() {
  logSection('环境变量检查');
  
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const optionalVars = [
    'REPLICATE_API_TOKEN',
    'PAYMENT_VALIDATION_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];
  
  log('必需环境变量:', 'blue');
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: 已设置`, 'green');
    } else {
      log(`❌ ${varName}: 未设置`, 'red');
    }
  });
  
  log('\n可选环境变量:', 'blue');
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: 已设置`, 'green');
    } else {
      log(`⚠️  ${varName}: 未设置`, 'yellow');
    }
  });
}

// 检查依赖包安全
function checkDependencies() {
  logSection('依赖包安全检查');
  
  try {
    log('检查npm audit...', 'blue');
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);
    
    if (audit.metadata.vulnerabilities) {
      const { critical, high, moderate, low } = audit.metadata.vulnerabilities;
      log(`漏洞统计:`, 'blue');
      log(`  🔴 严重: ${critical || 0}`, critical > 0 ? 'red' : 'green');
      log(`  🟠 高危: ${high || 0}`, high > 0 ? 'red' : 'green');
      log(`  🟡 中危: ${moderate || 0}`, moderate > 0 ? 'yellow' : 'green');
      log(`  🟢 低危: ${low || 0}`, low > 0 ? 'yellow' : 'green');
      
      if (critical > 0 || high > 0) {
        log('\n建议立即修复高危以上漏洞:', 'red');
        log('npm audit fix', 'yellow');
      }
    } else {
      log('✅ 未发现安全漏洞', 'green');
    }
  } catch (error) {
    log('❌ 无法执行npm audit', 'red');
  }
}

// 检查文件权限
function checkFilePermissions() {
  logSection('文件权限检查');
  
  const sensitiveFiles = [
    '.env.local',
    '.env.production',
    'package-lock.json',
    'yarn.lock'
  ];
  
  sensitiveFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const mode = stats.mode.toString(8);
      const isSecure = (mode & 0o777) <= 0o644;
      
      if (isSecure) {
        log(`✅ ${file}: 权限安全 (${mode})`, 'green');
      } else {
        log(`❌ ${file}: 权限过宽 (${mode})`, 'red');
      }
    } else {
      log(`⚠️  ${file}: 文件不存在`, 'yellow');
    }
  });
}

// 检查安全配置
function checkSecurityConfig() {
  logSection('安全配置检查');
  
  const configFiles = [
    'next.config.js',
    'src/middleware.ts',
    'src/lib/auth.ts'
  ];
  
  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}: 存在`, 'green');
      
      // 检查特定配置
      const content = fs.readFileSync(file, 'utf8');
      
      if (file === 'src/middleware.ts') {
        const securityHeaders = [
          'X-Frame-Options',
          'X-Content-Type-Options',
          'X-XSS-Protection',
          'Strict-Transport-Security'
        ];
        
        securityHeaders.forEach(header => {
          if (content.includes(header)) {
            log(`  ✅ ${header}: 已配置`, 'green');
          } else {
            log(`  ❌ ${header}: 未配置`, 'red');
          }
        });
      }
      
      if (file === 'src/lib/auth.ts') {
        if (content.includes('secure: process.env.NODE_ENV === \'production\'')) {
          log(`  ✅ Cookie安全配置: 正确`, 'green');
        } else {
          log(`  ❌ Cookie安全配置: 需要检查`, 'red');
        }
      }
    } else {
      log(`❌ ${file}: 不存在`, 'red');
    }
  });
}

// 检查TypeScript配置
function checkTypeScriptConfig() {
  logSection('TypeScript安全配置');
  
  const tsConfigPath = 'tsconfig.json';
  if (fs.existsSync(tsConfigPath)) {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    
    const securityOptions = {
      'strict': '严格模式',
      'noImplicitAny': '禁止隐式any',
      'noUnusedLocals': '未使用变量检查',
      'noUnusedParameters': '未使用参数检查'
    };
    
    Object.entries(securityOptions).forEach(([option, description]) => {
      if (tsConfig.compilerOptions?.[option]) {
        log(`✅ ${description}: 已启用`, 'green');
      } else {
        log(`❌ ${description}: 未启用`, 'red');
      }
    });
  } else {
    log('❌ tsconfig.json: 不存在', 'red');
  }
}

// 检查ESLint配置
function checkESLintConfig() {
  logSection('ESLint安全规则检查');
  
  const eslintConfigPath = '.eslintrc.json';
  if (fs.existsSync(eslintConfigPath)) {
    const eslintConfig = JSON.parse(fs.readFileSync(eslintConfigPath, 'utf8'));
    
    const securityRules = [
      'no-eval',
      'no-implied-eval',
      'no-new-func',
      'no-script-url',
      'no-unsafe-finally'
    ];
    
    securityRules.forEach(rule => {
      if (eslintConfig.rules?.[rule] === 'error' || eslintConfig.rules?.[rule] === 2) {
        log(`✅ ${rule}: 已启用`, 'green');
      } else {
        log(`❌ ${rule}: 未启用`, 'red');
      }
    });
  } else {
    log('❌ .eslintrc.json: 不存在', 'red');
  }
}

// 生成安全报告
function generateSecurityReport() {
  logSection('安全报告生成');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      environmentVariables: 'completed',
      dependencies: 'completed',
      filePermissions: 'completed',
      securityConfig: 'completed',
      typescriptConfig: 'completed',
      eslintConfig: 'completed'
    },
    recommendations: [
      '定期更新依赖包',
      '使用强密码和密钥',
      '启用所有安全规则',
      '定期进行安全审计',
      '监控异常访问'
    ]
  };
  
  const reportPath = 'security-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`✅ 安全报告已生成: ${reportPath}`, 'green');
}

// 主函数
function main() {
  log('🔐 开始安全配置检查...', 'bold');
  
  try {
    checkEnvironmentVariables();
    checkDependencies();
    checkFilePermissions();
    checkSecurityConfig();
    checkTypeScriptConfig();
    checkESLintConfig();
    generateSecurityReport();
    
    logSection('检查完成');
    log('✅ 安全检查已完成，请查看上述结果', 'green');
    log('📋 详细报告已保存到 security-report.json', 'blue');
    
  } catch (error) {
    log(`❌ 检查过程中发生错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  checkDependencies,
  checkFilePermissions,
  checkSecurityConfig,
  checkTypeScriptConfig,
  checkESLintConfig,
  generateSecurityReport
}; 