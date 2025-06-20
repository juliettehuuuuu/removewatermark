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

// 通用AI图片处理函数
export async function callReplicateAPI(action: 'remove' | 'enhance', file: File): Promise<string> {
  if (!REPLICATE_API_TOKEN) {
    console.log('⚠️ Replicate API token not set, using mock processing for development')
    // 开发环境：模拟处理，返回原图
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        // 返回原图的 data URL
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })
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