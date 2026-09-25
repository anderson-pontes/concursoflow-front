import React, { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  matchPath,
  MemoryRouter,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

vi.mock("@/components/layout/Layout", async () => {
  const ReactModule = await vi.importActual<typeof import("react")>("react");
  const { Navigate } = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    Layout: ({ children, requireAuth }: { children: React.ReactNode; requireAuth?: boolean }) =>
      requireAuth
        ? ReactModule.createElement(Navigate, { to: "/login", replace: true })
        : ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

vi.mock("@/pages/Landing", () => ({ LandingPage: () => <div>page:landing</div> }));
vi.mock("@/pages/Auth/Login", () => ({ Login: () => <div>page:login</div> }));
vi.mock("@/pages/Auth/Register", () => ({ Register: () => <div>page:register</div> }));
vi.mock("@/pages/Auth/ResetPassword", () => ({ ResetPassword: () => <div>page:reset-password</div> }));
vi.mock("@/pages/Assinatura/CheckoutSucesso", () => ({ CheckoutSucesso: () => <div>page:checkout-success</div> }));
vi.mock("@/pages/Assinatura/CheckoutCancelado", () => ({ CheckoutCancelado: () => <div>page:checkout-cancelled</div> }));
vi.mock("@/pages/Dashboard", () => ({ Dashboard: () => <div>page:dashboard</div> }));
vi.mock("@/pages/Concursos", () => ({ Concursos: () => <div>page:concursos</div> }));
vi.mock("@/pages/Disciplinas", () => ({ Disciplinas: () => <div>page:disciplinas</div> }));
vi.mock("@/pages/DisciplinaDashboard", () => ({ DisciplinaDashboard: () => <div>page:disciplina</div> }));
vi.mock("@/pages/Cronograma", () => ({ Cronograma: () => <div>page:cronograma</div> }));
vi.mock("@/pages/CalendarioEstudos", () => ({ CalendarioEstudos: () => <div>page:calendario</div> }));
vi.mock("@/pages/HistoricoEstudos", () => ({ HistoricoEstudos: () => <div>page:historico</div> }));
vi.mock("@/pages/Revisoes", () => ({ Revisoes: () => <div>page:revisoes</div> }));
vi.mock("@/pages/Pomodoro", () => ({ Pomodoro: () => <div>page:pomodoro</div> }));
vi.mock("@/pages/Avisos", () => ({ Avisos: () => <div>page:avisos</div> }));
vi.mock("@/pages/Flashcards", () => ({ Flashcards: () => <div>page:flashcards</div> }));
vi.mock("@/pages/MentalMaps", () => ({ MentalMaps: () => <div>page:mapas</div> }));
vi.mock("@/pages/AdminEstudos", () => ({ AdminEstudos: () => <div>page:configuracoes-estudos</div> }));
vi.mock("@/pages/admin/GestaoUsuarios", () => ({ GestaoUsuarios: () => <div>page:admin-usuarios</div> }));
vi.mock("@/pages/admin/UsuarioDetalhe", () => ({ UsuarioDetalhe: () => <div>page:admin-usuario</div> }));
vi.mock("@/pages/admin/EditaisCatalogo", () => ({ EditaisCatalogo: () => <div>page:admin-editais</div> }));
vi.mock("@/pages/admin/EditalCatalogoEditor", () => ({ EditalCatalogoEditor: () => <div>page:admin-edital</div> }));
vi.mock("@/pages/PlanoGuiado", () => ({ PlanoGuiado: () => <div>page:plano-guiado</div> }));
vi.mock("@/pages/AtivarEditalCatalogo", () => ({ AtivarEditalCatalogo: () => <div>page:ativar-edital</div> }));
vi.mock("@/pages/ReplanejarPlano", () => ({ ReplanejarPlano: () => <div>page:replanejar</div> }));
vi.mock("@/pages/Perfil", () => ({ Perfil: () => <div>page:perfil</div> }));

const baseUser: AuthUser = {
  id: "user-1",
  name: "Usuário",
  email: "usuario@example.test",
  avatar_url: null,
  daily_goal_hours: 2,
  role: "user",
  status: "ativo",
  created_at: "2026-09-23T12:00:00Z",
  cpf: null,
  phone: null,
  birth_date: null,
  address_cep: null,
  address_street: null,
  address_number: null,
  address_complement: null,
  address_neighborhood: null,
  address_city: null,
  address_state: null,
};

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {JSON.stringify({ pathname: location.pathname, search: location.search, state: location.state })}
    </output>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(-1)}>Voltar</button>;
}

function renderApp(initialEntries: string[] = ["/"], initialIndex = initialEntries.length - 1) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <BackButton />
      <LocationProbe />
      <Suspense fallback={<div>loading</div>}>
        <App />
      </Suspense>
    </MemoryRouter>,
  );
}

function expectLocation(pathname: string, search = "") {
  return waitFor(() => {
    expect(screen.getByTestId("location")).toHaveTextContent(`"pathname":"${pathname}"`);
    expect(screen.getByTestId("location")).toHaveTextContent(`"search":"${search}"`);
  });
}

describe("contrato de rotas da aplicação", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
  });

  it("mantém as rotas públicas acessíveis para visitante", async () => {
    renderApp(["/register"]);

    expect(await screen.findByText("page:register")).toBeInTheDocument();
    await expectLocation("/register");
  });

  it("redireciona visitante para login com replace nas rotas protegidas", async () => {
    const user = userEvent.setup();
    renderApp(["/register", "/cronograma"]);

    expect(await screen.findByText("page:login")).toBeInTheDocument();
    await expectLocation("/login");

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    await expectLocation("/register");
  });

  it("preserva o acesso autenticado às rotas protegidas", async () => {
    useAuthStore.setState({ accessToken: "token-user", user: baseUser });
    renderApp(["/cronograma"]);

    expect(await screen.findByText("page:cronograma")).toBeInTheDocument();
    await expectLocation("/cronograma");
  });

  it("impede usuário comum e permite administrador nas rotas administrativas", async () => {
    useAuthStore.setState({ accessToken: "token-user", user: baseUser });
    const firstRender = renderApp(["/admin/editais/edital-7"]);

    expect(await screen.findByText("page:dashboard")).toBeInTheDocument();
    await expectLocation("/dashboard");
    firstRender.unmount();

    useAuthStore.setState({ accessToken: "token-admin", user: { ...baseUser, role: "admin" } });
    renderApp(["/admin/editais/edital-7"]);

    expect(await screen.findByText("page:admin-edital")).toBeInTheDocument();
    await expectLocation("/admin/editais/edital-7");
  });

  it.each([
    ["/concursos/planos", "/concursos", ""],
    ["/concursos/planos/plano-1", "/concursos", ""],
    ["/concursos/adicionar", "/planos/novo", "?origem=catalogo"],
    ["/admin/estudos", "/configuracoes/estudos", ""],
  ])("preserva o redirect legado de %s", async (source, target, search) => {
    useAuthStore.setState({ accessToken: "token-user", user: baseUser });
    renderApp([source]);

    await expectLocation(target, search);
  });

  it.each([
    [false, "/"],
    [true, "/dashboard"],
  ])("mantém o fallback global para sessão autenticada=%s", async (authenticated, target) => {
    if (authenticated) useAuthStore.setState({ accessToken: "token-user", user: baseUser });
    renderApp(["/rota-inexistente"]);

    await expectLocation(target);
  });
});

function RouterApiHarness() {
  const { concursoId } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <>
      <output data-testid="router-api">
        {JSON.stringify({ concursoId, search: searchParams.toString(), state: location.state })}
      </output>
      <NavLink to={`/planos/${concursoId}`} end>Plano</NavLink>
      <button type="button" onClick={() => setSearchParams({ grupo: "hoje" }, { replace: true })}>
        Canonicalizar
      </button>
    </>
  );
}

describe("contrato das APIs declarativas utilizadas", () => {
  it("preserva params, query, location.state, NavLink end e replace de search params", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/planos/concurso-7",
            search: "?grupo=atrasadas",
            state: { returnTo: "/revisoes" },
          },
        ]}
      >
        <Routes>
          <Route path="/planos/:concursoId" element={<><RouterApiHarness /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("router-api")).toHaveTextContent("concurso-7");
    expect(screen.getByTestId("router-api")).toHaveTextContent("grupo=atrasadas");
    expect(screen.getByTestId("router-api")).toHaveTextContent("/revisoes");
    expect(screen.getByRole("link", { name: "Plano" })).toHaveAttribute("aria-current", "page");
    expect(matchPath({ path: "/planos/:concursoId", end: true }, "/planos/concurso-7")?.params.concursoId).toBe("concurso-7");

    await user.click(screen.getByRole("button", { name: "Canonicalizar" }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("?grupo=hoje"));
  });
});
