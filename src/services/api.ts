import type { TgRoomStatus } from '@/types/types';

// Telegram Bot API 反代地址（无 Supabase，浏览器直连）
const TG_PROXY_BASE = 'https://tg.z2m.store';

// 车主快捷回复按钮（callback_data 短标识，UTF-8 不超 64 字节）
const QUICK_BUTTONS: Array<{ text: string; data: string }> = [
  { text: '🚗 正在前往', data: 'confirm:马上到' },
  { text: '⏱ 等我5分钟', data: 'confirm:等我5分钟' },
  { text: '✅ 已挪好', data: 'confirm:已挪好' },
];

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

type TgUpdate = {
  update_id: number;
  callback_query?: { data: string; message?: { chat?: { id: number } } };
  message?: { chat?: { id: number }; text?: string };
};

// 获取当前 updates 基线（最大 update_id），发送通知后只统计此后的新消息
export async function getTgBaseline(token: string): Promise<number> {
  const res = await tg(token, 'getUpdates', { limit: 100, timeout: 0 });
  const updates = (res?.result ?? []) as TgUpdate[];
  return updates.reduce((max, u) => Math.max(max, u.update_id), 0);
}

// 发送挪车通知到车主 TG（带快捷回复按钮 + 详情链接）
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
          QUICK_BUTTONS.slice(0, 2).map((b) => ({ text: b.text, callback_data: b.data })),
          [{ ...QUICK_BUTTONS[2] }],
          [{ text: '📋 查看详情与导航', url: params.ownerUrl }],
        ],
      },
    });
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// 轮询车主确认状态：仅统计基线之后的新 updates，且只有点击按钮才算"已确认"；
// 直接回复文字只作为车主留言展示，不改变确认状态
export async function checkTgStatus(params: {
  token: string;
  chatId: string;
  code: string;
  baseline: number;
}): Promise<{ data: TgRoomStatus | null; error: string | null }> {
  try {
    const res = await tg(params.token, 'getUpdates', { limit: 100, timeout: 0 });
    const updates = ((res?.result ?? []) as TgUpdate[])
      .filter((u) => u.update_id > params.baseline);

    let confirmed = false;
    let ownerMessage: string | null = null;

    for (const u of updates) {
      // 按钮点击 = 确认（马上到/等我5分钟/已挪好），快捷语作为留言
      const cb = u.callback_query;
      if (cb?.data?.startsWith('confirm')) {
        const cbChat = String(cb.message?.chat?.id ?? '');
        if (cbChat === String(params.chatId)) {
          confirmed = true;
          const quick = cb.data.slice('confirm:'.length);
          if (quick) ownerMessage = quick;
        }
      }
      // 直接回复文字 = 仅留言展示
      if (u.message?.text && String(u.message.chat?.id ?? '') === String(params.chatId)) {
        ownerMessage = u.message.text;
      }
    }
    return { data: { confirmed, ownerMessage }, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

// 网页确认：向车主 TG 发送引导消息，车主点击快捷按钮后通知等待方
export async function webConfirmTg(params: {
  token: string;
  chatId: string;
  code: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    await tg(params.token, 'sendMessage', {
      chat_id: params.chatId,
      text: '您已在网页上确认出发，请点击下方按钮回复对方 👇',
      reply_markup: {
        inline_keyboard: [
          QUICK_BUTTONS.slice(0, 2).map((b) => ({ text: b.text, callback_data: b.data })),
          [{ ...QUICK_BUTTONS[2] }],
        ],
      },
    });
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}
