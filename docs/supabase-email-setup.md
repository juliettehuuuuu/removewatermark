# Supabase邮件确认配置指南

## 🚀 解决邮件确认链接跳转问题

### 问题描述
用户注册后收到Supabase确认邮件，但点击确认链接后：
1. 跳转到错误的页面（非项目域名）
2. 确认成功但前端状态未同步，需要刷新页面

### 解决方案

#### 1. 在Supabase控制台配置重定向URL

登录 [Supabase控制台](https://app.supabase.com) → 选择项目 → Authentication → URL Configuration

设置以下配置：
- **Site URL**: `https://removewatermark.net` (你的域名)
- **Redirect URLs**: `https://removewatermark.net/api/auth/confirm`

#### 2. 代码实现

已实现的功能：
- ✅ `/api/auth/confirm` API路由处理邮件确认回调
- ✅ 注册时自动设置正确的重定向URL
- ✅ 确认成功后自动跳转到工具页面
- ✅ 工具页面显示确认成功提示

### 流程图

```
用户注册 → 收到邮件 → 点击确认链接 
    ↓
Supabase验证 → /api/auth/confirm → 设置认证Cookie
    ↓
重定向到 /tool?confirmed=true → 显示成功提示
```

### 测试步骤

1. 注册新账户
2. 检查邮箱确认邮件
3. 点击邮件中的确认链接
4. 应该自动跳转到工具页面并显示确认成功提示
5. 无需刷新页面即可使用所有功能

### 故障排除

如果确认后仍需刷新页面：
1. 检查Supabase控制台的URL配置是否正确
2. 确认环境变量 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 配置正确
3. 检查浏览器控制台是否有认证相关错误

### 注意事项

- 本地开发时使用 `http://localhost:3000/api/auth/confirm`
- 生产环境使用 `https://yourdomain.com/api/auth/confirm`
- 确保重定向URL与实际部署域名一致 