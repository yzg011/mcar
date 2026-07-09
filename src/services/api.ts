import { supabase } from '@/db/supabase';
import type { MoveCarRoom } from '@/types/types';

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

// 调用 Bark 推送通知（车主手机端）
export async function sendBarkNotification(params: {
  bark_code: string;
  title: string;
  body: string;
  url?: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const encodedTitle = encodeURIComponent(params.title);
    const encodedBody = encodeURIComponent(params.body);
    const barkUrl = `https://api.day.app/${params.bark_code}/${encodedTitle}/${encodedBody}${
      params.url ? `?url=${encodeURIComponent(params.url)}` : ''
    }`;
    const res = await fetch(barkUrl);
    if (!res.ok) return { success: false, error: `Bark 响应: ${res.status}` };
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
