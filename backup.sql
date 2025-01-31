--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: magna
--

CREATE TABLE public.customers (
    company_id character varying(20) NOT NULL,
    company_name character varying(100) NOT NULL,
    billing_id character varying(20) NOT NULL,
    maintenance character varying(20) NOT NULL,
    limit_ticket integer NOT NULL,
    ticket_usage integer DEFAULT 0
);


ALTER TABLE public.customers OWNER TO magna;

--
-- Name: services; Type: TABLE; Schema: public; Owner: magna
--

CREATE TABLE public.services (
    id integer NOT NULL,
    service_name character varying(255) NOT NULL
);


ALTER TABLE public.services OWNER TO magna;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: magna
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO magna;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: magna
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: ticket_comments; Type: TABLE; Schema: public; Owner: magna
--

CREATE TABLE public.ticket_comments (
    comment_id integer NOT NULL,
    ticket_id character varying(50) DEFAULT NULL::character varying,
    id_user character varying(50) DEFAULT NULL::character varying,
    comment text NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ticket_comments OWNER TO magna;

--
-- Name: ticket_comments_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: magna
--

CREATE SEQUENCE public.ticket_comments_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_comments_comment_id_seq OWNER TO magna;

--
-- Name: ticket_comments_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: magna
--

ALTER SEQUENCE public.ticket_comments_comment_id_seq OWNED BY public.ticket_comments.comment_id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: magna
--

CREATE TABLE public.tickets (
    ticket_id character varying(255) NOT NULL,
    company_id character varying(255) DEFAULT NULL::character varying,
    company_name character varying(255) DEFAULT NULL::character varying,
    product_list text,
    describe_issue character varying(255) DEFAULT NULL::character varying,
    detail_issue text,
    contact character varying(255) DEFAULT NULL::character varying,
    attachment character varying(255) DEFAULT NULL::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    priority character varying(20) NOT NULL,
    status character varying(50) DEFAULT 'Open'::character varying NOT NULL,
    id_user character varying(255) NOT NULL
);


ALTER TABLE public.tickets OWNER TO magna;

--
-- Name: users; Type: TABLE; Schema: public; Owner: magna
--

CREATE TABLE public.users (
    id_user character varying(20) NOT NULL,
    role character varying(50) DEFAULT 'Customer'::character varying,
    full_name character varying(100) NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    company_id character varying(20) NOT NULL,
    company_name character varying(100) NOT NULL,
    billing_id character varying(20) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL
);


ALTER TABLE public.users OWNER TO magna;

--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: magna
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: ticket_comments comment_id; Type: DEFAULT; Schema: public; Owner: magna
--

ALTER TABLE ONLY public.ticket_comments ALTER COLUMN comment_id SET DEFAULT nextval('public.ticket_comments_comment_id_seq'::regclass);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: magna
--

COPY public.customers (company_id, company_name, billing_id, maintenance, limit_ticket, ticket_usage) FROM stdin;
COMP-73655	Smartnet Magna Global	BILL-875837583	7x24 Hours	4	0
COMP-99881	Ayo Indonesia Maju	BILL-9998876	7x24 Hours	2	2
COMP-28210	Chaoren Pokphand Indonesia	BILL-8774747	5x8 Hours	4	2
COMP-14794	Lotte Indonesia Factory	BILL-875837583	7x24 Hours	4	2
COMP-69262	Blue Sky Group	9797937193791739173	7x24 Hours	3	0
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: magna
--

COPY public.services (id, service_name) FROM stdin;
1	Compute Engine
2	Google Kubernetes Engine
3	Cloud Run
4	Cloud Function
5	App Engine
6	Cloud Storage
7	BigQuery
8	Cloud Pub/Sub
9	Cloud SQL
10	Cloud Firestore
11	VPC Network
12	IAM Admin
\.


--
-- Data for Name: ticket_comments; Type: TABLE DATA; Schema: public; Owner: magna
--

COPY public.ticket_comments (comment_id, ticket_id, id_user, comment, "timestamp") FROM stdin;
59	TICKET-1733897730579-QNXYB4	USER-7NXI9EQE	tolong do\\nibantu	2024-12-11 13:15:45
60	TICKET-1733897730579-QNXYB4	USER-3JCPWJFO	gagag	2024-12-11 13:16:27
61	TICKET-1733897730579-QNXYB4	USER-ICW68A74	qaAQAqQ	2024-12-11 13:17:03
1	TICKET-1733901082344-THSR4A	USER-ICW68A74	Halo	2025-01-31 08:35:18.206762
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: magna
--

COPY public.tickets (ticket_id, company_id, company_name, product_list, describe_issue, detail_issue, contact, attachment, created_at, priority, status, id_user) FROM stdin;
TICKET-1733897730579-QNXYB4	COMP-14794	Lotte Indonesia Factory	Compute Engine	vm mati	error 404	Email	\N	2024-12-11 06:15:30	P1 - Critical	Closed	USER-7NXI9EQE
TICKET-1733901082344-THSR4A	COMP-14794	Lotte Indonesia Factory	Cloud Run	sdada	asdad	Email	\N	2024-12-11 07:11:22	P4 - Low impact	Open	USER-3JCPWJFO
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: magna
--

COPY public.users (id_user, role, full_name, username, password, company_id, company_name, billing_id, email, phone) FROM stdin;
USER-0YKUVSAZ	Customer	gibran2	gibran2	$2b$10$xvcmvJj9ziIX1oWvvR6IzuWdWgKMb81Rf9cfKd4SNbTCZSjeaNKTW	COMP-99881	Ayo Indonesia Maju	BILL-9998876	yemaarfara@gmail.com	081218158909
USER-3JCPWJFO	Customer	deni2	deni2	$2b$10$Uu7m9Nx0lG3jBDcV.Pi/GeeXL3Nt3CHdZaXlhGQJuiE0QL3IDIEsm	COMP-14794	Lotte Indonesia Factory	BILL-875837583	yemaarfara@gmail.com	081218158909
USER-7NXI9EQE	Customer Admin	deni	deni	$2b$10$QROTy.56nnT4tDfxRKPJqOVYTB6pyU/CQ76EKCS9W9sTQd4EWegtO	COMP-14794	Lotte Indonesia Factory	BILL-875837583	yemaarfara@gmail.com	081218158909
USER-F4DHXFXG	Customer Admin	Gibran Rakabuming	gibran	$2b$10$fOUAlyR0ZnvSaMGIUCyN4ujSQabavU38Dd7fwF1PACnSeQneKNKda	COMP-99881	Ayo Indonesia Maju	BILL-9998876	yemaarfara@gmail.com	081218158909
USER-ICW68A74	Admin	Arfara Yema Samgusdian	dev_arfara	$2b$10$mYV8gy1.R2QhO2NUH19hZuL5ogtr1ia6hsiFeFNfV6UwmMDwYs4JK	COMP-73655	Smartnet Magna Global	BILL-875837583	indonesianstudent14@gmail.com	081218158909
USER-IV3WEK59	Customer Admin	Beni Santoso	beni	$2b$10$lp93sPOZjRKp0K3YmvrBYuskvOvT5x7qchHnLljKpbYzF2EhK0Ifq	COMP-28210	Chaoren Pokphand Indonesia	BILL-8774747	yemaarfara@gmail.com	081218158909
USER-LNLTVLZW	Customer	Hedwig Santoso	hedwigs	$2b$10$5ubIZBPUDUQ8rDtb9Hg1Ce6i9COEAglKw64h2MslQ/wi7ejJfWj9q	COMP-28210	Chaoren Pokphand Indonesia	BILL-8774747	yemaarfara@gmail.com	081218158909
USER-SZKFU0ZV	Customer	faiqoh	faiqoh	$2b$10$H4fvy.j7IKgvpnZVjXX7hugU.sraoKQbNXSgUWSUq78fbDA8.DZk.	COMP-98619	Sinergy Informasi Pratama	BILL-9998876	yemaarfara@gmail.com	081218158909
USER-T63ISF6T	Customer Admin	Tito Nugroho	tito	$2b$10$KuKrfRvtPx4VKaTecZyZDuS7mJUEvcgcX3VMyw6K5JnWByjviWVBi	COMP-98619	Sinergy Informasi Pratama	BILL-9998876	yemaarfara@gmail.com	081218158909
\.


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: magna
--

SELECT pg_catalog.setval('public.services_id_seq', 1, false);


--
-- Name: ticket_comments_comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: magna
--

SELECT pg_catalog.setval('public.ticket_comments_comment_id_seq', 1, true);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: magna
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: magna
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (comment_id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: magna
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (ticket_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: magna
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id_user);


--
-- Name: ticket_comments_ticket_id_idx; Type: INDEX; Schema: public; Owner: magna
--

CREATE INDEX ticket_comments_ticket_id_idx ON public.ticket_comments USING btree (ticket_id);


--
-- Name: ticket_comments ticket_comments_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: magna
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_ibfk_1 FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id);


--
-- Name: ticket_comments ticket_comments_ibfk_2; Type: FK CONSTRAINT; Schema: public; Owner: magna
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_ibfk_2 FOREIGN KEY (id_user) REFERENCES public.users(id_user);


--
-- PostgreSQL database dump complete
--

