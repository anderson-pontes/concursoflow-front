# Story 29.8 — Salvamento incremental do catálogo

Commit, push para developer e merge para main autorizados em 2026-10-04 após QA formal PASS. Sem deploy operacional nesta autorização.

Mantido Salvar rascunho, sem autosave. Ledger por entidade/ramo envia PATCH pequeno, não árvore integral; metadados limpos não geram PUT e ACK confirma IDs/revisão/cache sem GET integral obrigatório. Erros, refetch e conflito 409 preservam texto local; sem fallback automático ao PUT ou merge cego. Importação exige salvar alterações locais antes de prosseguir.

Requer backend da 29.8 com PATCH e migration d9e0f1a2b3c5 aplicada. Não lançar este frontend isoladamente contra backend antigo. Em implantação futura: backup/preflight → migration → backend → frontend. A migration foi aplicada somente no banco local, sem backup por autorização do usuário; produção permanece inalterada.

QA: 210 Vitest + 14 Node, lint/tokens/typecheck/build PASS; guard de refetch, retry com mesma mutation e conflito validados. Smoke autenticado com API/JWT/PostgreSQL reais confirmou reuso, save/reload, IDs independentes, duplicidade, edição/remoção isoladas e lista longa em seis viewports. O helper 29.7 aguarda PATCH em vez do PUT anterior, sem retirar asserts.

Benchmark QA: 25/165/2180 e 30/200/3000, uma requisição de 300/299 bytes; clique 166/113 ms versus 870/1269 ms da baseline. Salvar limpo produz zero requests. Sem alegação SLA/P95/O(1) absoluta; GET inicial permanece integral e irmãos do pai afetado são consultados. Refetch real e 409 mantiveram a edição local.

CodeRabbit externo não autorizado; revisão manual local e QA formal. Observação baixa: arquivo de testes do editor com 478 linhas; decomposição futura sem ocultar aviso. Audit runtime pré-push: zero vulnerabilidades. Não houve atualização de dependências nesta story.

Gate/relatório completos na raiz do workspace: docs/qa/gates/29.8-rascunho-incremental.yml e docs/qa/assessments/29.8-gate-formal-20261004.md. Scripts QA não devem operar em produção. Scripts locais 29.6 e artefatos com credenciais/prints não integram o commit.
