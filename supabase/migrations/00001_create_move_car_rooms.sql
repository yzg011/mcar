
-- 挪车请求房间表
create table if not exists move_car_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  message text default '',
  tags text[] default '{}',
  location_lat double precision,
  location_lng double precision,
  location_name text default '',
  status text not null default 'waiting'
    check (status in ('waiting', 'owner_acknowledged', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 更新时间触发器
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger move_car_rooms_updated_at
  before update on move_car_rooms
  for each row execute function update_updated_at();

-- 启用 RLS
alter table move_car_rooms enable row level security;

-- 匿名用户可插入新房间
create policy "anon_insert_rooms" on move_car_rooms
  for insert to anon
  with check (true);

-- 匿名用户可查询房间（通过 room_code）
create policy "anon_select_rooms" on move_car_rooms
  for select to anon
  using (true);

-- 匿名用户可更新房间状态（车主确认等）
create policy "anon_update_rooms" on move_car_rooms
  for update to anon
  using (true)
  with check (true);

-- 启用 Realtime
alter publication supabase_realtime add table move_car_rooms;
