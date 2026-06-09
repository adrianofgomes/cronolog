#!/bin/bash

# Script de deploy do frontend para HostGator

# Faz o script parar se qualquer comando falhar
set -e

# Carregar variáveis do .env (tenta no diretório local, depois no root)
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
elif [ -f ../.env ]; then
    export $(grep -v '^#' ../.env | xargs)
fi

# Configurações
HOST=${FTP_HOST:-"69.6.212.64"}
USER=${FTP_USER:-"adri7808"}
PORT=${SSH_PORT:-22}

# Caminho remoto unificado sob a pasta do projeto
REMOTE_PUBLIC="public_html/cronolog"

MODE="light"
if [ "$1" == "--full" ]; then
    MODE="full"
fi

echo "🚀 Preparando pacote de deploy FRONTEND (Modo $MODE)..."
chmod +x ./generate_deploy_package.sh
./generate_deploy_package.sh $1

# Verificar se pacote existe
if [ ! -d "./deploy_package" ]; then
    echo "❌ Erro: Falha ao gerar pacote de deploy!"
    exit 1
fi

if [ -z "$FTP_PASS" ]; then
    echo "❌ Erro: Variável FTP_PASS não encontrada. Certifique-se de que ela está definida no arquivo .env."
    exit 1
fi

if ! command -v lftp >/dev/null 2>&1; then
    echo "📦 lftp não encontrado. Instalando no Cloud Shell..."
    sudo apt-get update -qq && sudo apt-get install -y lftp -qq
fi

echo "🚀 Iniciando sincronização via SFTP (lftp) usando senha..."

lftp <<EOF
set sftp:auto-confirm yes
open -u "$USER","$FTP_PASS" sftp://"$HOST":"$PORT"

echo "  🔹 Sincronizando Frontend (public_html)..."
# Cria a pasta remota se não existir
mkdir -p "$REMOTE_PUBLIC" || true

# Sincroniza o conteúdo. 
# IMPORTANTE: Excluímos 'api/' para não apagar o backend que reside na subpasta.
mirror -R --delete --exclude ^\.env --exclude api/ ./deploy_package/ "$REMOTE_PUBLIC"
# Garante que arquivos .env* remotos não sejam sobrescritos
mirror -R --include ^\.env --ignore-existing ./deploy_package/ "$REMOTE_PUBLIC"

quit
EOF

echo "✅ Deploy do frontend concluído com sucesso!"
