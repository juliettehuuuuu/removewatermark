import { prisma } from "@/lib/database";
import { User } from "@/lib/types/user";
import { getIsoTimestr } from "@/lib/utils/time";

export async function saveUser(user: User): Promise<User> {
  try {
    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: user.email },
          { 
            AND: [
              { signinProvider: user.signin_provider },
              { signinOpenid: user.signin_openid }
            ]
          }
        ]
      }
    });

    if (existingUser) {
      // 更新现有用户的登录信息
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          lastSigninAt: getIsoTimestr(),
          signinIp: user.signin_ip,
          signinCount: { increment: 1 },
          // 更新头像和昵称（如果有变化）
          ...(user.avatar_url && { image: user.avatar_url }),
          ...(user.nickname && { name: user.nickname }),
        }
      });

      return {
        uuid: updatedUser.id,
        email: updatedUser.email!,
        nickname: updatedUser.name || "",
        avatar_url: updatedUser.image || "",
        signin_type: user.signin_type,
        signin_provider: user.signin_provider,
        signin_openid: user.signin_openid,
        created_at: updatedUser.createdAt.toISOString(),
        signin_ip: user.signin_ip,
        last_signin_at: updatedUser.lastSigninAt?.toISOString(),
        signin_count: updatedUser.signinCount || 1,
      };
    } else {
      // 创建新用户
      const newUser = await prisma.user.create({
        data: {
          id: user.uuid,
          email: user.email,
          name: user.nickname,
          image: user.avatar_url,
          signinType: user.signin_type,
          signinProvider: user.signin_provider,
          signinOpenid: user.signin_openid,
          signinIp: user.signin_ip,
          lastSigninAt: getIsoTimestr(),
          signinCount: 1,
          // 地理位置检测和支付偏好设置
          location: await detectUserLocationFromIp(user.signin_ip),
          preferredCurrency: "USD", // 默认值，后续根据地理位置调整
          preferredPaymentProvider: "stripe", // 默认值，后续根据地理位置调整
        }
      });

      // 根据地理位置设置支付偏好
      const location = newUser.location;
      if (location === "CN") {
        await prisma.user.update({
          where: { id: newUser.id },
          data: {
            preferredCurrency: "CNY",
            preferredPaymentProvider: "creem",
          }
        });
      }

      return {
        uuid: newUser.id,
        email: newUser.email!,
        nickname: newUser.name || "",
        avatar_url: newUser.image || "",
        signin_type: user.signin_type,
        signin_provider: user.signin_provider,
        signin_openid: user.signin_openid,
        created_at: newUser.createdAt.toISOString(),
        signin_ip: user.signin_ip,
        last_signin_at: newUser.lastSigninAt?.toISOString(),
        signin_count: newUser.signinCount || 1,
      };
    }
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
}

export async function getUserByUuid(uuid: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: uuid }
    });

    if (!user) return null;

    return {
      uuid: user.id,
      email: user.email!,
      nickname: user.name || "",
      avatar_url: user.image || "",
      signin_type: user.signinType || "",
      signin_provider: user.signinProvider || "",
      signin_openid: user.signinOpenid || "",
      created_at: user.createdAt.toISOString(),
      signin_ip: user.signinIp || "",
      last_signin_at: user.lastSigninAt?.toISOString(),
      signin_count: user.signinCount || 0,
    };
  } catch (error) {
    console.error("Error getting user by UUID:", error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) return null;

    return {
      uuid: user.id,
      email: user.email!,
      nickname: user.name || "",
      avatar_url: user.image || "",
      signin_type: user.signinType || "",
      signin_provider: user.signinProvider || "",
      signin_openid: user.signinOpenid || "",
      created_at: user.createdAt.toISOString(),
      signin_ip: user.signinIp || "",
      last_signin_at: user.lastSigninAt?.toISOString(),
      signin_count: user.signinCount || 0,
    };
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

// 简化的地理位置检测函数
async function detectUserLocationFromIp(ip: string): Promise<string> {
  try {
    // 这里可以集成第三方IP地理位置服务
    // 暂时返回默认值
    if (ip === "unknown") return "US";
    
    // 简单的IP段判断（仅作示例）
    // 实际应用中应该使用专业的IP地理位置服务
    return "US"; // 默认返回美国
  } catch (error) {
    console.error("Error detecting location:", error);
    return "US";
  }
} 