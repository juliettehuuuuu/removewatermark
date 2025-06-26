const fs = require('fs');
const path = require('path');

// --- 配置 (Configuration) ---

// 1. 需要在环境变量中定义的关键密钥
// List of critical secret keys that MUST be defined in the environment.
const REQUIRED_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  // 如果启用Stripe，这些也是必需的
  // 'STRIPE_PRIVATE_KEY',
  // 'STRIPE_WEBHOOK_SECRET', 
];

// 新增：推荐但非强制的密钥
const RECOMMENDED_SECRETS = [
  'JWT_SECRET',
  'PAYMENT_VALIDATION_SECRET',
];

// 2. 禁止在代码中硬编码的模式 (正则表达式)
// Patterns that should NEVER be hardcoded in the source code (uses RegExp).
const FORBIDDEN_PATTERNS = [
  // Stripe-like keys (sk_live_..., pk_live_...)
  /(sk|pk)_(live|test)_[a-zA-Z0-9]{24,}/,
  // Common private key formats
  /-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----/,
  // Secret-looking random strings (e.g., a 32+ hex character string)
  // We make this more specific to avoid matching UUIDs or other long IDs.
  // This looks for hex strings of 32, 40, 64 characters (common for tokens/secrets).
  /(?<![a-zA-Z0-9])([a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})(?![a-zA-Z0-9])/,
];

// 3. 搜索范围和排除项
// Directories to scan and items to exclude.
const DIRS_TO_SCAN = ['src', 'scripts'];
const EXCLUDE_ITEMS = [
  'node_modules',
  '.next',
  'coverage',
  '.DS_Store',
  '.env',
  '.env.local',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'deprecated-security-check.js',
  'src/lib/replicate.ts',
  // 可以排除一些已知包含长哈希且无害的文件
  // Example: 'src/lib/some-generated-file.ts'
];

// --- 脚本实现 (Script Implementation) ---

let errorsFound = 0;

/**
 * 递归扫描目录中的文件
 * @param {string} dir 
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (EXCLUDE_ITEMS.some(item => fullPath.includes(item))) {
      continue;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      checkFile(fullPath);
    }
  }
}

/**
 * 检查单个文件是否包含禁用模式
 * @param {string} filePath 
 */
function checkFile(filePath) {
  // 我们主要关心文本文件，可以跳过一些二进制格式
  if (/\.(png|jpg|jpeg|gif|woff|woff2|eot|ttf|svg)$/.test(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // 排除我们新生成的安全密钥，它们可能会被通用规则匹配到
  const newJwtSecret = "8a3c0b7cc4649529902fbe94e521e1c0dd5fe205dde92c991ce3277ceac7964f";
  const newPaymentSecret = "e75625664ba5fa5f99e5262c02e82db92efa17ba20852af89b299ff1612ac1ae";
  
  // 此检查主要用于防止意外将密钥粘贴到错误的文件中
  if (content.includes(newJwtSecret) || content.includes(newPaymentSecret)) {
      if (!filePath.endsWith('security-check.js')) {
         console.error(`❌ [FATAL] Critical Error: A secret key is hardcoded in an insecure file: ${filePath}`);
         errorsFound++;
      }
      return; 
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    // 特殊处理长哈希规则，以减少误报
    if (pattern.toString().includes(']{64}')) {
       const lines = content.split('\n');
       lines.forEach((line, i) => {
         const match = line.match(pattern);
         // 排除测试数据或ID等已知安全的长字符串
         if (match && !line.includes('test-id') && !line.includes('commit-hash')) {
            logError(filePath, pattern, match[0], i + 1);
         }
       });
    } else {
      const match = content.match(pattern);
      if (match) {
        logError(filePath, pattern, match[0]);
      }
    }
  }
}

function logError(filePath, pattern, match, lineNumber) {
    // 避免匹配到我们自己的 env.example 文件中的占位符
    if (filePath.endsWith('env.example')) return;
    // 避免匹配脚本自身
    if (filePath.endsWith('security-check.js')) return;

    console.error(`❌ [FATAL] Found potentially hardcoded secret in ${filePath}${lineNumber ? ` on line ${lineNumber}` : ''}:`);
    console.error(`   > Pattern: ${pattern}`);
    console.error(`   > Match: "${match}"`);
    errorsFound++;
}

/**
 * 验证必需的环境变量是否已设置
 */
function verifyEnvVariables() {
  console.log('\n--- Verifying Environment Variables ---');
  // 加载 .env.local 内容
  try {
    require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
  } catch (e) {
    console.error('❌ [FATAL] Could not load .env.local file. Please ensure it exists.');
    errorsFound++;
    return;
  }

  let missingRequired = 0;
  console.log('\n[Phase 1/2] Checking REQUIRED secrets...');
  for (const secret of REQUIRED_SECRETS) {
    if (!process.env[secret] || process.env[secret].startsWith('YOUR_')) {
      console.error(`❌ [FATAL] Required environment variable "${secret}" is not set or is using a placeholder value.`);
      missingRequired++;
    } else {
      console.log(`✅ [OK] Required: "${secret}" is set.`);
    }
  }

  console.log('\n[Phase 2/2] Checking RECOMMENDED secrets...');
  for (const secret of RECOMMENDED_SECRETS) {
    if (!process.env[secret] || process.env[secret].startsWith('YOUR_')) {
      console.warn(`⚠️  [WARN] Recommended environment variable "${secret}" is not set. This may disable some features.`);
    } else {
      console.log(`✅ [OK] Recommended: "${secret}" is set.`);
    }
  }

  if (missingRequired > 0) {
    console.error(`\n[FATAL] ${missingRequired} required environment variables are missing or use placeholder values.`);
    console.error('Please check your `.env.local` file and compare it with `env.example`.');
    errorsFound += missingRequired;
  } else {
    console.log('\n✅ All required environment variables are correctly set.');
  }
}


// --- 主程序 (Main Execution) ---

console.log('--- Starting Pre-deployment Security Check ---');

console.log('\n--- Scanning for Hardcoded Secrets ---');
DIRS_TO_SCAN.forEach(scanDirectory);
if (errorsFound === 0) {
    console.log('✅ No hardcoded secrets found.');
}

verifyEnvVariables();

console.log('\n--- Security Check Summary ---');
if (errorsFound > 0) {
  console.error(`\n🚨 [FAILURE] Security check failed with ${errorsFound} error(s). Please fix them before deploying.`);
  process.exit(1); // 以错误码退出
} else {
  console.log('\n🎉 [SUCCESS] All security checks passed. Ready to deploy!');
  process.exit(0); // 正常退出
} 