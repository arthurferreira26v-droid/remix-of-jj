CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_team_budgets_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_team_budgets_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: championships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.championships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    season text NOT NULL,
    current_round integer DEFAULT 1 NOT NULL,
    total_rounds integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid
);


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    championship_id uuid NOT NULL,
    round integer NOT NULL,
    home_team_id text NOT NULL,
    home_team_name text NOT NULL,
    home_team_logo text NOT NULL,
    away_team_id text NOT NULL,
    away_team_name text NOT NULL,
    away_team_logo text NOT NULL,
    home_score integer,
    away_score integer,
    is_played boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: standings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.standings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    championship_id uuid NOT NULL,
    team_id text NOT NULL,
    team_name text NOT NULL,
    logo text NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    played integer DEFAULT 0 NOT NULL,
    wins integer DEFAULT 0 NOT NULL,
    draws integer DEFAULT 0 NOT NULL,
    losses integer DEFAULT 0 NOT NULL,
    goals_for integer DEFAULT 0 NOT NULL,
    goals_against integer DEFAULT 0 NOT NULL,
    goal_difference integer DEFAULT 0 NOT NULL,
    "position" integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: team_budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_budgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    championship_id uuid NOT NULL,
    team_id text NOT NULL,
    team_name text NOT NULL,
    budget bigint DEFAULT 5000000 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid
);


--
-- Name: championships championships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.championships
    ADD CONSTRAINT championships_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: standings standings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_pkey PRIMARY KEY (id);


--
-- Name: team_budgets team_budgets_championship_id_team_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_budgets
    ADD CONSTRAINT team_budgets_championship_id_team_id_key UNIQUE (championship_id, team_id);


--
-- Name: team_budgets team_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_budgets
    ADD CONSTRAINT team_budgets_pkey PRIMARY KEY (id);


--
-- Name: idx_matches_championship; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_championship ON public.matches USING btree (championship_id);


--
-- Name: idx_matches_is_played; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_is_played ON public.matches USING btree (is_played);


--
-- Name: idx_matches_round; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_round ON public.matches USING btree (round);


--
-- Name: idx_standings_championship; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_standings_championship ON public.standings USING btree (championship_id);


--
-- Name: idx_standings_points; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_standings_points ON public.standings USING btree (points DESC);


--
-- Name: team_budgets update_team_budgets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_team_budgets_updated_at BEFORE UPDATE ON public.team_budgets FOR EACH ROW EXECUTE FUNCTION public.update_team_budgets_updated_at();


--
-- Name: matches matches_championship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_championship_id_fkey FOREIGN KEY (championship_id) REFERENCES public.championships(id) ON DELETE CASCADE;


--
-- Name: standings standings_championship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_championship_id_fkey FOREIGN KEY (championship_id) REFERENCES public.championships(id) ON DELETE CASCADE;


--
-- Name: team_budgets team_budgets_championship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_budgets
    ADD CONSTRAINT team_budgets_championship_id_fkey FOREIGN KEY (championship_id) REFERENCES public.championships(id) ON DELETE CASCADE;


--
-- Name: championships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;

--
-- Name: championships championships_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY championships_delete_own ON public.championships FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: championships championships_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY championships_insert_own ON public.championships FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: championships championships_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY championships_select_own ON public.championships FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: championships championships_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY championships_update_own ON public.championships FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: matches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

--
-- Name: matches matches_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY matches_delete_own ON public.matches FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = matches.championship_id) AND (c.user_id = auth.uid())))));


--
-- Name: matches matches_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY matches_insert_own ON public.matches FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = matches.championship_id) AND (c.user_id = auth.uid())))));


--
-- Name: matches matches_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY matches_select_own ON public.matches FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = matches.championship_id) AND (c.user_id = auth.uid())))));


--
-- Name: matches matches_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY matches_update_own ON public.matches FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = matches.championship_id) AND (c.user_id = auth.uid())))));


--
-- Name: standings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;

--
-- Name: standings standings_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY standings_delete_own ON public.standings FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = standings.championship_id) AND (c.user_id = auth.uid())))));


--
-- Name: standings standings_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY standings_insert_own ON public.standings FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = standings.championship_id) AND (c.user_id = auth.uid())))));


--
-- Name: standings standings_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY standings_select_own ON public.standings FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = standings.championship_id) AND (c.user_id = auth.uid())))));


--
-- Name: standings standings_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY standings_update_own ON public.standings FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = standings.championship_id) AND (c.user_id = auth.uid())))));


--
-- Name: team_budgets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_budgets ENABLE ROW LEVEL SECURITY;

--
-- Name: team_budgets team_budgets_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_budgets_delete_own ON public.team_budgets FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: team_budgets team_budgets_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_budgets_insert_own ON public.team_budgets FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: team_budgets team_budgets_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_budgets_select_own ON public.team_budgets FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: team_budgets team_budgets_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_budgets_update_own ON public.team_budgets FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- PostgreSQL database dump complete
--




COMMIT;