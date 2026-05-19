--
-- PostgreSQL database dump
--

\restrict zHBmIBWuIroQYotheTZlrcA4YboJNQ8a4r4XtheycVALgvZ77rsOY8MRbawzV7t

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'unread'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- Name: exam_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id uuid,
    intern_id uuid,
    started_at timestamp without time zone DEFAULT now(),
    submitted_at timestamp without time zone,
    status character varying(20),
    score integer DEFAULT 0,
    CONSTRAINT exam_attempts_status_check CHECK (((status)::text = ANY ((ARRAY['STARTED'::character varying, 'SUBMITTED'::character varying, 'TIMEOUT'::character varying])::text[])))
);


ALTER TABLE public.exam_attempts OWNER TO postgres;

--
-- Name: exam_instructions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_instructions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id uuid,
    instruction text NOT NULL
);


ALTER TABLE public.exam_instructions OWNER TO postgres;

--
-- Name: exams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    duration_minutes integer NOT NULL,
    total_marks integer NOT NULL,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    is_published boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.exams OWNER TO postgres;

--
-- Name: intern_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.intern_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    intern_id uuid NOT NULL,
    password text NOT NULL,
    is_approved integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.intern_users OWNER TO postgres;

--
-- Name: interns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text DEFAULT 'N/A'::text NOT NULL,
    work_experience text,
    education text DEFAULT 'N/A'::text NOT NULL,
    city text DEFAULT 'N/A'::text NOT NULL,
    github text,
    linkedin text,
    skills text DEFAULT 'N/A'::text NOT NULL,
    projects text,
    cv_filename text,
    cv_original_name text,
    profile_image text,
    applied_date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.interns OWNER TO postgres;

--
-- Name: interns_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interns_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attempt_id uuid,
    question_id uuid,
    answer_text text,
    marks_obtained integer DEFAULT 0
);


ALTER TABLE public.interns_answers OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    intern_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read integer DEFAULT 0 NOT NULL,
    related_task_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'in-progress'::text NOT NULL,
    start_date timestamp without time zone DEFAULT now(),
    end_date timestamp without time zone,
    repository_url text,
    deployed_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id uuid,
    question_text text NOT NULL,
    option_a text NOT NULL,
    option_b text NOT NULL,
    option_c text NOT NULL,
    option_d text NOT NULL,
    correct_option character(1) NOT NULL,
    marks integer NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attempt_id uuid,
    total_marks integer,
    obtained_marks integer,
    percentage numeric(5,2),
    grade character varying(10),
    published boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.results OWNER TO postgres;

--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    assigned_to uuid,
    project_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'medium'::text,
    start_date timestamp without time zone,
    due_date timestamp without time zone,
    created_by text NOT NULL,
    created_by_intern uuid,
    submitted_at timestamp without time zone,
    closed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: time_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.time_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    intern_id uuid NOT NULL,
    task_id uuid,
    log_type text NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    duration integer,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.time_logs OWNER TO postgres;

--
-- Name: weekly_updates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.weekly_updates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    intern_id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    program_course_name text NOT NULL,
    week_number integer NOT NULL,
    year integer NOT NULL,
    reporting_period text NOT NULL,
    learning_topics text,
    tasks_completed text,
    work_output text,
    github_repo_link text,
    deployed_url text,
    task_completion_status text,
    self_rating integer,
    time_spent text,
    challenges_faced text,
    solutions_attempted text,
    key_learnings text,
    performance_score integer,
    mentor_feedback text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.weekly_updates OWNER TO postgres;

--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (id, username, password) FROM stdin;
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_messages (id, first_name, last_name, email, subject, message, status, created_at) FROM stdin;
\.


--
-- Data for Name: exam_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_attempts (id, exam_id, intern_id, started_at, submitted_at, status, score) FROM stdin;
\.


--
-- Data for Name: exam_instructions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_instructions (id, exam_id, instruction) FROM stdin;
\.


--
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exams (id, title, description, duration_minutes, total_marks, start_time, end_time, is_published, created_at) FROM stdin;
af51c1e9-a5dd-40f6-ad28-a5ccc180e059	rre	erter	60	100	2026-02-01 01:00:00	2026-02-01 03:00:00	f	2026-01-03 18:56:40.306169
\.


--
-- Data for Name: intern_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.intern_users (id, intern_id, password, is_approved, created_at) FROM stdin;
9851ca9c-2462-410a-bc08-4224bd40ee03	4308087d-c179-41a1-adf0-08eef8e1407c	$2b$10$La0QfsBnYLg95MNDNYlInuLiXEY9uzQg8UPqLQDyF0z0DsKv0LDc.	1	2026-01-08 12:15:14.229663
\.


--
-- Data for Name: interns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interns (id, name, email, phone, work_experience, education, city, github, linkedin, skills, projects, cv_filename, cv_original_name, profile_image, applied_date) FROM stdin;
4308087d-c179-41a1-adf0-08eef8e1407c	Bhavna Baria	bhavanabaria13@gmail.com	+916351346285	tes	IT	VADODARA	\N	\N	css.html, js	\N	1767854518817-612484939.pdf	Abhi_Resume_24 .pdf	\N	2026-01-08 12:12:01.061197
\.


--
-- Data for Name: interns_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interns_answers (id, attempt_id, question_id, answer_text, marks_obtained) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, intern_id, type, title, message, read, related_task_id, created_at) FROM stdin;
d378cdf5-e988-4037-887a-884567e85084	4308087d-c179-41a1-adf0-08eef8e1407c	task_assigned	New Task Assigned	You have been assigned a new task: "test"	0	\N	2026-01-08 15:07:10.222
dead5d81-f641-42db-bf2b-d3544074c61e	4308087d-c179-41a1-adf0-08eef8e1407c	task_assigned	New Task Assigned	You have been assigned a new task: "task1-project-1"	0	\N	2026-01-08 15:26:26.907
52754cad-bb47-4fe9-a17a-abe9f850ce4d	4308087d-c179-41a1-adf0-08eef8e1407c	task_assigned	New Task Assigned	You have been assigned a new task: "t1"	0	a49ff1a0-1542-4f86-aae1-7487a203f874	2026-01-08 15:45:36.332
9772e8c0-3230-416f-a7f1-da429961a0cc	4308087d-c179-41a1-adf0-08eef8e1407c	task_assigned	New Task Assigned	You have been assigned a new task: "9j0-task1"	0	38c668c4-e1e2-414a-b15d-3642509ede09	2026-01-09 10:36:43.554
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, name, description, status, start_date, end_date, repository_url, deployed_url, created_at, updated_at) FROM stdin;
19f935a3-7554-4836-bdbd-0a74fa1609a2	p1	p1	in-progress	2026-01-08 00:00:00	2026-01-16 00:00:00	\N	\N	2026-01-08 15:44:49.808	2026-01-08 15:44:49.808
d2baaa85-d984-4a20-a8e8-9b4c054dd184	ja-9p1	ja	in-progress	2026-01-13 00:00:00	2026-01-09 00:00:00	\N	\N	2026-01-09 10:33:52.451	2026-01-09 10:33:52.451
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, notes, created_at) FROM stdin;
\.


--
-- Data for Name: results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.results (id, attempt_id, total_marks, obtained_marks, percentage, grade, published, created_at) FROM stdin;
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (sid, sess, expire) FROM stdin;
HVqYg5LdswSAr-MlnC4QtYjbl4zsGNtE	{"cookie":{"originalMaxAge":86400000,"expires":"2026-01-10T10:29:53.950Z","secure":false,"httpOnly":true,"path":"/"},"isAdmin":true}	2026-01-10 16:39:34
VcoL2rmLWxEiSdaPF-s8mvU9P8U4EHDH	{"cookie":{"originalMaxAge":86400000,"expires":"2026-01-09T12:02:10.287Z","secure":false,"httpOnly":true,"path":"/"},"internId":"4308087d-c179-41a1-adf0-08eef8e1407c"}	2026-01-09 19:24:47
LtuEMNvkWlhdJLPekF3ELzqhQxP5Aqwe	{"cookie":{"originalMaxAge":86400000,"expires":"2026-01-09T15:10:31.988Z","secure":false,"httpOnly":true,"path":"/"},"isAdmin":true}	2026-01-09 21:25:26
tFBTyE9_Jv1j4plrP4mpOm2UomoJwpbg	{"cookie":{"originalMaxAge":86400000,"expires":"2026-01-09T15:08:00.908Z","secure":false,"httpOnly":true,"path":"/"},"internId":"4308087d-c179-41a1-adf0-08eef8e1407c"}	2026-01-10 16:43:11
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, assigned_to, project_id, status, priority, start_date, due_date, created_by, created_by_intern, submitted_at, closed_at, created_at, updated_at) FROM stdin;
a49ff1a0-1542-4f86-aae1-7487a203f874	t1	t1	4308087d-c179-41a1-adf0-08eef8e1407c	\N	pending	medium	\N	2026-01-12 00:00:00	admin	\N	\N	\N	2026-01-08 15:45:35.958	2026-01-08 15:45:35.958
38c668c4-e1e2-414a-b15d-3642509ede09	9j0-task1	9j0-task1	4308087d-c179-41a1-adf0-08eef8e1407c	\N	pending	medium	\N	2026-02-01 00:00:00	admin	\N	\N	\N	2026-01-09 10:36:43.026	2026-01-09 10:36:43.026
9b46f726-be1f-4c20-86a8-592f2f2196ff	kavua-9ja	kavua-9ja	4308087d-c179-41a1-adf0-08eef8e1407c	\N	pending	medium	\N	2026-02-12 00:00:00	intern	4308087d-c179-41a1-adf0-08eef8e1407c	\N	\N	2026-01-09 11:09:09.954	2026-01-09 11:09:09.954
\.


--
-- Data for Name: time_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.time_logs (id, intern_id, task_id, log_type, start_time, end_time, duration, notes, created_at) FROM stdin;
4cab13ad-c2d6-4abd-bc25-306a2e8dbcca	4308087d-c179-41a1-adf0-08eef8e1407c	\N	task	2026-01-08 15:08:38.147	\N	\N	\N	2026-01-08 20:38:38.14966
\.


--
-- Data for Name: weekly_updates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weekly_updates (id, intern_id, full_name, email, program_course_name, week_number, year, reporting_period, learning_topics, tasks_completed, work_output, github_repo_link, deployed_url, task_completion_status, self_rating, time_spent, challenges_faced, solutions_attempted, key_learnings, performance_score, mentor_feedback, created_at, updated_at) FROM stdin;
\.


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- Name: admin admin_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_username_unique UNIQUE (username);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: exam_attempts exam_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT exam_attempts_pkey PRIMARY KEY (id);


--
-- Name: exam_instructions exam_instructions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_instructions
    ADD CONSTRAINT exam_instructions_pkey PRIMARY KEY (id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: intern_users intern_users_intern_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern_users
    ADD CONSTRAINT intern_users_intern_id_unique UNIQUE (intern_id);


--
-- Name: intern_users intern_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern_users
    ADD CONSTRAINT intern_users_pkey PRIMARY KEY (id);


--
-- Name: interns_answers interns_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interns_answers
    ADD CONSTRAINT interns_answers_pkey PRIMARY KEY (id);


--
-- Name: interns interns_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interns
    ADD CONSTRAINT interns_email_unique UNIQUE (email);


--
-- Name: interns interns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interns
    ADD CONSTRAINT interns_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: results results_attempt_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_attempt_id_key UNIQUE (attempt_id);


--
-- Name: results results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: time_logs time_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_logs
    ADD CONSTRAINT time_logs_pkey PRIMARY KEY (id);


--
-- Name: weekly_updates weekly_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_updates
    ADD CONSTRAINT weekly_updates_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: exam_attempts exam_attempts_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT exam_attempts_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id);


--
-- Name: exam_attempts exam_attempts_intern_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT exam_attempts_intern_id_fkey FOREIGN KEY (intern_id) REFERENCES public.interns(id);


--
-- Name: exam_instructions exam_instructions_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_instructions
    ADD CONSTRAINT exam_instructions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id);


--
-- Name: intern_users intern_users_intern_id_interns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern_users
    ADD CONSTRAINT intern_users_intern_id_interns_id_fk FOREIGN KEY (intern_id) REFERENCES public.interns(id) ON DELETE CASCADE;


--
-- Name: interns_answers interns_answers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interns_answers
    ADD CONSTRAINT interns_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id) ON DELETE CASCADE;


--
-- Name: interns_answers interns_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interns_answers
    ADD CONSTRAINT interns_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id);


--
-- Name: notifications notifications_intern_id_interns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_intern_id_interns_id_fk FOREIGN KEY (intern_id) REFERENCES public.interns(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_task_id_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_task_id_tasks_id_fk FOREIGN KEY (related_task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;


--
-- Name: questions questions_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: results results_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id);


--
-- Name: tasks tasks_assigned_to_interns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_interns_id_fk FOREIGN KEY (assigned_to) REFERENCES public.interns(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_created_by_intern_interns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_intern_interns_id_fk FOREIGN KEY (created_by_intern) REFERENCES public.interns(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: time_logs time_logs_intern_id_interns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_logs
    ADD CONSTRAINT time_logs_intern_id_interns_id_fk FOREIGN KEY (intern_id) REFERENCES public.interns(id) ON DELETE CASCADE;


--
-- Name: time_logs time_logs_task_id_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_logs
    ADD CONSTRAINT time_logs_task_id_tasks_id_fk FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;


--
-- Name: weekly_updates weekly_updates_intern_id_interns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_updates
    ADD CONSTRAINT weekly_updates_intern_id_interns_id_fk FOREIGN KEY (intern_id) REFERENCES public.interns(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict zHBmIBWuIroQYotheTZlrcA4YboJNQ8a4r4XtheycVALgvZ77rsOY8MRbawzV7t

