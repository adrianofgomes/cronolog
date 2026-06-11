#!/bin/bash

# Script de deploy unificado para HostGator (Front-end)
# Parâmetros:
#   $1: --full (opcional)
#   $2: --ftp (opcional, default é SSH)

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
PASS=$FTP_PASS

MODE=$1
METHOD=$2

echo "🚀 Preparando pacote de deploy FRONTEND (Modo ${MODE:-light})..."
./generate_deploy_package.sh $MODE

# Verificar se pacote existe
if [ ! -d "./deploy_package" ]; then
    echo "❌ Erro: Falha ao gerar pacote de deploy!"
    exit 1
fi

if [ "$METHOD" == "--ftp" ]; then
    echo "🚀 Iniciando deploy via FTP (lftp)..."
    if [ -z "$PASS" ]; then
        echo "❌ Erro: Variável FTP_PASS não encontrada."
        exit 1
    fi
    if ! command -v lftp >/dev/null 2>&1; then sudo apt-get install -y lftp -qq; fi
    
    lftp <<EOF
set sftp:auto-confirm yes
open -u "$USER","$PASS" sftp://"$HOST":"$PORT"
mirror -R --delete --exclude-glob .env* --exclude api/ ./deploy_package/ "public_html/cronolog"
mirror -R --include-glob .env* --only-missing ./deploy_package/ "public_html/cronolog"
quit
EOF
else
    echo "🚀 Iniciando deploy via SSH..."
    if [ -z "$PASS" ]; then
        echo "❌ Erro: Variável FTP_PASS não encontrada."
        exit 1
    fi
    if ! command -v sshpass >/dev/null 2>&1; then sudo apt-get install -y sshpass -qq; fi
    export SSHPASS=$PASS
    
    cd deploy_package && zip -r ../frontend.zip . && cd ..
    
    sshpass -e scp -P $PORT frontend.zip $USER@$HOST:~/
    
    sshpass -e ssh -p $PORT $USER@$HOST <<EOF
        set -e
        # Limpa frontend antigo exceto api
        # Assumindo que a estrutura foi mantida
        find "/home1/$USER/public_html/cronolog" -maxdepth 1 -not -name 'api' -not -name 'cronolog' -not -name '.' -exec rm -rf {} +
        
        unzip -o ~/frontend.zip -d "/home1/$USER/public_html/cronolog"
        rm ~/frontend.zip
EOF
    rm frontend.zip
fi

echo "✅ Deploy FRONTEND concluído com sucesso!"
