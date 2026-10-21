// 位置信息
export interface LocationInfo {
  lat: number;
  lng: number;
  name?: string;
}

// 快捷标签定义
export interface QuickTag {
  label: string;
  emoji: string;
  value: string;
}

// TG 消息状态（由 getUpdates 轮询派生，无数据库）
export interface TgRoomStatus {
  confirmed: boolean;
  ownerMessage: string | null;
}

// 解析组合码 token@chatId
export interface TgTarget {
  token: string;
  chatId: string;
}

export function parseTgCode(code: string): TgTarget | null {
  const idx = code.lastIndexOf('@');
  if (idx <= 0 || idx === code.length - 1) return null;
  return { token: code.slice(0, idx), chatId: code.slice(idx + 1) };
}

export function buildTgCode(token: string, chatId: string): string {
  return `${token}@${chatId}`;
}
