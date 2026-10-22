import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, QrCode, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';
import { encodeTgTarget } from '@/types/types';

export default function HomePage() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [error, setError] = useState('');
  // 加密后的链接码（URL 中不出现 token 明文）
  const [encCode, setEncCode] = useState('');

  const inputValid =
    !!token.trim() &&
    !!chatId.trim() &&
    /^\d+:[\w-]+$/.test(token.trim()) &&
    /^-?\d+$/.test(chatId.trim());

  // 输入合法时异步生成加密码
  useEffect(() => {
    if (!inputValid) { setEncCode(''); return; }
    let alive = true;
    encodeTgTarget(token.trim(), chatId.trim()).then((enc) => {
      if (alive) setEncCode(enc);
    });
    return () => { alive = false; };
  }, [token, chatId, inputValid]);

  const handleNotify = async () => {
    const t = token.trim();
    const c = chatId.trim();
    if (!t || !c) { setError('请输入 Bot Token 和 Chat ID'); return; }
    if (!/^\d+:[\w-]+$/.test(t)) { setError('Bot Token 格式不正确（形如 123456:ABC-xxx）'); return; }
    if (!/^-?\d+$/.test(c)) { setError('Chat ID 应为数字'); return; }
    setError('');
    const enc = await encodeTgTarget(t, c);
    navigate(`/notify/${encodeURIComponent(enc)}`);
  };

  // 二维码内容：被堵方扫码直达呼叫页（含加密码，不含 token 明文）
  const qrReady = !!encCode;
  const qrText = encCode
    ? `${window.location.origin}/notify/${encodeURIComponent(encCode)}`
    : '';

  // 下载二维码为 PNG
  const handleDownloadQr = async () => {
    if (!qrReady) return;
    try {
      const dataUrl = await import('qrcode').then((m) =>
        m.default.toDataURL(qrText, { width: 512, margin: 2 })
      );
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = '挪车专属二维码.png';
      a.click();
    } catch {
      toast.error('二维码生成失败，请重试');
    }
  };

  // 复制专属链接
  const handleCopyLink = async () => {
    if (!qrReady) return;
    try {
      await navigator.clipboard.writeText(qrText);
      toast.success('专属链接已复制');
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  const inputStyle = (hasError: boolean) => ({
    background: 'hsl(210 80% 95%)',
    borderColor: hasError ? 'hsl(0 84% 60%)' : 'hsl(210 70% 87%)',
  });

  return (
    <div className="page-bg-blue flex flex-col items-center justify-center px-4 py-10 min-h-dvh gap-5">
      {/* App 标识 */}
      <div className="flex flex-col items-center gap-2 animate-card-enter" style={{ animationDelay: '0ms' }}>
        <div
          className="w-24 h-24 rounded-[28px] flex items-center justify-center mb-1"
          style={{
            background: 'linear-gradient(135deg, #60B8FF 0%, #3B7FE0 100%)',
            boxShadow: '0 6px 24px rgba(43,127,255,0.4)',
          }}
        >
          <span className="text-5xl" role="img" aria-label="car">🚗</span>
        </div>
        <h1 className="text-3xl font-bold text-white drop-shadow">智能挪车</h1>
        <p className="text-white/75 text-sm">基于 Telegram 机器人，一键通知车主</p>
      </div>

      {/* 被堵车方入口 */}
      <div
        className="floating-card w-full max-w-sm p-6 animate-card-enter"
        style={{ animationDelay: '80ms' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'hsl(218 100% 58% / 0.12)' }}
          >
            <span className="text-xl">🔔</span>
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base">我被堵了</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              输入车主 TG 机器人信息，一键推送挪车通知
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Bot Token</p>
            <input
              type="text"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(''); }}
              placeholder="123456:ABC-xxxxxxxx"
              className="w-full px-4 py-3 rounded-xl border outline-none text-foreground text-sm font-mono"
              style={inputStyle(!!error)}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Chat ID</p>
            <input
              type="text"
              value={chatId}
              onChange={(e) => { setChatId(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleNotify()}
              placeholder="车主的数字 Chat ID"
              className="w-full px-4 py-3 rounded-xl border outline-none text-foreground text-sm font-mono"
              style={inputStyle(!!error)}
            />
          </div>
        </div>
        {error && <p className="text-xs mt-2" style={{ color: 'hsl(0 84% 55%)' }}>{error}</p>}

        <button
          onClick={handleNotify}
          className="btn-gradient-primary w-full py-3.5 rounded-2xl text-base font-bold flex items-center justify-center gap-2 mt-4"
          type="button"
        >
          呼叫车主挪车
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 专属挪车二维码卡片 */}
      <div
        className="floating-card w-full max-w-sm p-6 animate-card-enter"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'hsl(218 100% 58% / 0.12)' }}
          >
            <QrCode className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base">专属挪车二维码</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              填入上方信息后生成，扫码直达呼叫页，可保存分享
            </p>
          </div>
        </div>

        {/* 二维码展示区 */}
        <div
          className="flex items-center justify-center rounded-2xl py-5 mb-4"
          style={{ background: 'hsl(210 80% 95%)' }}
        >
          {qrReady ? (
            <QRCodeDataUrl text={qrText} width={180} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <QrCode className="w-12 h-12 opacity-30" />
              <p className="text-xs">请先在上方填入 Bot Token 和 Chat ID</p>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleDownloadQr}
            disabled={!qrReady}
            className="btn-gradient-primary flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            type="button"
          >
            <Download className="w-4 h-4" />
            保存图片
          </button>
          <button
            onClick={handleCopyLink}
            disabled={!qrReady}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: 'hsl(210 70% 92%)',
              color: 'hsl(218 100% 45%)',
              border: '1px solid hsl(210 70% 85%)',
            }}
            type="button"
          >
            <Copy className="w-4 h-4" />
            复制链接
          </button>
        </div>
      </div>

      {/* 使用说明 */}
      <div
        className="floating-card w-full max-w-sm p-4 animate-card-enter"
        style={{ animationDelay: '160ms' }}
      >
        <p className="text-xs font-semibold text-foreground mb-2">使用说明</p>
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
          <li>车主创建 TG 机器人（@BotFather），获取 Bot Token</li>
          <li>车主向机器人发送任意消息，通过 @userinfobot 获取 Chat ID</li>
          <li>被堵方输入 Token 和 Chat ID，点击呼叫发送 TG 通知</li>
          <li>车主在 TG 点击"正在前往"按钮或回复消息，被堵方实时收到确认</li>
        </ol>
      </div>

      <p className="text-white/50 text-xs text-center max-w-xs animate-card-enter" style={{ animationDelay: '220ms' }}>
        无需注册与数据库，消息全程通过 TG 机器人收发
      </p>
    </div>
  );
}
