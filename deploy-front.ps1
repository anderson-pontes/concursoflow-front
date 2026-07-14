# deploy-front.ps1
# Builda o frontend localmente e envia o dist/ pronto para o servidor.
# Ajuste SEU_IP e o usuario SSH antes de usar.

$ErrorActionPreference = "Stop"
$SERVIDOR = "root@192.241.146.196"
$CAMINHO_REMOTO = "/opt/aprovingo/concursoflow-front"

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "   BUILD LOCAL DO FRONTEND - APROVINGO            " -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

Write-Host "`n[1/4] Instalando dependencias..." -ForegroundColor Green
npm ci

Write-Host "`n[2/4] Gerando build de producao..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no build. Deploy abortado." -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/4] Compactando dist/..." -ForegroundColor Green
if (Test-Path dist.tar.gz) { Remove-Item dist.tar.gz }
tar -czf dist.tar.gz -C dist .

Write-Host "`n[4/4] Enviando e instalando no servidor..." -ForegroundColor Green

# Remove o dist antigo e recria vazio
ssh $SERVIDOR "rm -rf $CAMINHO_REMOTO/dist && mkdir -p $CAMINHO_REMOTO/dist"

# Envia o pacote
scp dist.tar.gz "${SERVIDOR}:${CAMINHO_REMOTO}/"

# Extrai, ajusta permissoes e limpa
ssh $SERVIDOR "tar -xzf $CAMINHO_REMOTO/dist.tar.gz -C $CAMINHO_REMOTO/dist && rm $CAMINHO_REMOTO/dist.tar.gz && chown -R www-data:www-data $CAMINHO_REMOTO/dist && chmod -R 755 $CAMINHO_REMOTO/dist && systemctl reload nginx"

# Limpeza local
Remove-Item dist.tar.gz

Write-Host "`n=================================================="  -ForegroundColor Yellow
Write-Host "  FRONTEND ENVIADO E NGINX RECARREGADO!           " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "`nAgora rode o deploy.sh no servidor para atualizar o backend."
