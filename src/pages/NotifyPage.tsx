import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Bell, Loader2, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { upsertRoom, getRoomByCode, sendBarkNotification } from '@/services/api';
import type { MoveCarRoom, LocationInfo, QuickTag } from '@/types/types';

const QUICK_TAGS: QuickTag[] = [
  { label: '挡路', emoji: '🚧', value: '挡路' },
  { label: '临停', emoji: '⏱', value: '临停' },
  { label: '没接', emoji: '📵', value: '没接' },
  { label: '加急', emoji: '🙏', value: '加急' },
];

export default function NotifyPage() {
  const { barkCode } = useParams<{ barkCode: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<MoveCarRoom | null>(null);
  const [message, setMessage] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 获取定位
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationStatus('error'); return; }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('success');
      },
      () => setLocationStatus('error'),
      { timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => { getLocation(); }, [getLocation]);

  // 加载当前请求状态（用于展示车主已确认的反馈）
  useEffect(() => {
    if (!barkCode) return;
    getRoomByCode(barkCode).then(({ data }) => setRoom(data));
  }, [barkCode]);

  // Realtime 监听车主确认
  useEffect(() => {
    if (!barkCode) return;
    const channel = supabase
      .channel(`notify-${barkCode}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'move_car_rooms',
        filter: `room_code=eq.${barkCode}`,
      }, (payload) => {
        const updated = payload.new as MoveCarRoom;
        setRoom(updated);
        if (updated.status === 'owner_acknowledged') {
          toast.success('🎉 车主已确认，正在前往挪车！');
        }
      })
      .subscribe();
    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [barkCode]);

  const toggleTag = (value: string) => {
    setSelectedTags((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleSend = async () => {
    if (!barkCode || sending) return;
    setSending(true);
    try {
      // 1. 写入 / 刷新 DB 记录
      const { data, error } = await upsertRoom({
        bark_code: barkCode,
        message,
        tags: selectedTags,
        location_lat: location?.lat ?? null,
        location_lng: location?.lng ?? null,
        location_name: location?.name ?? '',
      });
      if (error || !data) { toast.error('写入失败，请重试'); return; }
      setRoom(data);

      // 2. 调用 Bark 完整接口，URL 指向车主确认页 /owner/:barkCode
      const tagStr = selectedTags.length > 0 ? `[${selectedTags.join('/')}] ` : '';
      const bodyText = message
        ? `${tagStr}${message}`
        : `${tagStr}有人请您挪车，请点击查看并确认`;
      const ownerUrl = `${window.location.origin}/owner/${barkCode}`;

      const { success, error: barkError } = await sendBarkNotification({
        bark_code: barkCode,
        title: '🚗 挪车请求',
        body: bodyText,
        url: ownerUrl,
      });

      if (success) {
        toast.success('Bark 通知已推送到车主手机！');
      } else {
        toast.warning(`已记录请求，但 Bark 推送失败：${barkError}`);
      }
    } finally {
      setSending(false);
    }
  };

  const isAcknowledged = room?.status === 'owner_acknowledged';

  return (
    <div className="page-bg-blue flex flex-col items-center justify-start px-4 py-8 min-h-dvh">
      {/* 顶部导航栏 */}
      <div className="w-full max-w-sm flex items-center gap-2 mb-5">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white transition-colors"
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white/60 text-xs">Bark 接口码</p>
          <p className="text-white font-mono font-semibold text-sm truncate">{barkCode}</p>
        </div>
        {room && (
          <div className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-white/60" />
            <span className="text-white/60 text-xs">实时</span>
          </div>
        )}
      </div>

      {/* 图标 + 标题卡片 */}
      <div
        className="floating-card w-full max-w-sm p-6 flex flex-col items-center gap-2 animate-card-enter mb-4"
        style={{ animationDelay: '0ms' }}
      >
        <div
          className="w-16 h-16 rounded-[18px] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #60B8FF 0%, #3B7FE0 100%)',
            boxShadow: '0 4px 16px rgba(43,127,255,0.30)',
          }}
        >
          <span className="text-3xl">🚗</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">呼叫车主挪车</h1>
        <p className="text-xs text-muted-foreground">通知将通过 Bark 推送到车主手机</p>
      </div>

      {/* 车主已确认状态横幅（在标题卡下方、留言卡上方） */}
      {isAcknowledged && (
        <div
          className="floating-card w-full max-w-sm px-4 py-3 flex flex-col gap-2 animate-card-enter mb-4"
          style={{ border: '2px solid #18C16E' }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0" style={{ color: '#18C16E' }} />
            <div>
              <p className="font-bold text-sm text-foreground">车主已确认出发</p>
              <p className="text-xs text-muted-foreground">请耐心等候，车主正在前往</p>
            </div>
          </div>
          {/* 车主回复留言 */}
          {room?.owner_message && (
            <div
              className="flex items-start gap-2 rounded-xl px-3 py-2 mt-1"
              style={{ background: 'hsl(148 60% 93%)' }}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#18C16E' }} />
              <p className="text-xs text-foreground">{room.owner_message}</p>
            </div>
          )}
        </div>
      )}

      {/* 留言 + 标签卡片 */}
      <div
        className="floating-card w-full max-w-sm p-5 animate-card-enter mb-4"
        style={{ animationDelay: '80ms' }}
      >
        <p className="text-xs font-semibold text-muted-foreground mb-2">留言给车主（可选）</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入留言内容，将附在通知正文里…"
          className="w-full resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm min-h-[72px]"
          maxLength={200}
        />
        <div className="flex gap-2 mt-3">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag.value}
              onClick={() => toggleTag(tag.value)}
              className={`tag-pill${selectedTags.includes(tag.value) ? ' selected' : ''}`}
              type="button"
            >
              <span>{tag.emoji}</span>
              <span>{tag.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 定位卡片 */}
      <div
        className="floating-card w-full max-w-sm p-4 animate-card-enter mb-6"
        style={{ animationDelay: '140ms' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'hsl(148 76% 92%)' }}
          >
            {locationStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
            {locationStatus === 'success' && <MapPin className="w-4 h-4 text-accent animate-pulse-dot" />}
            {locationStatus === 'error' && <AlertCircle className="w-4 h-4 text-destructive" />}
            {locationStatus === 'idle' && <MapPin className="w-4 h-4 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">我的位置</p>
            {locationStatus === 'loading' && <p className="text-xs text-muted-foreground mt-0.5">正在获取位置…</p>}
            {locationStatus === 'success' && (
              <p className="text-xs mt-0.5" style={{ color: '#18C16E' }}>位置已获取，随通知一并发送</p>
            )}
            {locationStatus === 'error' && (
              <button onClick={getLocation} className="text-xs text-primary mt-0.5 underline" type="button">
                获取失败，点击重试
              </button>
            )}
            {locationStatus === 'idle' && <p className="text-xs text-muted-foreground mt-0.5">等待定位…</p>}
          </div>
        </div>
      </div>

      {/* 发送按钮 */}
      <div className="w-full max-w-sm animate-card-enter" style={{ animationDelay: '200ms' }}>
        <button
          onClick={handleSend}
          disabled={sending}
          className="btn-gradient-primary w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          type="button"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
          {sending ? '发送中…' : '一键通知车主'}
        </button>
      </div>

      <p className="text-white/50 text-xs text-center max-w-xs mt-4">
        点击后将调用 Bark 接口向车主手机推送通知，车主点击通知即可跳转确认页
      </p>
    </div>
  );
}
