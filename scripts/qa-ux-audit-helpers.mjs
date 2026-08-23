export function isAdminRoute(route) {
  return route.startsWith("/admin/");
}

export function validateRouteAudit({
  route,
  pathname,
  h1Count,
  horizontalOverflow,
  unnamedControls,
  errorBoundary,
  pageErrors = [],
  consoleErrors = [],
}) {
  const failures = [];

  if (pathname !== route) failures.push(`Rota final inesperada: ${pathname}`);
  if (h1Count !== 1) failures.push(`Quantidade de h1 no main: ${h1Count}`);
  if (horizontalOverflow) failures.push("Overflow horizontal detectado");
  if (unnamedControls > 0) failures.push(`${unnamedControls} controle(s) sem nome acessível`);
  if (errorBoundary) failures.push("ErrorBoundary exibido");
  if (pageErrors.length) failures.push(`${pageErrors.length} erro(s) de página`);
  if (consoleErrors.length) failures.push(`${consoleErrors.length} erro(s) no console`);

  return failures;
}

export function auditPassed(results, configurationErrors = []) {
  return configurationErrors.length === 0 && results.every((item) => item.failures.length === 0);
}
