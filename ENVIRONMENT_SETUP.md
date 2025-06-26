# 环境变量设置指南

## 快速设置

1. 复制 `env.example` 文件为 `.env.local`：
```bash
cp env.example .env.local
```

2. 根据下面的指南替换对应的API keys：

## 必需的API Keys

### Supabase配置 (必需)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**获取方式：**
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Settings > API
4. 复制 URL 和 anon public key

### Replicate API (必需 - 用于AI图像处理)
```env
REPLICATE_API_TOKEN=r8_xxx...
```

**获取方式：**
1. 访问 [Replicate](https://replicate.com)
2. 注册/登录账户
3. 进入 Account Settings > API Tokens
4. 创建新的API token

## 可选的API Keys

### Stripe (如果需要付费功能)
```env
STRIPE_SECRET_KEY=sk_test_xxx...
STRIPE_PUBLISHABLE_KEY=pk_test_xxx...
```

### Cloudflare R2 (如果需要图像存储)
```env
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=your-bucket-name
```

### Email服务 (如果需要反馈功能)
```env
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
```

## 已移除的配置

由于切换到纯Supabase认证，以下配置已不再需要：
- ~~NEXTAUTH_URL~~
- ~~NEXTAUTH_SECRET~~

## 注意事项

1. **安全性**：
   - 永远不要将 `.env.local` 文件提交到git
   - 使用强密码和安全的API keys
   - 定期轮换API keys

2. **Supabase URL配置**：
   - 在Supabase控制台的Authentication -> URL Configuration中设置：
   - Site URL: `http://localhost:3000` (开发环境) 或 `https://yourdomain.com` (生产环境)
   - Redirect URLs: `http://localhost:3000/auth/signin`

3. **开发环境**：
   - 设置 `NODE_ENV=development`
   - 可以启用 `DEV_ALLOW_UNVERIFIED_EMAIL=true` 用于开发测试

## 验证配置

创建完 `.env.local` 后，运行以下命令验证配置：

```bash
npm run dev
```

如果配置正确，应用应该能够正常启动而不会出现环境变量相关的错误。 