import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { Layout } from "./components/layout/Layout";
import { Login } from "./pages/Auth/Login";
import { Dashboard } from "./pages/Dashboard";
import { Concursos } from "./pages/Concursos";
import { Disciplinas } from "./pages/Disciplinas";
import { AdminRoute } from "./components/layout/AdminRoute";

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8" role="status" aria-live="polite">
      <span className="text-sm text-muted-foreground">Carregando…</span>
    </div>
  );
}

function lazyNamed<T extends Record<string, React.ComponentType<object>>>(
  loader: () => Promise<T>,
  exportName: keyof T,
) {
  return React.lazy(() => loader().then((m) => ({ default: m[exportName] as React.ComponentType<object> })));
}

const DisciplinaDashboard = lazyNamed(() => import("./pages/DisciplinaDashboard"), "DisciplinaDashboard");
const Register = lazyNamed(() => import("./pages/Auth/Register"), "Register");
const ResetPassword = lazyNamed(() => import("./pages/Auth/ResetPassword"), "ResetPassword");
const CheckoutSucesso = lazyNamed(() => import("./pages/Assinatura/CheckoutSucesso"), "CheckoutSucesso");
const CheckoutCancelado = lazyNamed(
  () => import("./pages/Assinatura/CheckoutCancelado"),
  "CheckoutCancelado",
);
const Cronograma = lazyNamed(() => import("./pages/Cronograma"), "Cronograma");
const CalendarioEstudos = lazyNamed(() => import("./pages/CalendarioEstudos"), "CalendarioEstudos");
const HistoricoEstudos = lazyNamed(() => import("./pages/HistoricoEstudos"), "HistoricoEstudos");
const Pomodoro = lazyNamed(() => import("./pages/Pomodoro"), "Pomodoro");
const Avisos = lazyNamed(() => import("./pages/Avisos"), "Avisos");
const Flashcards = lazyNamed(() => import("./pages/Flashcards"), "Flashcards");
const AdminEstudos = lazyNamed(() => import("./pages/AdminEstudos"), "AdminEstudos");
const GestaoUsuarios = lazyNamed(() => import("./pages/admin/GestaoUsuarios"), "GestaoUsuarios");
const UsuarioDetalhe = lazyNamed(() => import("./pages/admin/UsuarioDetalhe"), "UsuarioDetalhe");
const Perfil = lazyNamed(() => import("./pages/Perfil"), "Perfil");

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthed = Boolean(accessToken);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/register"
        element={
          <LazyPage>
            <Register />
          </LazyPage>
        }
      />
      <Route
        path="/reset-password"
        element={
          <LazyPage>
            <ResetPassword />
          </LazyPage>
        }
      />
      <Route
        path="/assinatura/sucesso"
        element={
          <LazyPage>
            <CheckoutSucesso />
          </LazyPage>
        }
      />
      <Route
        path="/assinatura/cancelado"
        element={
          <LazyPage>
            <CheckoutCancelado />
          </LazyPage>
        }
      />

      <Route
        path="/dashboard"
        element={
          <Layout requireAuth={!isAuthed}>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/perfil"
        element={
          <Layout requireAuth={!isAuthed}>
            <LazyPage>
              <Perfil />
            </LazyPage>
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
      <Route path="/concursos/planos" element={<Navigate to="/concursos" replace />} />
      <Route path="/concursos/planos/:id" element={<Navigate to="/concursos" replace />} />
      <Route
        path="/disciplinas/:disciplinaId"
        element={
          <Layout requireAuth={!isAuthed}>
            <LazyPage>
              <DisciplinaDashboard />
            </LazyPage>
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
            <LazyPage>
              <Cronograma />
            </LazyPage>
          </Layout>
        }
      />
      <Route
        path="/estudos/calendario"
        element={
          <Layout requireAuth={!isAuthed}>
            <LazyPage>
              <CalendarioEstudos />
            </LazyPage>
          </Layout>
        }
      />
      <Route
        path="/estudos/historico"
        element={
          <Layout requireAuth={!isAuthed}>
            <LazyPage>
              <HistoricoEstudos />
            </LazyPage>
          </Layout>
        }
      />
      <Route
        path="/pomodoro"
        element={
          <Layout requireAuth={!isAuthed}>
            <LazyPage>
              <Pomodoro />
            </LazyPage>
          </Layout>
        }
      />
      <Route
        path="/avisos"
        element={
          <Layout requireAuth={!isAuthed}>
            <LazyPage>
              <Avisos />
            </LazyPage>
          </Layout>
        }
      />
      <Route
        path="/flashcards"
        element={
          <Layout requireAuth={!isAuthed}>
            <LazyPage>
              <Flashcards />
            </LazyPage>
          </Layout>
        }
      />
      <Route
        path="/configuracoes/estudos"
        element={
          <Layout requireAuth={!isAuthed}>
            <LazyPage>
              <AdminEstudos />
            </LazyPage>
          </Layout>
        }
      />
      <Route path="/admin/estudos" element={<Navigate to="/configuracoes/estudos" replace />} />
      <Route
        path="/admin/usuarios"
        element={
          <Layout requireAuth={!isAuthed}>
            <AdminRoute>
              <LazyPage>
                <GestaoUsuarios />
              </LazyPage>
            </AdminRoute>
          </Layout>
        }
      />
      <Route
        path="/admin/usuarios/:id"
        element={
          <Layout requireAuth={!isAuthed}>
            <AdminRoute>
              <LazyPage>
                <UsuarioDetalhe />
              </LazyPage>
            </AdminRoute>
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
