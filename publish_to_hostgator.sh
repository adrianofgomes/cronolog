#!/bin/bash

# Faz o script parar se qualquer comando falhar
set -e

# Carregar variáveis do .env se existir
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configurações
HOST=${FTP_HOST:-"69.6.212.64"}
USER=${FTP_USER:-"adri7808"}
PORT=${SSH_PORT:-22}

# Caminhos remotos (relativos ao home do usuário)
REMOTE_CORE="php_template"
REMOTE_PUBLIC="public_html/php_template"

MODE="light"
if [ "$1" == "--full" ]; then
    MODE="full"
fi

echo "🚀 Preparando pacote de deploy (Modo $MODE)..."
./generate_deploy_package.sh $1

# Verificar se pacotes existem
if [ ! -d "./deploy_package/php_template_core" ] || [ ! -d "./deploy_package/php_template_public" ]; then
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

echo "  🔹 Sincronizando Core (php_template)..."
mirror -R ./deploy_package/php_template_core/ "$REMOTE_CORE"

echo "  🔹 Sincronizando Public (public_html/php_template)..."
mirror -R ./deploy_package/php_template_public/ "$REMOTE_PUBLIC"
quit
EOF

echo "✅ Deploy concluído com sucesso!"