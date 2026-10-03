# Story 29.7 — Reaproveitamento de matérias entre cargos

Commit, push para developer e merge para main autorizados pelo usuário em 2026-10-03. QA formal: PASS. Nenhum deploy operacional incluído nesta autorização.

Editor administrativo permite selecionar matérias de outro cargo do mesmo concurso/versão, selecionar/desmarcar todas, copiar somente matérias ou incluir conteúdo programático. Duplicatas são explicadas e bloqueadas. IDs novos garantem edição/remoção independente da origem; cadastro manual preservado.

As cópias entram imediatamente no rascunho e são persistidas pelo botão principal Salvar rascunho. Sem autosave parcial, endpoint novo ou alteração de schema. Dialog/Select/Checkbox existentes, tokens da paleta e layout responsivo reutilizados.

Validação: 196 Vitest + 14 Node PASS; lint/tokens/typecheck/build PASS. Smoke autenticado real com API/PostgreSQL descartável em 1440/375/360px: salvar/reabrir, duplicatas, edição/remoção e cópia sem conteúdo aprovados. Scripts e testes novos incluídos; credenciais/backups/prints locais não incluídos.

Audit de runtime refeito antes do push: zero vulnerabilidades. A dívida de tooling dev da 29.6 não foi resolvida nesta story. CodeRabbit indisponível; fallback manual aprovado no QA. Aviso preexistente do teste do editor com 441 linhas preservado.

Harness do smoke: scripts/qa-29-7-authenticated.mjs, acionado pelo scripts/qa_29_7_authenticated.py do backend em ambiente local isolado; não executá-lo contra produção. Gate/relatório completos na raiz do workspace: docs/qa/gates/29.7-reaproveitamento-materias-cargos.yml e docs/qa/assessments/29.7-gate-formal-20261003.md.

Nenhuma migration nova da 29.7. Em ambientes ainda anteriores à 29.6, continua necessária a c8d9e0f1a2b4 antes de iniciar o backend daquela versão. Scripts locais não rastreados da 29.6 preservados fora deste commit.
