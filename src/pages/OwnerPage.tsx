import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle2, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { getRoomByCode, updateRoomStatus } from '@/services/api';
import type { MoveCarRoom } from '@/types/types';

const OWNER_QUICK_REPLIES = [
  { label: '马上到', emoji: '🏃' },
  { label: '5分钟', emoji: '⏱' },
  { label: '稍等', emoji: '🙏' },
  { label: '已挪好', emoji: '✅' },
];

export default function OwnerPage() {
  const { barkCode: rawBarkCode } = useParams<{ barkCode: string }>();
  const barkCode = rawBarkCode ? decodeURIComponent(rawBarkCode) : '';
  const navigate = useNavigate();

  const [room, setRoom] = useState<MoveCarRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [ownerMessage, setOwnerMessage] = useState('');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 加载房间
  useEffect(() => {
    if (!barkCode) return;
    (async () => {
      const { data } = await getRoomByCode(barkCode);
      if (!data) setNotFound(true);
      else setRoom(data);
      setLoading(false);
    })();
  }, [barkCode]);

  // Realtime 订阅
  useEffect(() => {
    if (!barkCode) return;
    const channel = supabase
      .channel(`owner-${barkCode}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'move_car_rooms',
        filter: `room_code=eq.${barkCode}`,
      }, (payload) => {
        setRoom(payload.new as MoveCarRoom);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [barkCode]);

  const appendQuickReply = (label: string) => {
    setOwnerMessage((prev) =>
      prev ? `${prev} ${label}` : label
    );
  };

  const handleConfirm = async () => {
    if (!barkCode || confirming || room?.status === 'owner_acknowledged') return;
    setConfirming(true);
    const { error } = await updateRoomStatus(barkCode, 'owner_acknowledged', ownerMessage.trim());
    if (error) {
      toast.error('确认失败，请重试');
      setConfirming(false);
      return;
    }
    setConfirming(false);
    toast.success('已通知对方，请尽快前往挪车');
  };

  const openGaode = () => {
    if (!room?.location_lat || !room?.location_lng) { toast.error('对方位置不可用'); return; }
    window.open(
      `https://uri.amap.com/navigation?to=${room.location_lng},${room.location_lat},挪车位置&mode=car&src=myapp`,
      '_blank'
    );
  };

  const openAppleMaps = () => {
    if (!room?.location_lat || !room?.location_lng) { toast.error('对方位置不可用'); return; }
    window.open(
      `http://maps.apple.com/?daddr=${room.location_lat},${room.location_lng}&dirflg=d`,
      '_blank'
    );
  };

  if (loading) {
    return (
      <div className="page-bg-purple flex items-center justify-center min-h-dvh">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="page-bg-purple flex flex-col items-center justify-center px-4 min-h-dvh gap-4">
        <div className="floating-card w-full max-w-sm p-8 flex flex-col items-center gap-3 animate-card-enter">
          <span className="text-5xl">🔍</span>
          <h2 className="text-xl font-bold text-foreground">未找到挪车请求</h2>
          <p className="text-sm text-muted-foreground text-center">
            链接可能已过期，或请求尚未发出
          </p>
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

  const isAcknowledged = room?.status === 'owner_acknowledged';
  const hasLocation = room?.location_lat && room?.location_lng;

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
          <p className="text-white font-mono font-semibold text-sm truncate">{barkCode}</p>
        </div>
      </div>

      {/* 主请求卡片 */}
      <div
        className="floating-card w-full max-w-sm p-6 flex flex-col items-center gap-4 animate-card-enter mb-4"
        style={{ animationDelay: '0ms' }}
      >
        <span className="text-6xl animate-wave" role="img" aria-label="wave">👋</span>

        {isAcknowledged ? (
          <>
            <CheckCircle2 className="w-10 h-10" style={{ color: '#18C16E' }} />
            <h1 className="text-xl font-bold text-foreground text-center">您已确认出发</h1>
            <p className="text-sm text-muted-foreground text-center">感谢您的配合，请尽快前往挪车</p>
            {room?.owner_message && (
              <div
                className="w-full rounded-xl px-4 py-3 flex items-start gap-2"
                style={{ background: 'hsl(148 60% 93%)' }}
              >
                <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#18C16E' }} />
                <p className="text-sm text-foreground">{room.owner_message}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground text-center">您有一条挪车请求</h1>
            <p className="text-sm text-muted-foreground text-center">请查看留言并尽快确认</p>
          </>
        )}

        {/* 被堵方留言 & 标签展示 */}
        {(room?.message || (room?.tags && room.tags.length > 0)) && (
          <div
            className="w-full rounded-xl p-3"
            style={{ background: 'hsl(210 80% 95%)' }}
          >
            {room?.tags && room.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {room.tags.map((tag) => (
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
            {room?.message && <p className="text-sm text-foreground">{room.message}</p>}
          </div>
        )}
      </div>

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

      {/* 车主回复留言卡片（未确认时显示） */}
      {!isAcknowledged && (
        <div
          className="floating-card w-full max-w-sm p-5 animate-card-enter mb-4"
          style={{ animationDelay: '150ms' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">回复留言（可选）</p>
          </div>

          {/* 快捷回复标签 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {OWNER_QUICK_REPLIES.map((reply) => (
              <button
                key={reply.label}
                onClick={() => appendQuickReply(reply.label)}
                className="tag-pill"
                type="button"
              >
                <span>{reply.emoji}</span>
                <span>{reply.label}</span>
              </button>
            ))}
          </div>

          <textarea
            value={ownerMessage}
            onChange={(e) => setOwnerMessage(e.target.value)}
            placeholder="输入给对方的留言，点击确认后一并发送…"
            className="w-full resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm min-h-[64px]"
            maxLength={200}
          />
        </div>
      )}

      {/* 确认按钮 */}
      <div
        className="w-full max-w-sm animate-card-enter"
        style={{ animationDelay: '200ms' }}
      >
        <button
          onClick={handleConfirm}
          disabled={confirming || isAcknowledged}
          className="btn-gradient-success w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          type="button"
        >
          {confirming ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isAcknowledged ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <span>🚀</span>
          )}
          {confirming ? '确认中…' : isAcknowledged ? '已确认出发' : '我已知晓，正在前往'}
        </button>
      </div>

      <p className="text-white/50 text-xs text-center max-w-xs mt-4">
        点击确认后，对方将实时收到您的出发通知
      </p>
    </div>
  );
}
