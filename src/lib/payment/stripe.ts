import Stripe from "stripe";
import { 
  CreatePaymentParams, 
  PaymentResponse, 
  Currency,
  ProductType 
} from "@/lib/types/payment";
import { formatAmountForProvider } from "./router";
import { getStripeClient, isStripeAvailable } from "@/lib/stripe-client";
import { prisma } from "@/lib/database";
import { getUuid } from "@/lib/utils/hash";

// 🔥 创建Stripe支付会话
export async function createStripeCheckout(params: CreatePaymentParams): Promise<PaymentResponse> {
  try {
    // 检查Stripe是否可用
    if (!isStripeAvailable()) {
      return {
        success: false,
        orderId: "",
        provider: "stripe",
        error: "Stripe支付未启用或配置不完整",
      };
    }

    const stripe = getStripeClient();
    
    const {
      userId,
      email,
      amount,
      currency,
      productType,
      productId,
      productName,
      description,
      metadata = {}
    } = params;

    // 格式化金额为最小单位
    const formattedAmount = formatAmountForProvider(amount, currency);

    // 构建支付会话参数
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: getPaymentMethodsForCurrency(currency),
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: productName || "Flux Kontext Credits",
              description: description,
            },
            unit_amount: formattedAmount,
            recurring: productType === "subscription" ? {
              interval: "month", // 可以根据需要调整
            } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: productType === "subscription" ? "subscription" : "payment",
      customer_email: email,
      metadata: {
        userId,
        productType,
        productId: productId || "",
        ...metadata,
      },
      success_url: `${process.env.NEXT_PUBLIC_WEB_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_WEB_URL}/pricing`,
      allow_promotion_codes: true,
    };

    // 为中国用户添加本地支付方式
    if (currency === "CNY") {
      sessionParams.payment_method_options = {
        wechat_pay: {
          client: "web",
        },
        alipay: {},
      };
    }

    // 创建支付会话
    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      success: true,
      orderId: session.id,
      checkoutUrl: session.url!,
      sessionId: session.id,
      provider: "stripe",
    };
  } catch (error) {
    console.error("Stripe支付创建失败:", error);
    return {
      success: false,
      orderId: "",
      provider: "stripe",
      error: error instanceof Error ? error.message : "支付创建失败",
    };
  }
}

// 🔥 根据货币获取支持的支付方式
function getPaymentMethodsForCurrency(currency: Currency): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const basePaymentMethods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ["card"];
  
  switch (currency) {
    case "CNY":
      return [...basePaymentMethods, "wechat_pay", "alipay"];
    case "USD":
    case "EUR":
    case "GBP":
      return [...basePaymentMethods, "link"];
    default:
      return basePaymentMethods;
  }
}

// 🔥 处理Stripe Webhook
export async function handleStripeWebhook(
  body: string,
  signature: string
): Promise<{ success: boolean; event?: Stripe.Event; error?: string }> {
  try {
    // 检查Stripe是否可用
    if (!isStripeAvailable()) {
      return {
        success: false,
        error: "Stripe支付未启用或配置不完整",
      };
    }

    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`收到Stripe Webhook事件: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
        
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log(`未处理的Stripe事件类型: ${event.type}`);
    }

    return { success: true, event };
  } catch (error) {
    console.error("Stripe Webhook处理失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Webhook处理失败",
    };
  }
}

// 🔥 处理支付会话完成
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const { metadata, amount_total, customer_email, payment_status } = session;
    if (!metadata) {
      console.error('❌ Stripe会话缺少metadata信息');
      return;
    }

    const { userId, productType, productId } = metadata;

    console.log(`🔥 Stripe支付完成 - 用户: ${userId}, 产品: ${productType}, 会话: ${session.id}`);
    
    // 🔍 查找支付订单
    const paymentOrder = await prisma.paymentOrder.findFirst({
      where: {
        OR: [
          { stripeSessionId: session.id },
          { userId: userId, status: 'pending' }
        ]
      }
    });

    if (!paymentOrder) {
      console.error(`❌ 找不到支付订单: ${session.id}`);
      return;
    }

    // 🛡️ 订单完整性验证（参考CREEM的5重验证）
    console.log('🔒 开始Stripe订单完整性验证...');
    
    // 1️⃣ 验证订单状态
    if (paymentOrder.status === 'completed') {
      console.warn(`⚠️ 订单已完成，跳过重复处理: ${paymentOrder.orderNumber}`);
      return;
    }

    // 2️⃣ 验证支付状态
    if (payment_status !== 'paid') {
      console.error(`❌ 支付状态异常: ${payment_status}`);
      await markStripeOrderAsFailed(paymentOrder.id, `支付状态异常: ${payment_status}`);
      return;
    }

    // 3️⃣ 验证金额匹配（Stripe金额以分为单位）
    const expectedAmount = paymentOrder.amount * 100; // 转换为分
    const amountDifference = Math.abs(expectedAmount - (amount_total || 0));
    if (amountDifference > 1) { // 允许1分的误差
      console.error(`💰 金额不匹配 - 订单: $${paymentOrder.amount}, Stripe: $${(amount_total || 0) / 100}`);
      await markStripeOrderAsFailed(paymentOrder.id, `金额不匹配: 订单$${paymentOrder.amount} vs Stripe$${(amount_total || 0) / 100}`);
      return;
    }

    // 4️⃣ 验证用户匹配
    if (paymentOrder.userId !== userId) {
      console.error(`👤 用户不匹配 - 订单: ${paymentOrder.userId}, Stripe: ${userId}`);
      await markStripeOrderAsFailed(paymentOrder.id, `用户不匹配: ${paymentOrder.userId} vs ${userId}`);
      return;
    }

    // 5️⃣ 验证邮箱匹配
    if (paymentOrder.customerEmail !== customer_email) {
      console.error(`📧 邮箱不匹配 - 订单: ${paymentOrder.customerEmail}, Stripe: ${customer_email}`);
      await markStripeOrderAsFailed(paymentOrder.id, `邮箱不匹配: ${paymentOrder.customerEmail} vs ${customer_email}`);
      return;
    }

    console.log('✅ Stripe订单完整性验证通过');

    // 🔄 更新支付订单状态
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        status: 'completed',
        paidAt: new Date(),
        stripePaymentId: session.payment_intent as string,
        metadata: {
          ...paymentOrder.metadata,
          completedAt: new Date().toISOString(),
          stripeData: {
            sessionId: session.id,
            paymentIntent: session.payment_intent,
            customerEmail: customer_email,
            amountTotal: amount_total
          },
          integrityVerified: true
        }
      }
    });

    // 🎯 根据产品类型处理业务逻辑
    if (productType === 'creditPack' || productType === 'credits') {
      // 💰 积分包：发放积分
      let creditsToAdd: number;
      
      // 优先使用验证过的积分数量
      if (paymentOrder.metadata?.expectedCredits && typeof paymentOrder.metadata.expectedCredits === 'number') {
        creditsToAdd = paymentOrder.metadata.expectedCredits;
        console.log(`使用验证过的积分数量: ${creditsToAdd}`);
      } else {
        // 回退到计算方式
        creditsToAdd = calculateCreditsFromStripeProduct(paymentOrder.productId, paymentOrder.amount);
        console.log(`使用计算的积分数量: ${creditsToAdd}`);
      }
      
      // 更新用户积分
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: creditsToAdd
          }
        }
      });

      // 创建积分交易记录
      await prisma.creditTransaction.create({
        data: {
          id: getUuid(),
          userId: userId,
          amount: creditsToAdd,
          type: 'purchase',
          description: `购买积分包: ${paymentOrder.productName}`,
          paymentOrderId: paymentOrder.id,
          referenceId: session.id
        }
      });

      console.log(`✅ 积分发放成功 - 用户: ${userId}, 积分: ${creditsToAdd}`);

    } else if (productType === 'subscription') {
      // 📅 订阅计划：创建或更新订阅
      const billingCycle = metadata.billingCycle || 'monthly';
      const planId = paymentOrder.productId;
      
      // 计算订阅周期
      const now = new Date();
      const periodEnd = new Date(now);
      if (billingCycle === 'yearly') {
        periodEnd.setFullYear(now.getFullYear() + 1);
      } else {
        periodEnd.setMonth(now.getMonth() + 1);
      }

      // 查找现有订阅
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId: userId,
          status: 'active'
        }
      });

      if (existingSubscription) {
        // 更新现有订阅
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            planId: planId,
            billingCycle: billingCycle,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            stripeSubscriptionId: session.subscription as string
          }
        });
        
        console.log(`✅ 订阅更新成功 - 用户: ${userId}, 计划: ${planId}`);
      } else {
        // 创建新订阅
        await prisma.subscription.create({
          data: {
            id: getUuid(),
            userId: userId,
            planId: planId,
            status: 'active',
            billingCycle: billingCycle,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            paymentProvider: 'stripe',
            stripeSubscriptionId: session.subscription as string
          }
        });
        
        console.log(`✅ 订阅创建成功 - 用户: ${userId}, 计划: ${planId}`);
      }
    }

    console.log(`🎉 Stripe支付处理完成 - 订单: ${paymentOrder.orderNumber}`);

  } catch (error) {
    console.error('❌ 处理Stripe支付完成事件失败:', error);
    throw error;
  }
}

// 🔥 标记Stripe订单为失败
async function markStripeOrderAsFailed(orderId: string, reason: string) {
  await prisma.paymentOrder.update({
    where: { id: orderId },
    data: {
      status: 'failed',
      metadata: {
        error: reason,
        failedAt: new Date().toISOString(),
        provider: 'stripe'
      }
    }
  });
}

// 🔥 根据Stripe产品计算积分
function calculateCreditsFromStripeProduct(productId: string, amount: number): number {
  // 根据产品ID和金额计算积分
  const creditRates: Record<string, number> = {
    'starter': 100,    // $9.99 = 100积分
    'creator': 500,    // $29.99 = 500积分  
    'business': 1200   // $59.99 = 1200积分
  };
  
  return creditRates[productId] || Math.floor(amount * 10); // 默认：$1 = 10积分
}

// 🔥 处理订阅创建
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const { customer, metadata } = subscription;
    
    console.log(`订阅创建 - 客户: ${customer}, 订阅: ${subscription.id}`);
    
    // TODO: 创建订阅记录
    // await createSubscription({
    //   userId: metadata?.userId,
    //   stripeSubscriptionId: subscription.id,
    //   status: subscription.status,
    //   currentPeriodStart: new Date(subscription.current_period_start * 1000),
    //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    // });
  } catch (error) {
    console.error("处理订阅创建事件失败:", error);
  }
}

// 🔥 处理订阅更新
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log(`订阅更新 - 订阅: ${subscription.id}, 状态: ${subscription.status}`);
    
    // TODO: 更新订阅记录
    // await updateSubscription(subscription.id, {
    //   status: subscription.status,
    //   currentPeriodStart: new Date(subscription.current_period_start * 1000),
    //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    // });
  } catch (error) {
    console.error("处理订阅更新事件失败:", error);
  }
}

// 🔥 处理订阅删除
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log(`订阅取消 - 订阅: ${subscription.id}`);
    
    // TODO: 更新订阅状态为已取消
    // await updateSubscription(subscription.id, { status: "cancelled" });
  } catch (error) {
    console.error("处理订阅删除事件失败:", error);
  }
}

// 🔥 处理发票支付成功
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log(`发票支付成功 - 发票: ${invoice.id}`);
    
    // TODO: 处理订阅续费逻辑
  } catch (error) {
    console.error("处理发票支付成功事件失败:", error);
  }
}

// 🔥 处理发票支付失败
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log(`发票支付失败 - 发票: ${invoice.id}`);
    
    // TODO: 处理支付失败逻辑，可能需要暂停服务或发送通知
  } catch (error) {
    console.error("处理发票支付失败事件失败:", error);
  }
}

// 🔥 创建Stripe客户
export async function createStripeCustomer(email: string, name?: string) {
  try {
    if (!isStripeAvailable()) {
      throw new Error("Stripe支付未启用或配置不完整");
    }
    
    const stripe = getStripeClient();
    const customer = await stripe.customers.create({
      email,
      name,
    });
    return customer;
  } catch (error) {
    console.error("创建Stripe客户失败:", error);
    throw error;
  }
}

// 🔥 获取支付会话详情
export async function getStripeSession(sessionId: string) {
  try {
    if (!isStripeAvailable()) {
      throw new Error("Stripe支付未启用或配置不完整");
    }
    
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error("获取Stripe会话失败:", error);
    throw error;
  }
} 