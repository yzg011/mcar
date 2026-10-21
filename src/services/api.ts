import type { TgRoomStatus } from '@/types/types';

// Telegram Bot API 反代地址（无 Supabase，浏览器直连）
const TG_PROXY_BASE = 'https://tg.z2m.store';

// 调用 Telegram Bot API（通过自建反代）
async function tg(token: string, method: string, params?: Record<string, unknown>) {
  const res = await fetch(`${TG_PROXY_BASE}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.description ?? `TG 响应 ${res.status}`);
  }
  return data;
}

// 发送挪车通知到车主 TG（带确认按钮 + 详情链接）
export async function sendTgNotification(params: {
  token: string;
  chatId: string;
  code: string;
  text: string;
  ownerUrl: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    await tg(params.token, 'sendMessage', {
      chat_id: params.chatId,
      text: params.text,
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚗 我已知晓，正在前往', callback_data: 'confirm' }],
          [{ text: '📋 查看详情与导航', url: params.ownerUrl }],
        ],
      },
    });
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// 轮询车主确认状态（按钮确认 / 直接回复消息）
export async function checkTgStatus(params: {
  token: string;
  chatId: string;
  code: string;
}): Promise<{ data: TgRoomStatus | null; error: string | null }> {
  try {
    const res = await tg(params.token, 'getUpdates', { limit: 100, timeout: 0 });
    const updates = (res?.result ?? []) as Array<{
      callback_query?: { data: string; message?: { chat?: { id: number } } };
      message?: { chat?: { id: number }; text?: string };
    }>;

    let confirmed = false;
    let ownerMessage: string | null = null;

    for (const u of updates) {
      // 按钮确认（chat 维度区分）
      if (u.callback_query?.data === 'confirm') {
        const cbChat = String(u.callback_query.message?.chat?.id ?? '');
        if (cbChat === String(params.chatId)) confirmed = true;
      }
      // 车主直接回复消息 = 确认 + 留言
      if (u.message?.text && String(u.message.chat?.id ?? '') === String(params.chatId)) {
        confirmed = true;
        ownerMessage = u.message.text;
      }
    }
    return { data: { confirmed, ownerMessage }, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

// 网页确认：向车主 TG 发送引导消息，点击按钮后通知等待方
export async function webConfirmTg(params: {
  token: string;
  chatId: string;
  code: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    await tg(params.token, 'sendMessage', {
      chat_id: params.chatId,
      text: '您已在网页上确认出发，点击下方按钮将通知发送给等待方 👇',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚗 确认通知对方', callback_data: 'confirm' }],
        ],
      },
    });
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}
