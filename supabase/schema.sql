-- ============================================================
-- SECTION: SCHEMA
-- ============================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS "public";


--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


--
-- Name: EXTENSION "pg_graphql"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "pg_graphql" IS 'pg_graphql: GraphQL support';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: move_car_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."move_car_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_code" "text" NOT NULL,
    "message" "text" DEFAULT ''::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "location_lat" double precision,
    "location_lng" double precision,
    "location_name" "text" DEFAULT ''::"text",
    "status" "text" DEFAULT 'waiting'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "owner_message" "text" DEFAULT ''::"text",
    CONSTRAINT "move_car_rooms_status_check" CHECK (("status" = ANY (ARRAY['waiting'::"text", 'owner_acknowledged'::"text", 'completed'::"text"])))
);


--
-- Name: move_car_rooms move_car_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'move_car_rooms_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'move_car_rooms'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."move_car_rooms"
    ADD CONSTRAINT "move_car_rooms_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: move_car_rooms move_car_rooms_room_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'move_car_rooms_room_code_key'
      AND n.nspname = 'public'
      AND c.relname = 'move_car_rooms'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."move_car_rooms"
    ADD CONSTRAINT "move_car_rooms_room_code_key" UNIQUE ("room_code");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: move_car_rooms move_car_rooms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "move_car_rooms_updated_at" BEFORE UPDATE ON "public"."move_car_rooms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();


--
-- Name: move_car_rooms anon_insert_rooms; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'anon_insert_rooms'
      AND n.nspname = 'public'
      AND c.relname = 'move_car_rooms'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "anon_insert_rooms" ON "public"."move_car_rooms" FOR INSERT TO "anon" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: move_car_rooms anon_select_rooms; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'anon_select_rooms'
      AND n.nspname = 'public'
      AND c.relname = 'move_car_rooms'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "anon_select_rooms" ON "public"."move_car_rooms" FOR SELECT TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: move_car_rooms anon_update_rooms; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'anon_update_rooms'
      AND n.nspname = 'public'
      AND c.relname = 'move_car_rooms'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "anon_update_rooms" ON "public"."move_car_rooms" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: move_car_rooms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."move_car_rooms" ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




-- ============================================================
-- SECTION: DIFF FILTER OBJECTS
-- ============================================================
-- Objects that match diff-filter.json but cannot be represented
-- precisely by pg_dump --filter.

-- publication table: supabase_realtime -> public.move_car_rooms
DO $pg_schema_restore$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') AND NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    WHERE p.pubname = 'supabase_realtime'
      AND pr.prrelid = to_regclass('public.move_car_rooms')
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.move_car_rooms;';
  END IF;
END
$pg_schema_restore$;

-- ============================================================
-- SECTION: STORAGE BUCKETS DATA
-- ============================================================

