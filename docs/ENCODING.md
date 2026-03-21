# UTF-8 no projeto (Windows)

## Se os acentos quebrarem de novo

Na pasta **`frontend`**:

```bash
npm run fix-utf8:registro-modal
```

Isso reescreve `src/components/estudos/RegistroEstudoModal.tsx` em UTF-8 e corrige `?`, `` (U+FFFD) e mojibake comum.

## Por que volta a quebrar?

1. **Duas cópias do projeto** (ex.: Desktop + pasta `.cursor/projects/...`) — edite sempre **uma** pasta só.
2. **PowerShell** gravando arquivo sem UTF-8 — use `Set-Content -Encoding utf8` ou evite redirecionar texto para `.tsx`.
3. **Encoding automático** no editor — no Cursor/VS Code: status bar → UTF-8; este repo tem `.vscode/settings.json` com `files.encoding: utf8`.

## Configuração já incluída

- Raiz: `.editorconfig` (`charset = utf-8`), `.gitattributes` (LF em `.tsx`).
- `frontend/.vscode/settings.json` e raiz `.vscode/settings.json`.
