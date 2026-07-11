import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // 处理 CORS 预检请求，标准204返回
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { notifyUrl } = await req.json() as { notifyUrl: string };

    if (!notifyUrl) {
      return Response.json(
        { success: false, error: '缺少 notifyUrl 参数' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 代理推送请求
    const res = await fetch(notifyUrl);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return Response.json(
        { success: false, error: `推送响应 ${res.status}: ${body}` },
        { headers: corsHeaders }
      );
    }

    return Response.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (e) {
    return Response.json(
      { success: false, error: String(e) },
      { headers: corsHeaders }
    );
  }
});
