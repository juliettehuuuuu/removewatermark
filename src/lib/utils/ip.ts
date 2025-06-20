import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    
    // 尝试从各种可能的头部获取真实IP
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const cfConnectingIp = headersList.get("cf-connecting-ip");
    const xClientIp = headersList.get("x-client-ip");
    
    // 优先级：CF > X-Real-IP > X-Forwarded-For > X-Client-IP
    if (cfConnectingIp) {
      return cfConnectingIp;
    }
    
    if (realIp) {
      return realIp;
    }
    
    if (forwardedFor) {
      // X-Forwarded-For 可能包含多个IP，取第一个
      return forwardedFor.split(",")[0].trim();
    }
    
    if (xClientIp) {
      return xClientIp;
    }
    
    // 如果都没有，返回默认值
    return "unknown";
  } catch (error) {
    console.error("Failed to get client IP:", error);
    return "unknown";
  }
} 