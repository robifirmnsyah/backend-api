-- Skrip ini dihasilkan oleh alat ERD di pgAdmin 4.
-- Harap catat masalah di https://github.com/pgadmin-org/pgadmin4/issues/new/choose jika Anda menemukan bug, termasuk langkah reproduksi.
BEGIN;


CREATE TABLE IF NOT EXISTS public.customers
(
    company_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    company_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    billing_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    maintenance character varying(20) COLLATE pg_catalog."default" NOT NULL,
    limit_ticket integer NOT NULL,
    ticket_usage integer DEFAULT 0,
    CONSTRAINT unique_billing_id UNIQUE (billing_id),
    CONSTRAINT unique_company_id UNIQUE (company_id)
);

CREATE TABLE IF NOT EXISTS public.group_projects
(
    id integer NOT NULL DEFAULT nextval('user_projects_id_seq'::regclass),
    group_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    project_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT user_projects_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.groups
(
    group_id character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT nextval('groups_group_id_seq'::regclass),
    group_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    company_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT groups_pkey PRIMARY KEY (group_id)
);

CREATE TABLE IF NOT EXISTS public.projects
(
    project_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    project_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    billing_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    company_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT projects_pkey PRIMARY KEY (project_id)
);

CREATE TABLE IF NOT EXISTS public.services
(
    id serial NOT NULL,
    service_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT services_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.ticket_comments
(
    comment_id serial NOT NULL,
    ticket_id character varying(50) COLLATE pg_catalog."default" DEFAULT NULL::character varying,
    id_user character varying(50) COLLATE pg_catalog."default" DEFAULT NULL::character varying,
    comment text COLLATE pg_catalog."default" NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ticket_comments_pkey PRIMARY KEY (comment_id)
);

CREATE TABLE IF NOT EXISTS public.tickets
(
    ticket_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    company_id character varying(255) COLLATE pg_catalog."default" DEFAULT NULL::character varying,
    company_name character varying(255) COLLATE pg_catalog."default" DEFAULT NULL::character varying,
    product_list text COLLATE pg_catalog."default",
    describe_issue character varying(255) COLLATE pg_catalog."default" DEFAULT NULL::character varying,
    detail_issue text COLLATE pg_catalog."default",
    contact character varying(255) COLLATE pg_catalog."default" DEFAULT NULL::character varying,
    attachment character varying(255) COLLATE pg_catalog."default" DEFAULT NULL::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    priority character varying(20) COLLATE pg_catalog."default" NOT NULL,
    status character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'Open'::character varying,
    id_user character varying(255) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT tickets_pkey PRIMARY KEY (ticket_id)
);

CREATE TABLE IF NOT EXISTS public.user_groups
(
    id serial NOT NULL,
    id_user character varying(20) COLLATE pg_catalog."default" NOT NULL,
    group_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT user_groups_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.users
(
    id_user character varying(20) COLLATE pg_catalog."default" NOT NULL,
    role character varying(50) COLLATE pg_catalog."default" DEFAULT 'Customer'::character varying,
    full_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    username character varying(50) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    company_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    company_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    billing_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    phone character varying(20) COLLATE pg_catalog."default" NOT NULL,
    group_id character varying(20) COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (id_user)
);

ALTER TABLE IF EXISTS public.group_projects
    ADD CONSTRAINT fk_group_id FOREIGN KEY (group_id)
    REFERENCES public.groups (group_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.group_projects
    ADD CONSTRAINT fk_project_id FOREIGN KEY (project_id)
    REFERENCES public.projects (project_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.groups
    ADD CONSTRAINT fk_company_id FOREIGN KEY (company_id)
    REFERENCES public.customers (company_id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.projects
    ADD CONSTRAINT fk_billing_id FOREIGN KEY (billing_id)
    REFERENCES public.customers (billing_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.projects
    ADD CONSTRAINT fk_company_id FOREIGN KEY (company_id)
    REFERENCES public.customers (company_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.ticket_comments
    ADD CONSTRAINT ticket_comments_ibfk_1 FOREIGN KEY (ticket_id)
    REFERENCES public.tickets (ticket_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX IF NOT EXISTS ticket_comments_ticket_id_idx
    ON public.ticket_comments(ticket_id);


ALTER TABLE IF EXISTS public.ticket_comments
    ADD CONSTRAINT ticket_comments_ibfk_2 FOREIGN KEY (id_user)
    REFERENCES public.users (id_user) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.user_groups
    ADD CONSTRAINT fk_group_id FOREIGN KEY (group_id)
    REFERENCES public.groups (group_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.user_groups
    ADD CONSTRAINT fk_user_id FOREIGN KEY (id_user)
    REFERENCES public.users (id_user) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.users
    ADD CONSTRAINT fk_company_id FOREIGN KEY (company_id)
    REFERENCES public.customers (company_id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;

END;