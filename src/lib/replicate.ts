// 该文件封装与Replicate API的真实交互逻辑，支持不同功能调用不同模型
// 通过环境变量安全读取API Token

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

// Replicate模型配置，按功能区分
const models = {
  remove: {
    // flux-kontext-apps/text-removal
    version: "e28636410bff2b083e38f4e856a5b2be171c8bb6636f527b1a9e84dff29d1c54",
    modelInput: (base64: string) => ({ input_image: `data:image/png;base64,${base64}` })
  },
  enhance: {
    // flux-kontext-apps/restore-image
    version: "85ae46551612b8f778348846b6ce1ce1b340e384fe2062399c0c412be29e107d",
    modelInput: (base64: string) => ({ input_image: `data:image/png;base64,${base64}` })
  },
  // tune: ...（如有微调模型可补充）
}

// 生成带水印的模拟处理图片
async function generateMockProcessedImage(file: File, action: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement?.('canvas') 
    
    // 如果在服务器环境或无canvas支持，返回带标识的data URL
    if (!canvas || typeof document === 'undefined') {
      console.log('🔧 模拟处理模式: 服务器环境，返回标识性结果')
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        // 返回带有特殊标识的base64，表明这是模拟处理的结果
        resolve(`data:${file.type};base64,${base64}`)
      }
      // 由于在服务器环境，我们需要手动转换
      file.arrayBuffer().then(buffer => {
        const base64 = Buffer.from(buffer).toString('base64')
        const mimeType = file.type || 'image/png'
        console.log(`🔧 模拟处理完成: ${action} - 返回原图作为示例结果`)
        resolve(`data:${mimeType};base64,${base64}`)
      })
      return
    }

    // 客户端环境的canvas处理（实际上在API路由中不会执行）
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // 绘制原图
      ctx!.drawImage(img, 0, 0)
      
      // 添加模拟处理效果
      ctx!.fillStyle = 'rgba(255, 0, 0, 0.1)'
      ctx!.fillRect(0, 0, canvas.width, canvas.height)
      
      // 添加水印表示这是模拟处理
      ctx!.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx!.font = '20px Arial'
      ctx!.fillText(`MOCK ${action.toUpperCase()} PROCESSED`, 10, 30)
      
      resolve(canvas.toDataURL(file.type))
    }
    
    // 这在服务器环境中不会执行
    const reader = new FileReader()
    reader.onload = () => img.src = reader.result as string
    reader.readAsDataURL(file)
  })
}

// 通用AI图片处理函数
export async function callReplicateAPI(action: 'remove' | 'enhance', file: File): Promise<string> {
  if (!REPLICATE_API_TOKEN) {
    console.log('⚠️ Replicate API token not set, using mock processing for development')
    console.log('📝 提示: 要使用真实的AI处理，请在.env.local文件中设置REPLICATE_API_TOKEN')
    console.log('🔗 获取API Token: https://replicate.com/account/api-tokens')
    
    // 开发环境：模拟处理
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = file.type || 'image/png'
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log(`🔧 模拟处理完成: ${action} - 文件大小: ${file.size} bytes`)
    console.log('💡 当前返回原图，配置REPLICATE_API_TOKEN后将使用真实AI处理')
    
    return `data:${mimeType};base64,${base64}`
  }
  
  const model = models[action]
  if (!model) throw new Error('Unknown action')

  // 读取图片为base64
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  // 调试日志：打印模型和请求体
  console.log('[Replicate] 调用模型:', model.version)
  console.log('[Replicate] 请求input:', model.modelInput(base64))

  // 1. 创建预测任务
  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: model.version,
      input: model.modelInput(base64)
    })
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[Replicate] 创建预测失败:', err)
    throw new Error('Failed to create prediction: ' + err)
  }
  const data = await res.json()
  let prediction = data

  // 2. 轮询获取结果
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    await new Promise(r => setTimeout(r, 1500))
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    })
    prediction = await pollRes.json()
    console.log('[Replicate] 轮询状态:', prediction.status)
  }
  if (prediction.status === 'succeeded') {
    // 返回图片URL（部分模型为数组，部分为字符串）
    console.log('[Replicate] 处理成功，输出:', prediction.output)
    if (Array.isArray(prediction.output)) return prediction.output[0]
    return prediction.output
  }
  console.error('[Replicate] 处理失败:', prediction.error || prediction)
  throw new Error('Replicate AI failed: ' + (prediction.error || 'Unknown error'))
} 