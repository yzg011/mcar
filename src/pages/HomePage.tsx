import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [barkCode, setBarkCode] = useState('');
  const [error, setError] = useState('');

  const handleNotify = () => {
    const code = barkCode.trim();
    if (!code) { setError('请输入 Bark 接口码'); return; }
    setError('');
    // encodeURIComponent 确保完整 URL（含斜杠）也能安全放入路由参数
    navigate(`/notify/${encodeURIComponent(code)}`);
  };

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
        <p className="text-white/75 text-sm">基于 Bark 实时推送，一键通知车主</p>
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
              输入车主 Bark 码，一键推送挪车通知
            </p>
          </div>
        </div>

        <input
          type="text"
          value={barkCode}
          onChange={(e) => { setBarkCode(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleNotify()}
          placeholder="接口码 或 自建服务器完整 URL"
          className="w-full px-4 py-3 rounded-xl border outline-none text-foreground text-base font-mono"
          style={{
            background: 'hsl(210 80% 95%)',
            borderColor: error ? 'hsl(0 84% 60%)' : 'hsl(210 70% 87%)',
          }}
        />
        {error && <p className="text-xs mt-1.5" style={{ color: 'hsl(0 84% 55%)' }}>{error}</p>}

        <button
          onClick={handleNotify}
          className="btn-gradient-primary w-full py-3.5 rounded-2xl text-base font-bold flex items-center justify-center gap-2 mt-4"
          type="button"
        >
          呼叫车主挪车
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      {/* 使用说明 */}
      <div
        className="floating-card w-full max-w-sm p-4 animate-card-enter"
        style={{ animationDelay: '160ms' }}
      >
        <p className="text-xs font-semibold text-foreground mb-2">使用说明</p>
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
          <li>车主安装 Bark App，获取专属接口码并告知他人</li>
          <li>支持自建服务器：直接粘贴完整 URL（如 https://bk.example.com/xxxx/）</li>
          <li>被堵方输入接口码或 URL，点击呼叫发送推送通知</li>
          <li>车主手机收到通知后，点击链接进入确认页面</li>
          <li>车主点击"正在前往"，被堵方实时收到确认提醒</li>
        </ol>
      </div>
      <p className="text-white/50 text-xs text-center max-w-xs animate-card-enter" style={{ animationDelay: '220ms' }}>
        无需注册，Bark 码即身份，安全可靠
      </p>
    </div>
  );
}
