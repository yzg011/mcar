import { supabase } from '@/db/supabase';
import type { TgRoomStatus } from '@/types/types';

// 统一调用 TG Bot 中继 Edge Function
async function invokeRelay(body: Record<string, unknown>): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', { body });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error ?? '请求失败' };
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
