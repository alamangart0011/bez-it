--
-- PostgreSQL database dump
--

\restrict es2ww7Rfx2S0qYURL0Dy8mr6xEFhsqNPUZBerunK6q8QL5qRRszRhLReatU2aM9

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attachments; Type: TABLE; Schema: public; Owner: corpchat
--

CREATE TABLE public.attachments (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    room_id integer NOT NULL,
    message_id integer NOT NULL,
    original_name text NOT NULL,
    stored_name text NOT NULL,
    mime_type text NOT NULL,
    size_bytes integer NOT NULL,
    kind text DEFAULT 'file'::text NOT NULL,
    relative_path text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.attachments OWNER TO corpchat;

--
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: corpchat
--

CREATE SEQUENCE public.attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attachments_id_seq OWNER TO corpchat;

--
-- Name: attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: corpchat
--

ALTER SEQUENCE public.attachments_id_seq OWNED BY public.attachments.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: corpchat
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    user_id integer,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id integer,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO corpchat;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: corpchat
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO corpchat;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: corpchat
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: auth_otps; Type: TABLE; Schema: public; Owner: corpchat
--

CREATE TABLE public.auth_otps (
    id integer NOT NULL,
    phone text NOT NULL,
    method text NOT NULL,
    provider text NOT NULL,
    code text,
    external_id text,
    call_number text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.auth_otps OWNER TO corpchat;

--
-- Name: auth_otps_id_seq; Type: SEQUENCE; Schema: public; Owner: corpchat
--

CREATE SEQUENCE public.auth_otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_otps_id_seq OWNER TO corpchat;

--
-- Name: auth_otps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: corpchat
--

ALTER SEQUENCE public.auth_otps_id_seq OWNED BY public.auth_otps.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: corpchat
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    room_id integer NOT NULL,
    author_id integer,
    body text DEFAULT ''::text NOT NULL,
    message_type text DEFAULT 'text'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO corpchat;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: corpchat
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO corpchat;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: corpchat
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: corpchat
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.organizations OWNER TO corpchat;

--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: corpchat
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organizations_id_seq OWNER TO corpchat;

--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: corpchat
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: room_join_requests; Type: TABLE; Schema: public; Owner: corpchat
--

CREATE TABLE public.room_join_requests (
    id integer NOT NULL,
    room_id integer NOT NULL,
    user_id integer NOT NULL,
    note text,
    status text DEFAULT 'pending'::text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by integer
);


ALTER TABLE public.room_join_requests OWNER TO corpchat;

--
-- Name: room_join_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: corpchat
--

CREATE SEQUENCE public.room_join_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_join_requests_id_seq OWNER TO corpchat;

--
-- Name: room_join_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: corpchat
--

ALTER SEQUENCE public.room_join_requests_id_seq OWNED BY public.room_join_requests.id;


--
-- Name: room_memberships; Type: TABLE; Schema: public; Owner: corpchat
--

CREATE TABLE public.room_memberships (
    id integer NOT NULL,
    room_id integer NOT NULL,
    user_id integer NOT NULL,
    membership_role text DEFAULT 'member'::text NOT NULL,
    status text DEFAULT 'approved'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.room_memberships OWNER TO corpchat;

--
-- Name: room_memberships_id_seq; Type: SEQUENCE; Schema: public; Owner: corpchat
--

CREATE SEQUENCE public.room_memberships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_memberships_id_seq OWNER TO corpchat;

--
-- Name: room_memberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: corpchat
--

ALTER SEQUENCE public.room_memberships_id_seq OWNED BY public.room_memberships.id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: corpchat
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    name text NOT NULL,
    kind text DEFAULT 'text'::text NOT NULL,
    access_mode text DEFAULT 'open'::text NOT NULL,
    description text,
    parent_id integer,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rooms OWNER TO corpchat;

--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: corpchat
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_id_seq OWNER TO corpchat;

--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: corpchat
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: corpchat
--

CREATE TABLE public.users (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    email text,
    phone text,
    password_hash text,
    full_name text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_login_required CHECK (((email IS NOT NULL) OR (phone IS NOT NULL))),
    CONSTRAINT users_password_or_phone CHECK (((password_hash IS NOT NULL) OR (phone IS NOT NULL)))
);


ALTER TABLE public.users OWNER TO corpchat;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: corpchat
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO corpchat;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: corpchat
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: attachments id; Type: DEFAULT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.attachments ALTER COLUMN id SET DEFAULT nextval('public.attachments_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: auth_otps id; Type: DEFAULT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.auth_otps ALTER COLUMN id SET DEFAULT nextval('public.auth_otps_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: room_join_requests id; Type: DEFAULT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.room_join_requests ALTER COLUMN id SET DEFAULT nextval('public.room_join_requests_id_seq'::regclass);


--
-- Name: room_memberships id; Type: DEFAULT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.room_memberships ALTER COLUMN id SET DEFAULT nextval('public.room_memberships_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: corpchat
--

COPY public.attachments (id, organization_id, room_id, message_id, original_name, stored_name, mime_type, size_bytes, kind, relative_path, created_at) FROM stdin;
1	1	1	2	Ð ÐµÐºÐ²Ð¸Ð·Ð¸ÑÑ Ð¢Ð¾ÑÐºÐ°.pdf	1775264367818-1816dbb5-34d7-4485-8497-dbf7469a5f37.pdf	application/pdf	69572	file	org-1/room-1/1775264367818-1816dbb5-34d7-4485-8497-dbf7469a5f37.pdf	2026-04-04 00:59:27.815295+00
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: corpchat
--

COPY public.audit_logs (id, organization_id, user_id, action, entity_type, entity_id, details, created_at) FROM stdin;
1	1	1	auth.phone_register	user	1	{"phone": "+79022270002"}	2026-04-04 00:09:55.937977+00
2	1	1	message.create	message	1	{"roomId": 1, "hasFile": false, "messageType": "text"}	2026-04-04 00:10:16.694976+00
3	1	1	message.create	message	2	{"roomId": 1, "hasFile": true, "messageType": "file"}	2026-04-04 00:59:27.845416+00
\.


--
-- Data for Name: auth_otps; Type: TABLE DATA; Schema: public; Owner: corpchat
--

COPY public.auth_otps (id, phone, method, provider, code, external_id, call_number, payload, expires_at, consumed_at, created_at, attempt_count) FROM stdin;
1	+79022270002	sms	dev	586195	\N	\N	{"fullName": "Серёгин Сергей Викторович", "companyName": "НПК Оборон-Экран"}	2026-04-04 00:14:48.215357+00	2026-04-04 00:09:55.883234+00	2026-04-04 00:09:48.215357+00	0
2	+79022270002	sms	dev	914528	\N	\N	{"fullName": "", "companyName": "НПК"}	2026-04-04 00:35:29.103477+00	2026-04-04 00:30:33.242595+00	2026-04-04 00:30:29.103477+00	0
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: corpchat
--

COPY public.messages (id, room_id, author_id, body, message_type, metadata, created_at) FROM stdin;
1	1	1	Привет\r\n	text	{}	2026-04-04 00:10:16.654209+00
2	1	1		file	{}	2026-04-04 00:59:27.815295+00
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: corpchat
--

COPY public.organizations (id, name, slug, created_at) FROM stdin;
1	НПК Оборон-Экран	нпк-оборон-экран	2026-04-04 00:09:55.883234+00
\.


--
-- Data for Name: room_join_requests; Type: TABLE DATA; Schema: public; Owner: corpchat
--

COPY public.room_join_requests (id, room_id, user_id, note, status, requested_at, resolved_at, resolved_by) FROM stdin;
\.


--
-- Data for Name: room_memberships; Type: TABLE DATA; Schema: public; Owner: corpchat
--

COPY public.room_memberships (id, room_id, user_id, membership_role, status, created_at) FROM stdin;
1	2	1	owner	approved	2026-04-04 00:09:55.883234+00
2	4	1	owner	approved	2026-04-04 00:09:55.883234+00
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: corpchat
--

COPY public.rooms (id, organization_id, name, kind, access_mode, description, parent_id, created_by, created_at) FROM stdin;
1	1	Общий	text	open	Основной канал компании	\N	1	2026-04-04 00:09:55.883234+00
2	1	Объявления	text	request	Важные сообщения и анонсы	\N	1	2026-04-04 00:09:55.883234+00
3	1	Голосовой общий	voice	open	Быстрые обсуждения и созвоны	\N	1	2026-04-04 00:09:55.883234+00
4	1	Совещание руководства	stage	request	Комната для встреч руководителей	\N	1	2026-04-04 00:09:55.883234+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: corpchat
--

COPY public.users (id, organization_id, email, phone, password_hash, full_name, role, is_active, created_at) FROM stdin;
1	1	\N	+79022270002	\N	Серёгин Сергей Викторович	superadmin	t	2026-04-04 00:09:55.883234+00
\.


--
-- Name: attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: corpchat
--

SELECT pg_catalog.setval('public.attachments_id_seq', 1, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: corpchat
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 3, true);


--
-- Name: auth_otps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: corpchat
--

SELECT pg_catalog.setval('public.auth_otps_id_seq', 2, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: corpchat
--

SELECT pg_catalog.setval('public.messages_id_seq', 2, true);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: corpchat
--

SELECT pg_catalog.setval('public.organizations_id_seq', 1, true);


--
-- Name: room_join_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: corpchat
--

SELECT pg_catalog.setval('public.room_join_requests_id_seq', 1, false);


--
-- Name: room_memberships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: corpchat
--

SELECT pg_catalog.setval('public.room_memberships_id_seq', 2, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: corpchat
--

SELECT pg_catalog.setval('public.rooms_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: corpchat
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_otps auth_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.auth_otps
    ADD CONSTRAINT auth_otps_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: room_join_requests room_join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.room_join_requests
    ADD CONSTRAINT room_join_requests_pkey PRIMARY KEY (id);


--
-- Name: room_join_requests room_join_requests_room_id_user_id_status_key; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.room_join_requests
    ADD CONSTRAINT room_join_requests_room_id_user_id_status_key UNIQUE (room_id, user_id, status);


--
-- Name: room_memberships room_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.room_memberships
    ADD CONSTRAINT room_memberships_pkey PRIMARY KEY (id);


--
-- Name: room_memberships room_memberships_room_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.room_memberships
    ADD CONSTRAINT room_memberships_room_id_user_id_key UNIQUE (room_id, user_id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_org_created; Type: INDEX; Schema: public; Owner: corpchat
--

CREATE INDEX idx_audit_org_created ON public.audit_logs USING btree (organization_id, created_at DESC);


--
-- Name: idx_messages_room_created; Type: INDEX; Schema: public; Owner: corpchat
--

CREATE INDEX idx_messages_room_created ON public.messages USING btree (room_id, created_at DESC);


--
-- Name: attachments attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: attachments attachments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: attachments attachments_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: room_join_requests room_join_requests_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.room_join_requests
    ADD CONSTRAINT room_join_requests_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: room_join_requests room_join_requests_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.room_join_requests
    ADD CONSTRAINT room_join_requests_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: room_join_requests room_join_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.room_join_requests
    ADD CONSTRAINT room_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: room_memberships room_memberships_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.room_memberships
    ADD CONSTRAINT room_memberships_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: room_memberships room_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.room_memberships
    ADD CONSTRAINT room_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: rooms rooms_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.rooms(id) ON DELETE SET NULL;


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: corpchat
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict es2ww7Rfx2S0qYURL0Dy8mr6xEFhsqNPUZBerunK6q8QL5qRRszRhLReatU2aM9

