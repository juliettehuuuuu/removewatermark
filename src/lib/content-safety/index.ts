// 🛡️ AI内容安全防护系统
// 集成多个AI审核API，提供三层防护机制

export interface ContentSafetyConfig {
  enablePreFilter: boolean;      // 启用输入预过滤
  enablePostFilter: boolean;     // 启用输出后审核
  enableRealTimeMonitor: boolean; // 启用实时监控
  strictMode: boolean;           // 严格模式
  providers: ContentSafetyProvider[];
}

export interface ContentSafetyProvider {
  name: 'google' | 'azure' | 'openai' | 'api4ai' | 'sightengine';
  enabled: boolean;
  priority: number;              // 优先级 1-5
  threshold: number;             // 阈值 0-1
  apiKey: string;
  endpoint?: string;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  confidence: number;            // 置信度 0-1
  categories: SafetyCategory[];
  provider: string;
  processingTime: number;
  details?: any;
}

export interface SafetyCategory {
  category: 'nsfw' | 'violence' | 'hate' | 'self-harm' | 'illegal' | 'spam';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description?: string;
}

// 🔥 主要内容安全类
export class ContentSafetyService {
  private config: ContentSafetyConfig;
  private providers: Map<string, ContentSafetyProvider>;
  
  constructor(config: ContentSafetyConfig) {
    this.config = config;
    this.providers = new Map();
    this.initializeProviders();
  }

  // 🔍 输入预过滤（第一层防护）
  async checkPromptSafety(prompt: string): Promise<SafetyCheckResult> {
    console.log('🔍 开始提示词安全检查...');
    
    // 1️⃣ 关键词黑名单检查
    const keywordCheck = await this.checkBlacklistKeywords(prompt);
    if (!keywordCheck.isSafe) {
      return keywordCheck;
    }

    // 2️⃣ AI语义分析
    const semanticCheck = await this.checkSemanticSafety(prompt);
    if (!semanticCheck.isSafe) {
      return semanticCheck;
    }

    // 3️⃣ 多语言检测
    const languageCheck = await this.checkLanguageSafety(prompt);
    
    return {
      isSafe: true,
      confidence: Math.min(keywordCheck.confidence, semanticCheck.confidence, languageCheck.confidence),
      categories: [],
      provider: 'pre-filter',
      processingTime: Date.now()
    };
  }

  // 🖼️ 图像内容安全检查（第三层防护）
  async checkImageSafety(imageUrl: string): Promise<SafetyCheckResult> {
    console.log('🖼️ 开始图像内容安全检查...');
    
    const results: SafetyCheckResult[] = [];
    
    // 并行调用多个API提供商
    const promises = this.config.providers
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map(provider => this.callProvider(provider, imageUrl));
    
    try {
      const providerResults = await Promise.allSettled(promises);
      
      for (const result of providerResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
      
      // 综合判断结果
      return this.aggregateResults(results);
      
    } catch (error) {
      console.error('❌ 图像安全检查失败:', error);
      
      // 失败时采用保守策略
      return {
        isSafe: false,
        confidence: 0,
        categories: [{ 
          category: 'illegal', 
          severity: 'critical', 
          confidence: 1,
          description: '安全检查服务异常，采用保守策略'
        }],
        provider: 'fallback',
        processingTime: Date.now()
      };
    }
  }

  // 🔥 调用具体的API提供商
  private async callProvider(provider: ContentSafetyProvider, imageUrl: string): Promise<SafetyCheckResult> {
    const startTime = Date.now();
    
    switch (provider.name) {
      case 'google':
        return await this.callGoogleVision(provider, imageUrl, startTime);
      
      case 'azure':
        return await this.callAzureContentSafety(provider, imageUrl, startTime);
      
      case 'openai':
        return await this.callOpenAIModeration(provider, imageUrl, startTime);
      
      case 'api4ai':
        return await this.callAPI4AI(provider, imageUrl, startTime);
      
      case 'sightengine':
        return await this.callSightengine(provider, imageUrl, startTime);
      
      default:
        throw new Error(`不支持的提供商: ${provider.name}`);
    }
  }

  // 🔍 Google Cloud Vision API
  private async callGoogleVision(provider: ContentSafetyProvider, imageUrl: string, startTime: number): Promise<SafetyCheckResult> {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${provider.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [{ type: 'SAFE_SEARCH_DETECTION' }]
        }]
      })
    });

    const data = await response.json();
    const safeSearch = data.responses[0]?.safeSearchAnnotation;
    
    if (!safeSearch) {
      throw new Error('Google Vision API响应异常');
    }

    // 解析Google的安全等级
    const categories: SafetyCategory[] = [];
    const riskLevels = ['VERY_UNLIKELY', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'VERY_LIKELY'];
    
    if (riskLevels.indexOf(safeSearch.adult) >= 2) {
      categories.push({
        category: 'nsfw',
        severity: riskLevels.indexOf(safeSearch.adult) >= 4 ? 'critical' : 'high',
        confidence: (riskLevels.indexOf(safeSearch.adult) + 1) / 5
      });
    }
    
    if (riskLevels.indexOf(safeSearch.violence) >= 2) {
      categories.push({
        category: 'violence',
        severity: riskLevels.indexOf(safeSearch.violence) >= 4 ? 'critical' : 'high',
        confidence: (riskLevels.indexOf(safeSearch.violence) + 1) / 5
      });
    }

    const isSafe = categories.length === 0 || categories.every(c => c.severity === 'low');
    
    return {
      isSafe,
      confidence: isSafe ? 0.95 : 0.1,
      categories,
      provider: 'google',
      processingTime: Date.now() - startTime,
      details: safeSearch
    };
  }

  // 🔍 Azure Content Safety API
  private async callAzureContentSafety(provider: ContentSafetyProvider, imageUrl: string, startTime: number): Promise<SafetyCheckResult> {
    const endpoint = provider.endpoint || 'https://your-resource.cognitiveservices.azure.com/contentsafety/image:analyze?api-version=2023-10-01';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': provider.apiKey
      },
      body: JSON.stringify({
        image: { url: imageUrl }
      })
    });

    const data = await response.json();
    
    if (!data.categoriesAnalysis) {
      throw new Error('Azure Content Safety API响应异常');
    }

    const categories: SafetyCategory[] = [];
    
    for (const analysis of data.categoriesAnalysis) {
      if (analysis.severity >= 2) { // Azure severity: 0-6
        categories.push({
          category: analysis.category.toLowerCase() as any,
          severity: analysis.severity >= 4 ? 'critical' : 'high',
          confidence: analysis.severity / 6
        });
      }
    }

    const isSafe = categories.length === 0;
    
    return {
      isSafe,
      confidence: isSafe ? 0.94 : 0.1,
      categories,
      provider: 'azure',
      processingTime: Date.now() - startTime,
      details: data
    };
  }

  // 🔍 API4AI NSFW Detection
  private async callAPI4AI(provider: ContentSafetyProvider, imageUrl: string, startTime: number): Promise<SafetyCheckResult> {
    const response = await fetch('https://api.api4ai.cloud/v1/nsfw', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: imageUrl
      })
    });

    const data = await response.json();
    
    if (!data.results) {
      throw new Error('API4AI响应异常');
    }

    const nsfwScore = data.results[0]?.entities[0]?.classes?.nsfw || 0;
    const categories: SafetyCategory[] = [];
    
    if (nsfwScore > provider.threshold) {
      categories.push({
        category: 'nsfw',
        severity: nsfwScore > 0.8 ? 'critical' : nsfwScore > 0.5 ? 'high' : 'medium',
        confidence: nsfwScore
      });
    }

    const isSafe = categories.length === 0;
    
    return {
      isSafe,
      confidence: isSafe ? 0.96 : 0.1,
      categories,
      provider: 'api4ai',
      processingTime: Date.now() - startTime,
      details: data
    };
  }

  // 🔍 OpenAI Moderation API
  private async callOpenAIModeration(provider: ContentSafetyProvider, imageUrl: string, startTime: number): Promise<SafetyCheckResult> {
    // OpenAI Moderation主要用于文本，这里作为补充
    // 可以结合GPT-4V进行图像分析
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请分析这张图片是否包含NSFW内容、暴力内容或其他不当内容。只回答：SAFE 或 UNSAFE，并给出置信度分数(0-1)。'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }],
        max_tokens: 50
      })
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    const isSafe = content.includes('SAFE') && !content.includes('UNSAFE');
    const confidenceMatch = content.match(/(\d+\.?\d*)/);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;

    const categories: SafetyCategory[] = [];
    if (!isSafe) {
      categories.push({
        category: 'nsfw',
        severity: confidence > 0.8 ? 'critical' : 'high',
        confidence
      });
    }
    
    return {
      isSafe,
      confidence: isSafe ? confidence : 0.1,
      categories,
      provider: 'openai',
      processingTime: Date.now() - startTime,
      details: { response: content }
    };
  }

  // 🔍 Sightengine API
  private async callSightengine(provider: ContentSafetyProvider, imageUrl: string, startTime: number): Promise<SafetyCheckResult> {
    const response = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: imageUrl,
        models: 'nudity,wad,offensive',
        api_user: provider.apiKey.split(':')[0],
        api_secret: provider.apiKey.split(':')[1]
      })
    });

    const data = await response.json();
    
    const categories: SafetyCategory[] = [];
    
    // 检查裸体内容
    if (data.nudity?.sexual > provider.threshold) {
      categories.push({
        category: 'nsfw',
        severity: data.nudity.sexual > 0.8 ? 'critical' : 'high',
        confidence: data.nudity.sexual
      });
    }
    
    // 检查武器和毒品
    if (data.weapon > provider.threshold) {
      categories.push({
        category: 'violence',
        severity: 'high',
        confidence: data.weapon
      });
    }

    const isSafe = categories.length === 0;
    
    return {
      isSafe,
      confidence: isSafe ? 0.93 : 0.1,
      categories,
      provider: 'sightengine',
      processingTime: Date.now() - startTime,
      details: data
    };
  }

  // 🔥 关键词黑名单检查
  private async checkBlacklistKeywords(prompt: string): Promise<SafetyCheckResult> {
    const blacklist = [
      // NSFW关键词
      'nude', 'naked', 'sex', 'porn', 'xxx', 'adult', 'erotic',
      '裸体', '色情', '成人', '性感', '诱惑', '暴露',
      
      // 暴力关键词  
      'violence', 'blood', 'kill', 'murder', 'weapon', 'gun',
      '暴力', '血腥', '杀戮', '武器', '枪支', '刀具',
      
      // 仇恨言论
      'hate', 'racist', 'discrimination', 'nazi',
      '仇恨', '歧视', '种族主义',
      
      // 非法内容
      'drug', 'cocaine', 'marijuana', 'illegal',
      '毒品', '大麻', '可卡因', '非法'
    ];

    const lowerPrompt = prompt.toLowerCase();
    const foundKeywords = blacklist.filter(keyword => 
      lowerPrompt.includes(keyword.toLowerCase())
    );

    if (foundKeywords.length > 0) {
      return {
        isSafe: false,
        confidence: 0.9,
        categories: [{
          category: 'illegal',
          severity: 'high',
          confidence: 0.9,
          description: `检测到违规关键词: ${foundKeywords.join(', ')}`
        }],
        provider: 'keyword-filter',
        processingTime: 1
      };
    }

    return {
      isSafe: true,
      confidence: 0.8,
      categories: [],
      provider: 'keyword-filter',
      processingTime: 1
    };
  }

  // 🔥 语义安全分析
  private async checkSemanticSafety(prompt: string): Promise<SafetyCheckResult> {
    // 这里可以集成更高级的NLP模型进行语义分析
    // 暂时使用简单的模式匹配
    
    const suspiciousPatterns = [
      /\b(without clothes?|no clothes?)\b/i,
      /\b(very young|child|kid|minor)\b.*\b(sexy|attractive|nude)\b/i,
      /\b(violence|violent|aggressive)\b.*\b(scene|image|picture)\b/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(prompt)) {
        return {
          isSafe: false,
          confidence: 0.85,
          categories: [{
            category: 'illegal',
            severity: 'critical',
            confidence: 0.85,
            description: '检测到可疑语义模式'
          }],
          provider: 'semantic-filter',
          processingTime: 2
        };
      }
    }

    return {
      isSafe: true,
      confidence: 0.7,
      categories: [],
      provider: 'semantic-filter',
      processingTime: 2
    };
  }

  // 🔥 多语言安全检查
  private async checkLanguageSafety(prompt: string): Promise<SafetyCheckResult> {
    // 检测是否包含多种语言的违规内容
    // 这里可以集成Google Translate API进行翻译后检查
    
    return {
      isSafe: true,
      confidence: 0.6,
      categories: [],
      provider: 'language-filter',
      processingTime: 1
    };
  }

  // 🔥 聚合多个API结果
  private aggregateResults(results: SafetyCheckResult[]): SafetyCheckResult {
    if (results.length === 0) {
      return {
        isSafe: false,
        confidence: 0,
        categories: [],
        provider: 'no-results',
        processingTime: 0
      };
    }

    // 如果任何一个API认为不安全，则判定为不安全
    const unsafeResults = results.filter(r => !r.isSafe);
    
    if (unsafeResults.length > 0) {
      // 选择置信度最高的不安全结果
      const mostConfidentUnsafe = unsafeResults.reduce((prev, current) => 
        current.confidence > prev.confidence ? current : prev
      );
      
      return {
        isSafe: false,
        confidence: mostConfidentUnsafe.confidence,
        categories: mostConfidentUnsafe.categories,
        provider: `aggregated-${mostConfidentUnsafe.provider}`,
        processingTime: Math.max(...results.map(r => r.processingTime))
      };
    }

    // 所有API都认为安全，计算平均置信度
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    return {
      isSafe: true,
      confidence: avgConfidence,
      categories: [],
      provider: `aggregated-${results.map(r => r.provider).join(',')}`,
      processingTime: Math.max(...results.map(r => r.processingTime))
    };
  }

  // 🔧 初始化提供商
  private initializeProviders(): void {
    for (const provider of this.config.providers) {
      if (provider.enabled && provider.apiKey) {
        this.providers.set(provider.name, provider);
        console.log(`✅ 内容安全提供商已启用: ${provider.name}`);
      }
    }
  }

  // 📊 获取安全统计
  async getSafetyStats(): Promise<any> {
    // 返回安全检查统计信息
    return {
      totalChecks: 0,
      blockedContent: 0,
      averageProcessingTime: 0,
      providerStats: {}
    };
  }
}

// 🔥 默认配置
export const defaultContentSafetyConfig: ContentSafetyConfig = {
  enablePreFilter: true,
  enablePostFilter: true,
  enableRealTimeMonitor: true,
  strictMode: true,
  providers: [
    {
      name: 'google',
      enabled: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      priority: 1,
      threshold: 0.5,
      apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY || ''
    },
    {
      name: 'api4ai',
      enabled: !!process.env.API4AI_API_KEY,
      priority: 2,
      threshold: 0.6,
      apiKey: process.env.API4AI_API_KEY || ''
    },
    {
      name: 'azure',
      enabled: !!process.env.AZURE_CONTENT_SAFETY_KEY,
      priority: 3,
      threshold: 0.5,
      apiKey: process.env.AZURE_CONTENT_SAFETY_KEY || '',
      endpoint: process.env.AZURE_CONTENT_SAFETY_ENDPOINT
    }
  ]
};

// 🔥 创建全局实例
export const contentSafetyService = new ContentSafetyService(defaultContentSafetyConfig); 