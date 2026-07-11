import { supabase } from '@/db/supabase';
import type { MoveCarRoom } from '@/types/types';

/**
 * 从 Bark 输入中提取纯接口码（不含域名/协议），用于 DB 存储与 owner 页 URL。
 * - 纯接口码（如 mnrbXwwBoF4cJPhR3Vw5jf）→ 原样返回
 * - 完整自建服务器 URL（如 https://bk.z2m.store/mnrbXwwBoF4cJPhR3Vw5jf/）
 *   → 取第一个路径段，即 mnrbXwwBoF4cJPhR3Vw5jf
 */
export function extractBarkCode(input: string): string {
  if (!input.startsWith('http://') && !input.startsWith('https://')) return input;
  try {
    const { pathname } = new URL(input);
    // pathname 形如 /mnrbXwwBoF4cJPhR3Vw5jf/ → 取第一个非空段
    const code = pathname.split('/').find((seg) => seg.length > 0) ?? input;
    return code;
  } catch {
    return input;
  }
}

// 以 bark_code 作为唯一标识，创建或重置挪车房间
export async function upsertRoom(params: {
  bark_code: string;
  message: string;
  tags: string[];
  location_lat: number | null;
  location_lng: number | null;
  location_name: string;
}): Promise<{ data: MoveCarRoom | null; error: string | null }> {
  const { data, error } = await supabase
    .from('move_car_rooms')
    .upsert(
      {
        room_code: params.bark_code,
        message: params.message || '',
        tags: params.tags,
        location_lat: params.location_lat,
        location_lng: params.location_lng,
        location_name: params.location_name,
        status: 'waiting',
      },
      { onConflict: 'room_code' }
    )
    .select()
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as MoveCarRoom, error: null };
}

// 按 bark_code 查询房间
export async function getRoomByCode(
  bark_code: string
): Promise<{ data: MoveCarRoom | null; error: string | null }> {
  const { data, error } = await supabase
    .from('move_car_rooms')
    .select('*')
    .eq('room_code', bark_code)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as MoveCarRoom | null, error: null };
}

// 更新房间状态，可附带车主回复留言
export async function updateRoomStatus(
  bark_code: string,
  status: MoveCarRoom['status'],
  owner_message?: string
): Promise<{ error: string | null }> {
  const payload: Record<string, unknown> = { status };
  if (owner_message !== undefined) payload.owner_message = owner_message;

  const { error } = await supabase
    .from('move_car_rooms')
    .update(payload)
    .eq('room_code', bark_code);

  if (error) return { error: error.message };
  return { error: null };
}

// 调用 Bark 推送通知（支持官方服务器和自建服务器）
// bark_code 可以是：
//   - 纯接口码：mnrbXwwBoF4cJPhR3Vw5jf  → 使用 https://api.day.app/{code}/
//   - 完整服务器 URL：https://bk.example.com/mnrbXwwBoF4cJPhR3Vw5jf/  → 直接使用
export async function sendBarkNotification(params: {
  bark_code: string;
  title: string;
  body: string;
  url?: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const encodedTitle = encodeURIComponent(params.title);
    const encodedBody = encodeURIComponent(params.body);
    const querySuffix = params.url ? `?url=${encodeURIComponent(params.url)}` : '';

    // 判断是否为自建服务器完整 URL
    const isFullUrl = params.bark_code.startsWith('http://') || params.bark_code.startsWith('https://');
    const base = isFullUrl
      ? params.bark_code.replace(/\/$/, '')   // 去掉末尾斜杠后拼接
      : `https://api.day.app/${params.bark_code}`;

    const barkUrl = `${base}/${encodedTitle}/${encodedBody}${querySuffix}`;
    const res = await fetch(barkUrl);
    if (!res.ok) return { success: false, error: `Bark 响应: ${res.status}` };
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
