// 模块化文案系统统一导入文件
// 每个模块独立管理，确保文案安全和可维护性

import homeData from './home.json'
import generatorData from './generator.json'
import pricingData from './pricing.json'
import authData from './auth.json'
import commonData from './common.json'
import seoData from './seo.json'

// 导出各个模块
export const home = homeData           // 主页内容 (hero, features, faq等)
export const generator = generatorData // 生成器文案 (设置、错误等)
export const pricing = pricingData     // 定价文案 (计划、FAQ等) - 独立管理
export const auth = authData           // 认证文案 (登录、注册等)
export const common = commonData       // 通用文案 (按钮、导航、表单等)
export const seo = seoData             // SEO文案 (元数据、结构化数据等)

// 为了向后兼容，保留一些导出方式
export const footer = homeData.footer
export const twitterShowcase = homeData.twitterShowcase

// 类型定义
export type HomeData = typeof homeData
export type GeneratorData = typeof generatorData
export type PricingData = typeof pricingData
export type AuthData = typeof authData
export type CommonData = typeof commonData
export type SEOData = typeof seoData

// 简单的获取文案函数 - 支持跨模块访问
export function getText(path: string, fallback: string = ''): string {
  const [module, ...keys] = path.split('.')
  
  let moduleData: any
  switch (module) {
    case 'home':
      moduleData = homeData
      break
    case 'generator':
      moduleData = generatorData
      break
    case 'pricing':
      moduleData = pricingData
      break
    case 'auth':
      moduleData = authData
      break
    case 'common':
      moduleData = commonData
      break
    case 'seo':
      moduleData = seoData
      break
    default:
      // 如果没有指定模块，默认在home中查找
      moduleData = homeData
      keys.unshift(module) // 将模块名放回keys数组
  }
  
  let result: any = moduleData
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return fallback
    }
  }
  
  return typeof result === 'string' ? result : fallback
}

// 获取数组类型的文案
export function getTextArray(path: string): any[] {
  const [module, ...keys] = path.split('.')
  
  let moduleData: any
  switch (module) {
    case 'home':
      moduleData = homeData
      break
    case 'generator':
      moduleData = generatorData
      break
    case 'pricing':
      moduleData = pricingData
      break
    case 'auth':
      moduleData = authData
      break
    case 'common':
      moduleData = commonData
      break
    case 'seo':
      moduleData = seoData
      break
    default:
      moduleData = homeData
      keys.unshift(module)
  }
  
  let result: any = moduleData
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return []
    }
  }
  
  return Array.isArray(result) ? result : []
}

// 模块信息统计
export const moduleStats = {
  home: Object.keys(homeData).length,
  generator: Object.keys(generatorData).length,
  pricing: Object.keys(pricingData).length,
  auth: Object.keys(authData).length,
  common: Object.keys(commonData).length,
  seo: Object.keys(seoData).length
}

// 默认导出主页内容
export default homeData 