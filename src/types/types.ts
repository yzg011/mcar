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

// 解析目标（token + chatId）
export interface TgTarget {
  token: string;
  chatId: string;
}

// 链接加密密钥（用于隐藏 URL 中的 Bot Token，避免明文泄漏）
const LINK_SECRET = 'mc-link-2026-sec';

async function getAesKey(): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(LINK_SECRET)
  );
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

function toUrlSafeBase64(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlSafeBase64(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

// 加密组合码：URL 中只含密文，不出现 Bot Token 明文
export async function encodeTgTarget(token: string, chatId: string): Promise<string> {
  const key = await getAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify({ t: token, c: chatId }));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const bytes = new Uint8Array(iv.length + cipher.byteLength);
  bytes.set(iv);
  bytes.set(new Uint8Array(cipher), iv.length);
  return toUrlSafeBase64(bytes);
}

// 解密链接中的加密码，还原 token + chatId；失败返回 null
export async function decodeTgTarget(enc: string): Promise<TgTarget | null> {
  try {
    const key = await getAesKey();
    const bytes = fromUrlSafeBase64(enc);
    const iv = bytes.slice(0, 12);
    const cipher = bytes.slice(12);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher as unknown as ArrayBuffer
    );
    const obj = JSON.parse(new TextDecoder().decode(plain)) as { t: string; c: string };
    if (!obj.t || !obj.c) return null;
    return { token: obj.t, chatId: obj.c };
  } catch {
    return null;
  }
}
