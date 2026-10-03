# Story 29.6 — Dependências e cronograma de editais

Publicação no Git autorizada pelo usuário em 2026-10-03: developer e merge para main. Gate QA: **CONCERNS**, não PASS. Nenhum deploy executado nesta operação.

Inclui quatro datas opcionais no cadastro/editor, calendário compartilhado, confirmação para cronograma publicado, atualização de caches e normalização de publicados com rascunho. Lockfile atualizado sem upgrades forçados.

Requer backend com migration `c8d9e0f1a2b4` antes de utilizar novos campos/endpoints. Aplicada somente no banco local com backup prévio; outros ambientes exigem procedimento separado.

Validação: 183 Vitest + 14 Node passed; lint/typecheck/tokens/build aprovados; smokes cronograma 1440/375/360 px e catálogo dois perfis/duas entradas aprovados com APIs simuladas.

Ressalvas: smoke integrado com login real pendente; audit runtime zero, audit completo nove high na árvore dev de braces (GHSA-vfj7-8cjw-p6xm, sem versão corrigida upstream em 2026-10-03). Não classificar como audit limpo; restringir tooling a padrões/registries confiáveis e acompanhar atualização/migração isolada. Teste do editor mantém aviso organizacional de 441 linhas.

Relatórios completos no workspace, fora deste repositório: docs/qa/assessments/29.6-gate-formal-20261003.md e docs/qa/gates/29.6-dependencias-cronograma-catalogo.yml. Backups e credenciais fora do commit.
