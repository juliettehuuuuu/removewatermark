import { redirect } from 'next/navigation'

// 首页直接重定向到工具页面
export default function HomePage() {
  redirect('/tool')
}
