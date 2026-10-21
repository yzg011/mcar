import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, CheckCircle2, Loader2, ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { checkTgStatus, webConfirmTg } from '@/services/api';
import { parseTgCode } from '@/types/types';

// 轮询间隔（毫秒）
const POLL_INTERVAL = 3000;

export default function OwnerPage() {
  const { barkCode } = useParams<{ barkCode: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const code = barkCode ? decodeURIComponent(barkCode) : '';
  const target = barkCode ? parseTgCode(code) : null;

  // 详情来自通知链接的 query 参数
  const msg = searchParams.get('msg') ?? '';
  const tags = (searchParams.get('tags') ?? '').split(',').filter(Boolean);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const hasLocation = !!lat && !!lng;

  const [confirmed, setConfirmed] = useState(false);
  const [ownerMessage, setOwnerMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 轮询确认状态（TG getUpdates 派生）
  useEffect(() => {
    if (!target) return;
    const poll = async () => {
      const { data } = await checkTgStatus({
        token: target.token,
        chatId: target.chatId,
        code,
      });
      if (data) {
        setConfirmed(data.confirmed);
        setOwnerMessage(data.ownerMessage);
      }
    };
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [target, code]);

  // 网页确认：向车主 TG 发送引导消息，点击按钮后通知等待方
  const handleConfirm = async () => {
    if (!target || confirming || confirmed) return;
    setConfirming(true);
    const { success, error } = await webConfirmTg({
      token: target.token,
      chatId: target.chatId,
      code,
    });
    setConfirming(false);
    if (!success) { toast.error(`发送失败：${error}`); return; }
    toast.success('确认消息已发送到您的 Telegram，请点击其中的按钮通知等待方');
  };

  const openGaode = () => {
    if (!lat || !lng) { toast.error('位置信息不可用'); return; }
    window.open(
      `https://uri.amap.com/navigation?to=${lng},${lat},挪车位置&mode=car&src=myapp`,
      '_blank'
    );
  };

  const openAppleMaps = () => {
    if (!lat || !lng) { toast.error('位置信息不可用'); return; }
    window.open(`http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`, '_blank');
  };

  if (!target) {
    return (
      <div className="page-bg-purple flex flex-col items-center justify-center px-4 min-h-dvh gap-4">
        <div className="floating-card w-full max-w-sm p-8 flex flex-col items-center gap-3 animate-card-enter">
          <span className="text-5xl">🔍</span>
          <h2 className="text-xl font-bold text-foreground">链接无效</h2>
          <p className="text-sm text-muted-foreground text-center">通知链接格式不正确</p>
          <button
            onClick={() => navigate('/')}
            className="btn-gradient-primary w-full py-3 rounded-2xl text-base font-bold mt-2"
            type="button"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg-purple flex flex-col items-center justify-start px-4 py-8 min-h-dvh">
      {/* 顶部 */}
      <div className="w-full max-w-sm flex items-center gap-2 mb-5">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white transition-colors"
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white/60 text-xs">车主确认页</p>
          <p className="text-white font-mono font-semibold text-sm truncate">Chat ID: {target.chatId}</p>
        </div>
      </div>

      {/* 主请求卡片 */}
      <div
        className="floating-card w-full max-w-sm p-6 flex flex-col items-center gap-4 animate-card-enter mb-4"
        style={{ animationDelay: '0ms' }}
      >
        <span className="text-6xl animate-wave" role="img" aria-label="wave">👋</span>

        {confirmed ? (
          <>
            <CheckCircle2 className="w-10 h-10" style={{ color: '#18C16E' }} />
            <h1 className="text-xl font-bold text-foreground text-center">您已确认出发</h1>
            <p className="text-sm text-muted-foreground text-center">感谢您的配合，请尽快前往挪车</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground text-center">您有一条挪车请求</h1>
            <p className="text-sm text-muted-foreground text-center">请查看留言并尽快确认</p>
          </>
        )}

        {/* 被堵方留言 & 标签展示 */}
        {(msg || tags.length > 0) && (
          <div
            className="w-full rounded-xl p-3"
            style={{ background: 'hsl(210 80% 95%)' }}
          >
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: 'hsl(218 100% 58% / 0.12)',
                      color: '#2B7FFF',
                      border: '1px solid hsl(218 100% 58% / 0.3)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {msg && <p className="text-sm text-foreground">{msg}</p>}
          </div>
        )}

        {/* 车主留言回显 */}
        {ownerMessage && (
          <div
            className="w-full rounded-xl px-4 py-3 flex items-start gap-2"
            style={{ background: 'hsl(148 60% 93%)' }}
          >
            <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#18C16E' }} />
            <p className="text-sm text-foreground">{ownerMessage}</p>
          </div>
        )}
      </div>



      {/* 留言提示卡片 */}
      {!confirmed && (
        <div
          className="floating-card w-full max-w-sm p-5 animate-card-enter mb-4"
          style={{ animationDelay: '150ms' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">回复留言</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            直接在 Telegram 中回复通知消息，留言内容将实时显示给等待方；回复任意消息即视为确认出发。
          </p>
        </div>
      )}


      {/* 导航卡片 */}
      {hasLocation && (
        <div
          className="floating-card w-full max-w-sm p-5 animate-card-enter mb-4"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">导航到对方位置</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openGaode}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: '#3B9EFF', color: '#fff' }}
              type="button"
            >
              <span className="text-base">🗺</span>
              高德地图
            </button>
            <button
              onClick={openAppleMaps}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: '#1C1C1E', color: '#fff' }}
              type="button"
            >
              <span className="text-base">🍎</span>
              Apple Maps
            </button>
          </div>
        </div>
      )}


      {/* 确认按钮 */}
      <div
        className="w-full max-w-sm animate-card-enter"
        style={{ animationDelay: '200ms' }}
      >
        <button
          onClick={handleConfirm}
          disabled={confirming || confirmed}
          className="btn-gradient-success w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          type="button"
        >
          {confirming ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : confirmed ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {confirming ? '发送中…' : confirmed ? '已确认出发' : '我已知晓，正在前往'}
        </button>
      </div>

      <p className="text-white/50 text-xs text-center max-w-xs mt-4">
        点击后确认消息将发送到您的 Telegram，点击其中按钮即可通知等待方
      </p>
    </div>
  );
}


