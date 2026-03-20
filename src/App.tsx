import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { Layout } from "./components/layout/Layout";
import { Login } from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";
import { Dashboard } from "./pages/Dashboard";
import { Concursos } from "./pages/Concursos";
import { Disciplinas } from "./pages/Disciplinas";
import { Cronograma } from "./pages/Cronograma";
import { Pomodoro } from "./pages/Pomodoro";
import { Questoes } from "./pages/Questoes";
import { Simulados } from "./pages/Simulados";
import { Avisos } from "./pages/Avisos";
import { Flashcards } from "./pages/Flashcards";
import { Materiais } from "./pages/Materiais";
import { PlanosPage } from "./pages/Planos";
import { PlanoDetalhePage } from "./pages/PlanoDetalhe";

export default function App() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthed = Boolean(accessToken);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <Layout requireAuth={!isAuthed}>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/concursos"
        element={
          <Layout requireAuth={!isAuthed}>
            <Concursos />
          </Layout>
        }
      />
      <Route
        path="/concursos/planos"
        element={
          <Layout requireAuth={!isAuthed}>
            <PlanosPage />
          </Layout>
        }
      />
      <Route
        path="/concursos/planos/:id"
        element={
          <Layout requireAuth={!isAuthed}>
            <PlanoDetalhePage />
          </Layout>
        }
      />
      <Route
        path="/disciplinas"
        element={
          <Layout requireAuth={!isAuthed}>
            <Disciplinas />
          </Layout>
        }
      />
      <Route
        path="/cronograma"
        element={
          <Layout requireAuth={!isAuthed}>
            <Cronograma />
          </Layout>
        }
      />
      <Route
        path="/pomodoro"
        element={
          <Layout requireAuth={!isAuthed}>
            <Pomodoro />
          </Layout>
        }
      />
      <Route
        path="/questoes"
        element={
          <Layout requireAuth={!isAuthed}>
            <Questoes />
          </Layout>
        }
      />
      <Route
        path="/simulados"
        element={
          <Layout requireAuth={!isAuthed}>
            <Simulados />
          </Layout>
        }
      />
      <Route
        path="/avisos"
        element={
          <Layout requireAuth={!isAuthed}>
            <Avisos />
          </Layout>
        }
      />
      <Route
        path="/flashcards"
        element={
          <Layout requireAuth={!isAuthed}>
            <Flashcards />
          </Layout>
        }
      />
      <Route
        path="/materiais"
        element={
          <Layout requireAuth={!isAuthed}>
            <Materiais />
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

