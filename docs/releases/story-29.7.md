# Story 29.7 — Reaproveitamento de matérias entre cargos

Commit, push para developer e merge para main autorizados pelo usuário em 2026-10-03. QA formal: PASS. Nenhum deploy operacional incluído nesta autorização.

Editor administrativo permite selecionar matérias de outro cargo do mesmo concurso/versão, selecionar/desmarcar todas, copiar somente matérias ou incluir conteúdo programático. Duplicatas são explicadas e bloqueadas. IDs novos garantem edição/remoção independente da origem; cadastro manual preservado.

As cópias entram imediatamente no rascunho e são persistidas pelo botão principal Salvar rascunho. Sem autosave parcial, endpoint novo ou alteração de schema. Dialog/Select/Checkbox existentes, tokens da paleta e layout responsivo reutilizados.

Validação: 196 Vitest + 14 Node PASS; lint/tokens/typecheck/build PASS. Smoke autenticado real com API/PostgreSQL descartável em 1440/375/360px: salvar/reabrir, duplicatas, edição/remoção e cópia sem conteúdo aprovados. Scripts e testes novos incluídos; credenciais/backups/prints locais não incluídos.

Audit de runtime refeito antes do push: zero vulnerabilidades. A dívida de tooling dev da 29.6 não foi resolvida nesta story. CodeRabbit indisponível; fallback manual aprovado no QA. Aviso preexistente do teste do editor com 441 linhas preservado.

Harness do smoke: scripts/qa-29-7-authenticated.mjs, acionado pelo scripts/qa_29_7_authenticated.py do backend em ambiente local isolado; não executá-lo contra produção. Gate/relatório completos na raiz do workspace: docs/qa/gates/29.7-reaproveitamento-materias-cargos.yml e docs/qa/assessments/29.7-gate-formal-20261003.md.

Nenhuma migration nova da 29.7. Em ambientes ainda anteriores à 29.6, continua necessária a c8d9e0f1a2b4 antes de iniciar o backend daquela versão. Scripts locais não rastreados da 29.6 preservados fora deste commit.

## Complemento — modal de seleção de matérias

Commit, push para developer e merge para main do complemento autorizados pelo usuário após o gate formal PASS. A correção elimina a sobreposição provocada pela caixa intrínseca do fieldset: cabeçalho e footer não encolhem, somente a lista usa min-h-0/flex-1/overflow-y-auto. Dialog limitado a 90dvh, controles compactados e botões com alvo mínimo de 44px. Sem alteração de regra de negócio, backend, API, dependências ou migration.

QA reproduzido: 197 Vitest + 14 Node; lint/tokens/typecheck/build PASS. Smoke com login/JWT, API e PostgreSQL descartável reais: 40 matérias/572 tópicos, contador de 38 selecionadas, último card acessível e scroll único em 1440×900, 1280×600, 375×812, 375×667, 360×640 e 900×500. Zero bancos QA residuais após cleanup. Cenários de importação/save/reload/duplicatas/cancelamento/isolamento preservados.

Gate e relatório locais: docs/qa/gates/29.7-modal-materias-scroll.yml e docs/qa/assessments/29.7-modal-scroll-gate-formal-20261003.md na raiz do workspace. Story Done, versão documental 0.1.6. CodeRabbit externo bloqueado por exposição do diff privado; revisão manual local registrada, sem contorno. DEP-296-001 e aviso preexistente de 441 linhas continuam separados.

Esta publicação contém apenas frontend; scripts locais da 29.6 e artefatos com credenciais/prints não fazem parte do commit. Não inclui tag, release operacional, deploy ou modificação de banco/produção.
