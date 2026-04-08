--
-- PostgreSQL database dump
--

\restrict nUIC5vyyvScl2brqU7mdHaWXsuWeabdmIcZtBgmCQQiPi5pgka73pZQR1Yes12k

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attachments; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.attachments (
    id uuid NOT NULL,
    message_id uuid,
    file_name text NOT NULL,
    original_name text NOT NULL,
    file_path text NOT NULL,
    public_url text NOT NULL,
    content_type text,
    file_kind text DEFAULT 'file'::text NOT NULL,
    size_bytes bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.attachments OWNER TO signalum;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_user_id uuid,
    action text NOT NULL,
    target text NOT NULL,
    result text DEFAULT 'success'::text NOT NULL,
    meta_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO signalum;

--
-- Name: auth_sessions; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.auth_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token_hash text NOT NULL,
    user_agent text,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone
);


ALTER TABLE public.auth_sessions OWNER TO signalum;

--
-- Name: call_participants; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.call_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    call_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    left_at timestamp with time zone,
    is_muted boolean DEFAULT false NOT NULL,
    camera_enabled boolean DEFAULT false NOT NULL
);


ALTER TABLE public.call_participants OWNER TO signalum;

--
-- Name: calls; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.calls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chat_id uuid NOT NULL,
    call_kind text NOT NULL,
    started_by uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    status text DEFAULT 'active'::text NOT NULL,
    CONSTRAINT calls_call_kind_check CHECK ((call_kind = ANY (ARRAY['audio'::text, 'video'::text]))),
    CONSTRAINT calls_status_check CHECK ((status = ANY (ARRAY['active'::text, 'ended'::text, 'missed'::text])))
);


ALTER TABLE public.calls OWNER TO signalum;

--
-- Name: chat_members; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.chat_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chat_id uuid NOT NULL,
    user_id uuid NOT NULL,
    member_role text DEFAULT 'member'::text NOT NULL,
    muted_until timestamp with time zone,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_members_member_role_check CHECK ((member_role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text])))
);


ALTER TABLE public.chat_members OWNER TO signalum;

--
-- Name: chats; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.chats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    kind text NOT NULL,
    title text NOT NULL,
    description text,
    avatar_url text,
    created_by uuid,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chats_kind_check CHECK ((kind = ANY (ARRAY['direct'::text, 'group'::text, 'announcement'::text])))
);


ALTER TABLE public.chats OWNER TO signalum;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    leader_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lead_user_id integer,
    code text
);


ALTER TABLE public.departments OWNER TO signalum;

--
-- Name: invitations; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token text NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    invited_by uuid,
    organization_name text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    accepted_user_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    department_id uuid,
    invited_by_user_id uuid,
    token_hash text,
    note text,
    CONSTRAINT invitations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'revoked'::text, 'expired'::text])))
);


ALTER TABLE public.invitations OWNER TO signalum;

--
-- Name: meeting_events; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.meeting_events (
    id uuid NOT NULL,
    room_id uuid NOT NULL,
    actor_user_id uuid,
    event_type text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT meeting_events_event_type_check CHECK ((event_type = ANY (ARRAY['note'::text, 'decision'::text, 'action'::text, 'start'::text, 'finish'::text])))
);


ALTER TABLE public.meeting_events OWNER TO signalum;

--
-- Name: meeting_presence_logs; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.meeting_presence_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    actor_user_id uuid,
    event_type text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.meeting_presence_logs OWNER TO signalum;

--
-- Name: meetings; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.meetings (
    room_id uuid NOT NULL,
    status text DEFAULT 'planned'::text NOT NULL,
    title text,
    agenda text,
    summary text,
    host_user_id uuid,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT meetings_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'closed'::text])))
);


ALTER TABLE public.meetings OWNER TO signalum;

--
-- Name: message_attachments; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.message_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid,
    file_name text NOT NULL,
    mime_type text NOT NULL,
    file_size bigint NOT NULL,
    storage_key text NOT NULL,
    preview_key text
);


ALTER TABLE public.message_attachments OWNER TO signalum;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chat_id uuid NOT NULL,
    sender_user_id uuid NOT NULL,
    reply_to_message_id uuid,
    content text NOT NULL,
    is_edited boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    edited_at timestamp with time zone,
    author_user_id uuid,
    body text,
    deleted_at timestamp with time zone
);


ALTER TABLE public.messages OWNER TO signalum;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    inn text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.organizations OWNER TO signalum;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    token_hash text
);


ALTER TABLE public.password_reset_tokens OWNER TO signalum;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.permissions (
    key text NOT NULL,
    title text NOT NULL,
    module text NOT NULL
);


ALTER TABLE public.permissions OWNER TO signalum;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.role_permissions (
    role text NOT NULL,
    permission_key text NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO signalum;

--
-- Name: room_incidents; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.room_incidents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id uuid NOT NULL,
    incident_type text DEFAULT 'manual'::text NOT NULL,
    severity text DEFAULT 'info'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    title text DEFAULT 'Инцидент комнаты'::text NOT NULL,
    description text,
    created_by uuid,
    resolved_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    actor_user_id uuid,
    target_user_id uuid,
    note text,
    meta_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    acknowledged_at timestamp with time zone,
    acknowledged_by_user_id uuid
);


ALTER TABLE public.room_incidents OWNER TO signalum;

--
-- Name: room_join_requests; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.room_join_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by uuid
);


ALTER TABLE public.room_join_requests OWNER TO signalum;

--
-- Name: room_members; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.room_members (
    room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.room_members OWNER TO signalum;

--
-- Name: rooms; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.rooms (
    id uuid NOT NULL,
    name text NOT NULL,
    kind text NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    entry_mode text DEFAULT 'open'::text NOT NULL,
    CONSTRAINT rooms_kind_check CHECK ((kind = ANY (ARRAY['dm'::text, 'group'::text, 'channel'::text, 'voice'::text, 'stage'::text, 'meeting'::text])))
);


ALTER TABLE public.rooms OWNER TO signalum;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.system_settings (
    key text NOT NULL,
    value_json jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_settings OWNER TO signalum;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.user_profiles (
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    display_name text NOT NULL,
    "position" text,
    department_id uuid,
    avatar_url text,
    status_text text,
    last_seen_at timestamp with time zone,
    job_title text,
    phone text,
    bio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    photo_url text,
    about text
);


ALTER TABLE public.user_profiles OWNER TO signalum;

--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.user_settings (
    user_id uuid NOT NULL,
    theme text DEFAULT 'dark'::text NOT NULL,
    compact_mode boolean DEFAULT false NOT NULL,
    notification_sound boolean DEFAULT true NOT NULL,
    desktop_notifications boolean DEFAULT true NOT NULL,
    font_scale numeric(3,2) DEFAULT 1 NOT NULL,
    call_input_device text,
    call_output_device text,
    density text DEFAULT 'comfortable'::text NOT NULL,
    language text DEFAULT 'ru'::text NOT NULL,
    notifications_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    voice_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    notifications_enabled boolean DEFAULT true NOT NULL,
    sound_enabled boolean DEFAULT true NOT NULL,
    desktop_notifications_bool boolean DEFAULT true NOT NULL,
    enter_to_send boolean DEFAULT true NOT NULL,
    push_to_talk boolean DEFAULT false NOT NULL,
    voice_input_device text,
    voice_output_device text,
    high_contrast boolean DEFAULT false NOT NULL,
    reduce_motion boolean DEFAULT false NOT NULL
);


ALTER TABLE public.user_settings OWNER TO signalum;

--
-- Name: users; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    email text NOT NULL,
    login text,
    phone text,
    password_hash text,
    role text DEFAULT 'member'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    display_name text,
    username text,
    status text DEFAULT 'online'::text NOT NULL
);


ALTER TABLE public.users OWNER TO signalum;

--
-- Name: voice_participants; Type: TABLE; Schema: public; Owner: signalum
--

CREATE TABLE public.voice_participants (
    room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    voice_role text DEFAULT 'member'::text NOT NULL,
    is_connected boolean DEFAULT false NOT NULL,
    is_muted boolean DEFAULT false NOT NULL,
    is_deafened boolean DEFAULT false NOT NULL,
    hand_raised boolean DEFAULT false NOT NULL,
    is_speaking boolean DEFAULT false NOT NULL,
    screen_active boolean DEFAULT false NOT NULL,
    voice_banned boolean DEFAULT false NOT NULL,
    connected_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT voice_participants_voice_role_check CHECK ((voice_role = ANY (ARRAY['member'::text, 'moderator'::text, 'host'::text])))
);


ALTER TABLE public.voice_participants OWNER TO signalum;

--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);


--
-- Name: call_participants call_participants_call_id_user_id_joined_at_key; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT call_participants_call_id_user_id_joined_at_key UNIQUE (call_id, user_id, joined_at);


--
-- Name: call_participants call_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT call_participants_pkey PRIMARY KEY (id);


--
-- Name: calls calls_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.calls
    ADD CONSTRAINT calls_pkey PRIMARY KEY (id);


--
-- Name: chat_members chat_members_chat_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.chat_members
    ADD CONSTRAINT chat_members_chat_id_user_id_key UNIQUE (chat_id, user_id);


--
-- Name: chat_members chat_members_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.chat_members
    ADD CONSTRAINT chat_members_pkey PRIMARY KEY (id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_key UNIQUE (token);


--
-- Name: meeting_events meeting_events_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.meeting_events
    ADD CONSTRAINT meeting_events_pkey PRIMARY KEY (id);


--
-- Name: meeting_presence_logs meeting_presence_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.meeting_presence_logs
    ADD CONSTRAINT meeting_presence_logs_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (room_id);


--
-- Name: message_attachments message_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (key);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role, permission_key);


--
-- Name: room_incidents room_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.room_incidents
    ADD CONSTRAINT room_incidents_pkey PRIMARY KEY (id);


--
-- Name: room_join_requests room_join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.room_join_requests
    ADD CONSTRAINT room_join_requests_pkey PRIMARY KEY (id);


--
-- Name: room_join_requests room_join_requests_room_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.room_join_requests
    ADD CONSTRAINT room_join_requests_room_id_user_id_key UNIQUE (room_id, user_id);


--
-- Name: room_members room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT room_members_pkey PRIMARY KEY (room_id, user_id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_login_key; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_login_key UNIQUE (login);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: voice_participants voice_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.voice_participants
    ADD CONSTRAINT voice_participants_pkey PRIMARY KEY (room_id, user_id);


--
-- Name: voice_participants voice_participants_room_user_unique; Type: CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.voice_participants
    ADD CONSTRAINT voice_participants_room_user_unique UNIQUE (room_id, user_id);


--
-- Name: idx_calls_chat; Type: INDEX; Schema: public; Owner: signalum
--

CREATE INDEX idx_calls_chat ON public.calls USING btree (chat_id, started_at DESC);


--
-- Name: idx_chat_members_user; Type: INDEX; Schema: public; Owner: signalum
--

CREATE INDEX idx_chat_members_user ON public.chat_members USING btree (user_id);


--
-- Name: idx_invitations_email; Type: INDEX; Schema: public; Owner: signalum
--

CREATE INDEX idx_invitations_email ON public.invitations USING btree (email);


--
-- Name: idx_messages_chat; Type: INDEX; Schema: public; Owner: signalum
--

CREATE INDEX idx_messages_chat ON public.messages USING btree (chat_id, created_at);


--
-- Name: idx_room_incidents_room_id; Type: INDEX; Schema: public; Owner: signalum
--

CREATE INDEX idx_room_incidents_room_id ON public.room_incidents USING btree (room_id);


--
-- Name: idx_room_incidents_status; Type: INDEX; Schema: public; Owner: signalum
--

CREATE INDEX idx_room_incidents_status ON public.room_incidents USING btree (status);


--
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: signalum
--

CREATE INDEX idx_sessions_user ON public.auth_sessions USING btree (user_id, created_at DESC);


--
-- Name: idx_user_profiles_department; Type: INDEX; Schema: public; Owner: signalum
--

CREATE INDEX idx_user_profiles_department ON public.user_profiles USING btree (department_id);


--
-- Name: idx_user_profiles_department_id; Type: INDEX; Schema: public; Owner: signalum
--

CREATE INDEX idx_user_profiles_department_id ON public.user_profiles USING btree (department_id);


--
-- Name: idx_users_login; Type: INDEX; Schema: public; Owner: signalum
--

CREATE INDEX idx_users_login ON public.users USING btree (login);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: signalum
--

CREATE UNIQUE INDEX idx_users_username ON public.users USING btree (lower(username)) WHERE (username IS NOT NULL);


--
-- Name: attachments attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: auth_sessions auth_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: call_participants call_participants_call_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT call_participants_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.calls(id) ON DELETE CASCADE;


--
-- Name: call_participants call_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT call_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: calls calls_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.calls
    ADD CONSTRAINT calls_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- Name: calls calls_started_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.calls
    ADD CONSTRAINT calls_started_by_fkey FOREIGN KEY (started_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_members chat_members_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.chat_members
    ADD CONSTRAINT chat_members_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- Name: chat_members chat_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.chat_members
    ADD CONSTRAINT chat_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chats chats_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chats chats_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: departments departments_leader_fk; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_leader_fk FOREIGN KEY (leader_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: departments departments_leader_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_leader_user_fk FOREIGN KEY (leader_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: departments departments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: invitations invitations_accepted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_accepted_user_id_fkey FOREIGN KEY (accepted_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invitations invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: meeting_events meeting_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.meeting_events
    ADD CONSTRAINT meeting_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: meeting_events meeting_events_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.meeting_events
    ADD CONSTRAINT meeting_events_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.meetings(room_id) ON DELETE CASCADE;


--
-- Name: meetings meetings_host_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_host_user_id_fkey FOREIGN KEY (host_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: meetings meetings_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: message_attachments message_attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: messages messages_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- Name: messages messages_reply_to_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_reply_to_message_id_fkey FOREIGN KEY (reply_to_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: messages messages_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_key_fkey FOREIGN KEY (permission_key) REFERENCES public.permissions(key) ON DELETE CASCADE;


--
-- Name: room_members room_members_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT room_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: room_members room_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT room_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: voice_participants voice_participants_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.voice_participants
    ADD CONSTRAINT voice_participants_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: voice_participants voice_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: signalum
--

ALTER TABLE ONLY public.voice_participants
    ADD CONSTRAINT voice_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict nUIC5vyyvScl2brqU7mdHaWXsuWeabdmIcZtBgmCQQiPi5pgka73pZQR1Yes12k

