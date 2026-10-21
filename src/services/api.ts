import { supabase } from '@/db/supabase';
import type { TgRoomStatus } from '@/types/types';

<<<<<<< HEAD
// 统一调用 TG Bot 中继 Edge Function
async function invokeRelay(body: Record<string, unknown>): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', { body });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error ?? '请求失败' };
=======
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

// 发送推送通知（通过 Edge Function 服务端代理，避免 CORS）
// - customBaseUrl 存在：直接用该 URL 作为 base，拼接 title/body（兼容任意推送服务）
// - customBaseUrl 不存在：使用标准 Bark API
export async function sendBarkNotification(params: {
  bark_code: string;
  title: string;
  body: string;
  url?: string;
  customBaseUrl?: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const encodedTitle = encodeURIComponent(params.title);
    const encodedBody = encodeURIComponent(params.body);
    const urlParam = params.url ? `?url=${encodeURIComponent(params.url)}` : '';

    let notifyUrl: string;
    if (params.customBaseUrl) {
      const base = params.customBaseUrl.replace(/\/+$/, '');
      notifyUrl = `${base}/${encodedTitle}/${encodedBody}${urlParam}`;
    } else {
      notifyUrl = `https://api.day.app/${params.bark_code}/${encodedTitle}/${encodedBody}${urlParam}`;
    }

    // 通过 Edge Function 代理请求，规避第三方服务的 CORS 限制
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: { notifyUrl },
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error ?? '推送失败' };
>>>>>>> a682c5cb3cd6f789e8c557e08572281402e0f675
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// 发送挪车通知到车主 TG（带确认按钮 + 详情链接）
export async function sendTgNotification(params: {
  token: string;
  chatId: string;
  code: string;
  text: string;
  ownerUrl: string;
}): Promise<{ success: boolean; error: string | null }> {
  return invokeRelay({
    action: 'send',
    token: params.token,
    chatId: params.chatId,
    code: params.code,
    text: params.text,
    ownerUrl: params.ownerUrl,
  });
}

// 轮询车主确认状态（按钮确认 / 直接回复消息）
export async function checkTgStatus(params: {
  token: string;
  chatId: string;
  code: string;
}): Promise<{ data: TgRoomStatus | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        action: 'check',
        token: params.token,
        chatId: params.chatId,
        code: params.code,
      },
    });
    if (error) return { data: null, error: error.message };
    if (!data?.success) return { data: null, error: data?.error ?? '查询失败' };
    return {
      data: { confirmed: !!data.confirmed, ownerMessage: data.ownerMessage ?? null },
      error: null,
    };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}

// 网页确认：向车主 TG 发送引导消息，点击按钮后通知等待方
export async function webConfirmTg(params: {
  token: string;
  chatId: string;
  code: string;
}): Promise<{ success: boolean; error: string | null }> {
  return invokeRelay({
    action: 'webconfirm',
    token: params.token,
    chatId: params.chatId,
    code: params.code,
  });
}
