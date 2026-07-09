// 挪车房间类型
export interface MoveCarRoom {
  id: string;
  room_code: string;
  message: string;
  tags: string[];
  location_lat: number | null;
  location_lng: number | null;
  location_name: string;
  status: 'waiting' | 'owner_acknowledged' | 'completed';
  owner_message: string;   // 车主回复留言（可选）
  created_at: string;
  updated_at: string;
}

// 位置信息
export interface LocationInfo {
  lat: number;
  lng: number;
  name?: string;
}

// 快捷标签定义
export interface QuickTag {
  label: string;
  emoji: string;
  value: string;
}
