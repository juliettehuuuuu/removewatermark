import { v4 as uuidv4 } from 'uuid';

export function getUuid(): string {
  return uuidv4();
}

export function getSnowId(): string {
  // 简化的雪花ID生成器
  // 时间戳(42位) + 机器ID(10位) + 序列号(12位)
  const timestamp = Date.now();
  const machineId = Math.floor(Math.random() * 1024); // 0-1023
  const sequence = Math.floor(Math.random() * 4096); // 0-4095
  
  return `${timestamp}${machineId.toString().padStart(4, '0')}${sequence.toString().padStart(4, '0')}`;
}

export function generateOrderNo(): string {
  return getSnowId();
} 