import { NextResponse } from "next/server"

// 标准化响应接口 - 按照Shipany模板标准
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

// 错误代码常量
export const ErrorCodes = {
  // 认证相关
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_INVALID: "AUTH_INVALID",
  AUTH_EXPIRED: "AUTH_EXPIRED",
  
  // 参数验证相关
  INVALID_PARAMS: "INVALID_PARAMS",
  MISSING_PARAMS: "MISSING_PARAMS",
  INVALID_PRODUCT: "INVALID_PRODUCT",
  
  // 支付相关
  PAYMENT_FAILED: "PAYMENT_FAILED",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  ORDER_EXPIRED: "ORDER_EXPIRED",
  
  // 系统相关
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  RATE_LIMITED: "RATE_LIMITED",
} as const

/**
 * 成功响应 - 按照Shipany模板标准
 */
export function respData<T>(data: T, message?: string): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  }
  
  return NextResponse.json(response)
}

/**
 * 错误响应 - 按照Shipany模板标准
 */
export function respErr(
  message: string, 
  status: number = 400, 
  code?: string
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message,
    ...(code && { code })
  }
  
  return NextResponse.json(response, { status })
}

/**
 * 认证错误响应
 */
export function respAuthErr(message: string = "Authentication required"): NextResponse {
  return respErr(message, 401, ErrorCodes.AUTH_REQUIRED)
}

/**
 * 参数验证错误响应
 */
export function respParamsErr(message: string = "Invalid parameters"): NextResponse {
  return respErr(message, 400, ErrorCodes.INVALID_PARAMS)
}

/**
 * 支付错误响应
 */
export function respPaymentErr(message: string = "Payment failed"): NextResponse {
  return respErr(message, 400, ErrorCodes.PAYMENT_FAILED)
}

/**
 * 内部服务器错误响应
 */
export function respInternalErr(message: string = "Internal server error"): NextResponse {
  return respErr(message, 500, ErrorCodes.INTERNAL_ERROR)
}

/**
 * 服务不可用错误响应
 */
export function respServiceErr(message: string = "Service unavailable"): NextResponse {
  return respErr(message, 503, ErrorCodes.SERVICE_UNAVAILABLE)
}

/**
 * 频率限制错误响应
 */
export function respRateErr(message: string = "Rate limit exceeded"): NextResponse {
  return respErr(message, 429, ErrorCodes.RATE_LIMITED)
}

/**
 * 包装异步API处理函数 - 统一错误处理
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error: any) {
      console.error("❌ API处理错误:", error)
      
      // 根据错误类型返回不同的响应
      if (error.name === "ValidationError") {
        return respParamsErr(error.message)
      }
      
      if (error.name === "AuthenticationError") {
        return respAuthErr(error.message)
      }
      
      if (error.name === "PaymentError") {
        return respPaymentErr(error.message)
      }
      
      // 默认内部服务器错误
      return respInternalErr(
        process.env.NODE_ENV === "development" 
          ? error.message 
          : "Internal server error"
      )
    }
  }
}

/**
 * 自定义错误类
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthenticationError"
  }
}

export class PaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PaymentError"
  }
}

export class ServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ServiceError"
  }
} 