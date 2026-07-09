## Vibe
- iOS App Card UI × Gradient Sky — 参考图驱动，忠实还原蓝/紫渐变背景+白色圆角卡片风格

## Color
- Primary: #2B7FFF
- On Primary: #FFFFFF
- Accent: #18C16E
- On Accent: #FFFFFF
- Background: #87C9F7
- Foreground: #1A1A2E
- Muted: #EBF4FF
- Border: #D4E8FF
- Secondary: #7C6FCD

## Typography
- Heading: PingFang SC (family: "PingFang SC", "SF Pro Display", -apple-system, sans-serif, weight: 700)
- Body: PingFang SC (family: "PingFang SC", "SF Pro Text", -apple-system, sans-serif, weight: 400)

## Visual Language
- 核心视觉签名：全屏渐变背景（天蓝→蔚蓝 / 淡紫→紫蓝）叠加白色大圆角浮层卡片，制造"漂浮在空中的岛屿"层次感
- 材质与深度：卡片白底 + `box-shadow: 0 8px 32px rgba(0,0,0,0.10)`；背景无额外纹理，渐变柔和；快捷标签背景使用 Primary 的极淡色版（10% opacity）
- 容器与按钮：卡片 border-radius 20px，标签 border-radius 999px（胶囊型），主行动按钮全宽圆角渐变蓝，确认按钮全宽圆角渐变绿；按钮内带 emoji/icon 增强识别
- 布局节奏：移动端单列居中，内容卡片之间垂直间距16px，底部固定行动按钮

## Animation
- 入场：页面卡片 fade-in + translateY(20px→0)，200ms ease-out
- 交互：标签点击 scale(0.95) 100ms；按钮点击 opacity 0.85

## Forbidden
- 禁止纯白色页面背景（必须保留蓝/紫渐变背景）
- 禁止无圆角的矩形卡片或按钮
- 禁止在按钮上使用 outline 变体（应使用渐变填充）
