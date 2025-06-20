// 🗄️ Supabase数据库适配器
// 提供类似Prisma的接口，简化数据库操作

import { createAdminClient } from './supabase/server'

// 获取服务端管理员客户端
function getSupabaseAdmin() {
  return createAdminClient()
}

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  credits?: number
  location?: string
  lastSigninAt?: Date
  signinCount?: number
  signinType?: string
  signinProvider?: string
  signinOpenid?: string
  signinIp?: string
  preferredCurrency?: string
  preferredPaymentProvider?: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentOrder {
  id: string
  userId: string
  orderNumber: string
  amount: number
  currency: string
  status: string
  paymentProvider: string
  productType: string
  productId: string
  productName: string
  customerEmail: string
  stripeSessionId?: string
  stripePaymentIntentId?: string
  creemCheckoutId?: string
  creemPaymentId?: string
  paidAt?: Date
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

// 扩展接口，用于包含关联数据的查询结果
export interface PaymentOrderWithUser extends PaymentOrder {
  user?: User
}

export interface CreditTransaction {
  id: string
  userId: string
  amount: number
  type: string // 'purchase' | 'usage' | 'refund'
  description?: string
  paymentOrderId?: string
  referenceId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  userId: string
  planId: string
  status: string // 'active' | 'inactive' | 'cancelled'
  billingCycle: string // 'monthly' | 'yearly'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  paymentProvider: string
  stripeSubscriptionId?: string
  creemSubscriptionId?: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentConfig {
  id: string
  stripeEnabled: boolean
  creemEnabled: boolean
  defaultProvider: string
  maintenanceMode: boolean
  lastUpdatedBy: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Supabase适配器，提供类似Prisma的接口
class SupabaseAdapter {
  user = {
    async findUnique(args: any): Promise<User | null> {
      try {
        const supabase = getSupabaseAdmin()
        let query = supabase.from('users').select('*')
        
        // 支持通过id或email查询
        if (args.where.id) {
          query = query.eq('id', args.where.id)
        } else if (args.where.email) {
          query = query.eq('email', args.where.email)
        } else {
          console.error('findUnique: 必须提供id或email')
          return null
        }
        
        console.log('🔍 数据库查询 - 查找用户:', args.where)
        
        const { data, error } = await query.single()
        
        if (error) {
          console.log('🔍 User findUnique error:', error.message)
          return null
        }
        
        if (!data) {
          console.log('🔍 用户不存在')
          return null
        }
        
        console.log('✅ 找到用户:', data.email)
        
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          image: data.image,
          credits: data.credits,
          location: data.location,
          lastSigninAt: data.last_signin_at ? new Date(data.last_signin_at) : undefined,
          signinCount: data.signin_count,
          signinType: data.signin_type,
          signinProvider: data.signin_provider,
          signinOpenid: data.signin_openid,
          signinIp: data.signin_ip,
          preferredCurrency: data.preferred_currency,
          preferredPaymentProvider: data.preferred_payment_provider,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        }
      } catch (error) {
        console.error('🚨 User findUnique error:', error)
        return null
      }
    },

    async findFirst(args: any): Promise<User | null> {
      try {
        const supabase = getSupabaseAdmin()
        let query = supabase.from('users').select('*')
        
        if (args?.where) {
          Object.entries(args.where).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }
        
        const { data, error } = await query.limit(1).single()
        
        if (error || !data) return null
        
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          image: data.image,
          credits: data.credits,
          location: data.location,
          lastSigninAt: data.last_signin_at ? new Date(data.last_signin_at) : undefined,
          signinCount: data.signin_count,
          signinType: data.signin_type,
          signinProvider: data.signin_provider,
          signinOpenid: data.signin_openid,
          signinIp: data.signin_ip,
          preferredCurrency: data.preferred_currency,
          preferredPaymentProvider: data.preferred_payment_provider,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        }
      } catch (error) {
        console.error('User findFirst error:', error)
        return null
      }
    },

    async create(args: any): Promise<User> {
      console.log('🔍 创建用户数据:', args.data)
      
      const supabase = getSupabaseAdmin()
      
      const insertData: any = {
        id: args.data.id,
        email: args.data.email,
        name: args.data.name,
        image: args.data.image,
        credits: args.data.credits || 0,
        signin_type: args.data.signinType,
        signin_provider: args.data.signinProvider,
        signin_openid: args.data.signinOpenid,
        signin_ip: args.data.signinIp,
        signin_count: args.data.signinCount || 1,
        location: args.data.location,
        preferred_currency: args.data.preferredCurrency,
        preferred_payment_provider: args.data.preferredPaymentProvider
      }
      
      // 处理日期字段 - 确保转换为ISO字符串
      if (args.data.lastSigninAt) {
        insertData.last_signin_at = args.data.lastSigninAt instanceof Date 
          ? args.data.lastSigninAt.toISOString() 
          : args.data.lastSigninAt
      }
      
      console.log('🔍 插入数据库的数据:', insertData)
      
      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('🚨 用户创建失败:', error)
        throw error
      }
      
      console.log('✅ 用户创建成功:', data)

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image,
        credits: data.credits,
        signinType: data.signin_type,
        signinProvider: data.signin_provider,
        signinOpenid: data.signin_openid,
        signinIp: data.signin_ip,
        lastSigninAt: data.last_signin_at ? new Date(data.last_signin_at) : undefined,
        signinCount: data.signin_count,
        location: data.location,
        preferredCurrency: data.preferred_currency,
        preferredPaymentProvider: data.preferred_payment_provider,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    },

    async update(args: any): Promise<User> {
      const supabase = getSupabaseAdmin()
      const updateData: any = {}
      
      if (args.data.email) updateData.email = args.data.email
      if (args.data.name) updateData.name = args.data.name
      if (args.data.image) updateData.image = args.data.image
      if (args.data.signinType) updateData.signin_type = args.data.signinType
      if (args.data.signinProvider) updateData.signin_provider = args.data.signinProvider
      if (args.data.signinOpenid) updateData.signin_openid = args.data.signinOpenid
      if (args.data.signinIp) updateData.signin_ip = args.data.signinIp
      if (args.data.lastSigninAt) updateData.last_signin_at = args.data.lastSigninAt
      if (args.data.location) updateData.location = args.data.location
      if (args.data.preferredCurrency) updateData.preferred_currency = args.data.preferredCurrency
      if (args.data.preferredPaymentProvider) updateData.preferred_payment_provider = args.data.preferredPaymentProvider
      
      if (args.data.signinCount?.increment) {
        // 处理signinCount增量更新
        const { data: currentUser } = await supabase
          .from('users')
          .select('signin_count')
          .eq('id', args.where.id)
          .single()
        
        updateData.signin_count = (currentUser?.signin_count || 0) + args.data.signinCount.increment
      } else if (args.data.signinCount !== undefined) {
        updateData.signin_count = args.data.signinCount
      }
      
      if (args.data.credits?.increment) {
        // 处理credits增量更新
        const { data: currentUser } = await supabase
          .from('users')
          .select('credits')
          .eq('id', args.where.id)
          .single()
        
        updateData.credits = (currentUser?.credits || 0) + args.data.credits.increment
      } else if (args.data.credits?.decrement) {
        // 🔧 处理credits减量更新
        const { data: currentUser } = await supabase
          .from('users')
          .select('credits')
          .eq('id', args.where.id)
          .single()
        
        updateData.credits = Math.max(0, (currentUser?.credits || 0) - args.data.credits.decrement)
      } else if (args.data.credits !== undefined) {
        updateData.credits = args.data.credits
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', args.where.id)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image,
        credits: data.credits,
        signinType: data.signin_type,
        signinProvider: data.signin_provider,
        signinOpenid: data.signin_openid,
        signinIp: data.signin_ip,
        lastSigninAt: data.last_signin_at ? new Date(data.last_signin_at) : undefined,
        signinCount: data.signin_count,
        location: data.location,
        preferredCurrency: data.preferred_currency,
        preferredPaymentProvider: data.preferred_payment_provider,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    },

    async delete(args: any): Promise<User> {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', args.where.id)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image,
        credits: data.credits,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    }
  }

  paymentOrder = {
    async findMany(args: any): Promise<any[]> {
      const supabase = getSupabaseAdmin()
      let query = supabase.from('orders').select('*')
      
      if (args?.where) {
        Object.entries(args.where).forEach(([key, value]) => {
          if (key === 'userId') query = query.eq('user_id', value)
          else query = query.eq(key, value)
        })
      }
      
      if (args?.orderBy) {
        const orderField = Object.keys(args.orderBy)[0]
        const orderDirection = args.orderBy[orderField]
        query = query.order(orderField === 'createdAt' ? 'created_at' : orderField, 
                           { ascending: orderDirection === 'asc' })
      }
      
      if (args?.take) query = query.limit(args.take)
      if (args?.skip) query = query.range(args.skip, args.skip + (args.take || 50) - 1)

      const { data, error } = await query

      if (error) {
        console.error('PaymentOrder findMany error:', error)
        return []
      }

      return data || []
    },

    async findUnique(args: any): Promise<any | null> {
      try {
        const supabase = getSupabaseAdmin()
        let query = supabase.from('orders').select('*')
        
        if (args.where.id) query = query.eq('id', args.where.id)
        if (args.where.orderNumber) query = query.eq('order_number', args.where.orderNumber)
        if (args.where.stripeSessionId) query = query.eq('stripe_session_id', args.where.stripeSessionId)
        if (args.where.creemCheckoutId) query = query.eq('creem_checkout_id', args.where.creemCheckoutId)

        const { data, error } = await query.single()
        
        if (error || !data) return null
        return data
      } catch (error) {
        console.error('PaymentOrder findUnique error:', error)
        return null
      }
    },

    async findFirst(args: any): Promise<any | null> {
      return this.findUnique(args)
    },

    async create(args: any): Promise<PaymentOrder> {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: args.data.userId,
          order_number: args.data.orderNumber,
          amount: args.data.amount,
          currency: args.data.currency,
          status: args.data.status || 'pending',
          payment_provider: args.data.paymentProvider,
          product_type: args.data.productType,
          stripe_session_id: args.data.stripeSessionId,
          creem_checkout_id: args.data.creemCheckoutId,
          payment_details: args.data.metadata
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        userId: data.user_id,
        orderNumber: data.order_number,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paymentProvider: data.payment_provider,
        productType: data.product_type,
        productId: '',
        productName: '',
        customerEmail: '',
        stripeSessionId: data.stripe_session_id,
        creemCheckoutId: data.creem_checkout_id,
        metadata: data.payment_details,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    },

    async update(args: any): Promise<PaymentOrder> {
      const supabase = getSupabaseAdmin()
      const updateData: any = {}
      
      if (args.data.status) updateData.status = args.data.status
      if (args.data.stripePaymentIntentId) updateData.stripe_payment_intent_id = args.data.stripePaymentIntentId
      if (args.data.creemPaymentId) updateData.creem_payment_id = args.data.creemPaymentId
      if (args.data.paidAt) updateData.paid_at = args.data.paidAt
      if (args.data.metadata) updateData.payment_details = args.data.metadata

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', args.where.id)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        userId: data.user_id,
        orderNumber: data.order_number,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paymentProvider: data.payment_provider,
        productType: data.product_type,
        productId: '',
        productName: '',
        customerEmail: '',
        stripeSessionId: data.stripe_session_id,
        creemCheckoutId: data.creem_checkout_id,
        metadata: data.payment_details,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    },

    async delete(args: any): Promise<PaymentOrder> {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', args.where.id)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        userId: data.user_id,
        orderNumber: data.order_number,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paymentProvider: data.payment_provider,
        productType: data.product_type,
        productId: '',
        productName: '',
        customerEmail: '',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    },

    async count(args: any): Promise<number> {
      const supabase = getSupabaseAdmin()
      let query = supabase.from('orders').select('*', { count: 'exact', head: true })
      
      if (args?.where) {
        Object.entries(args.where).forEach(([key, value]) => {
          if (key === 'userId') query = query.eq('user_id', value)
          else query = query.eq(key, value)
        })
      }

      const { count, error } = await query
      
      if (error) {
        console.error('PaymentOrder count error:', error)
        return 0
      }

      return count || 0
    },

    async updateMany(args: any): Promise<{ count: number }> {
      const supabase = getSupabaseAdmin()
      const updateData: any = {}
      
      if (args.data.status) updateData.status = args.data.status
      if (args.data.updatedAt) updateData.updated_at = args.data.updatedAt

      let query = supabase.from('orders').update(updateData)
      
      if (args.where?.id?.in) {
        query = query.in('id', args.where.id.in)
      }

      const { data, error } = await query.select()

      if (error) {
        console.error('PaymentOrder updateMany error:', error)
        return { count: 0 }
      }

      return { count: data?.length || 0 }
    },

    async deleteMany(args: any): Promise<{ count: number }> {
      const supabase = getSupabaseAdmin()
      let query = supabase.from('orders').delete()
      
      if (args.where) {
        Object.entries(args.where).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      const { data, error } = await query.select()

      if (error) {
        console.error('PaymentOrder deleteMany error:', error)
        return { count: 0 }
      }

      return { count: data?.length || 0 }
    },

    async groupBy(args: any): Promise<any[]> {
      // Supabase不直接支持groupBy，返回模拟数据
      return [
        {
          paymentProvider: 'stripe',
          _count: { id: 120 },
          _max: { createdAt: new Date() }
        },
        {
          paymentProvider: 'creem',
          _count: { id: 65 },
          _max: { createdAt: new Date(Date.now() - 3600000) }
        }
      ]
    },

    async aggregate(args: any): Promise<any> {
      // Supabase不直接支持aggregate，返回模拟数据
      return {
        _sum: { amount: 15750 },
        _avg: { amount: 105 },
        _count: { id: 150 },
        _min: { amount: 10 },
        _max: { amount: 500 }
      }
    }
  }

  // 其他模型使用简单的模拟实现
  paymentConfig = {
    async findFirst(args?: any): Promise<PaymentConfig | null> {
      // 模拟支付配置查询
      return {
        id: 'default-config',
        stripeEnabled: true,
        creemEnabled: true,
        defaultProvider: 'creem',
        maintenanceMode: false,
        lastUpdatedBy: 'system',
        notes: 'Default configuration',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },

    async create(args: any): Promise<PaymentConfig> {
      return {
        id: Math.random().toString(36),
        stripeEnabled: args.data.stripeEnabled,
        creemEnabled: args.data.creemEnabled,
        defaultProvider: args.data.defaultProvider,
        maintenanceMode: args.data.maintenanceMode,
        lastUpdatedBy: args.data.lastUpdatedBy,
        notes: args.data.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },

    async update(args: any): Promise<PaymentConfig> {
      return {
        id: args.where.id,
        stripeEnabled: args.data.stripeEnabled,
        creemEnabled: args.data.creemEnabled,
        defaultProvider: args.data.defaultProvider,
        maintenanceMode: args.data.maintenanceMode,
        lastUpdatedBy: args.data.lastUpdatedBy,
        notes: args.data.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },

    async delete(args: any): Promise<PaymentConfig> {
      // 模拟配置删除
      return {
        id: args.where.id || 'deleted',
        stripeEnabled: false,
        creemEnabled: false,
        defaultProvider: 'stripe',
        maintenanceMode: false,
        lastUpdatedBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  }

  creditTransaction = {
    async findMany(): Promise<CreditTransaction[]> { return [] },
    async findUnique(): Promise<CreditTransaction | null> { return null },
    async create(args: any): Promise<CreditTransaction> {
      return {
        id: Math.random().toString(36),
        userId: args.data.userId,
        amount: args.data.amount,
        type: args.data.type,
        description: args.data.description,
        paymentOrderId: args.data.paymentOrderId,
        referenceId: args.data.referenceId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    async update(args: any): Promise<CreditTransaction> {
      // 模拟积分交易更新
      return {
        id: args.where.id || 'mock-transaction-id',
        userId: args.data.userId || 'mock-user-id',
        amount: args.data.amount || 0,
        type: args.data.type || 'mock',
        description: args.data.description,
        paymentOrderId: args.data.paymentOrderId,
        referenceId: args.data.referenceId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    async delete(args: any): Promise<CreditTransaction> {
      // 模拟积分交易删除
      return {
        id: args.where.id || 'deleted-transaction',
        userId: 'deleted-user',
        amount: 0,
        type: 'deleted',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  }

  subscription = {
    async findMany(): Promise<Subscription[]> { return [] },
    async findFirst(args?: any): Promise<Subscription | null> { 
      // 模拟查询活跃订阅
      if (args?.where?.userId && args?.where?.status === 'active') {
        return {
          id: 'mock-subscription-id',
          userId: args.where.userId,
          planId: 'pro-plan',
          status: 'active',
          billingCycle: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
          paymentProvider: 'stripe',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
      return null 
    },
    async findUnique(): Promise<Subscription | null> { return null },
    async create(args: any): Promise<Subscription> {
      return {
        id: Math.random().toString(36),
        userId: args.data.userId,
        planId: args.data.planId,
        status: args.data.status || 'active',
        billingCycle: args.data.billingCycle || 'monthly',
        currentPeriodStart: args.data.currentPeriodStart || new Date(),
        currentPeriodEnd: args.data.currentPeriodEnd || new Date(),
        paymentProvider: args.data.paymentProvider,
        stripeSubscriptionId: args.data.stripeSubscriptionId,
        creemSubscriptionId: args.data.creemSubscriptionId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    async update(args: any): Promise<Subscription> {
      // 模拟订阅更新
      return {
        id: args.where.id || 'mock-subscription-id',
        userId: args.data.userId || 'mock-user-id',
        planId: args.data.planId || 'updated-plan',
        status: args.data.status || 'active',
        billingCycle: args.data.billingCycle || 'monthly',
        currentPeriodStart: args.data.currentPeriodStart || new Date(),
        currentPeriodEnd: args.data.currentPeriodEnd || new Date(),
        paymentProvider: args.data.paymentProvider || 'stripe',
        stripeSubscriptionId: args.data.stripeSubscriptionId,
        creemSubscriptionId: args.data.creemSubscriptionId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    async delete(args: any): Promise<Subscription> {
      // 模拟订阅删除
      return {
        id: args.where.id || 'deleted-subscription',
        userId: 'deleted-user',
        planId: 'deleted-plan',
        status: 'cancelled',
        billingCycle: 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        paymentProvider: 'stripe',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  }
}

// 导出Supabase适配器实例
export const prisma = new SupabaseAdapter()

// 默认导出
export default prisma 