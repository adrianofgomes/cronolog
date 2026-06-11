#!/bin/bash

# Script de deploy unificado para HostGator (Back-end)
# Parâmetros:
#   $1: --full (opcional)
#   $2: --ftp (opcional, default é SSH)

set -e

# Carregar variáveis do .env se existir
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configurações
HOST="sh00102.hostgator.com.br"
USER=${SSH_USER:-"adri7808"}
PORT=${SSH_PORT:-22}
PASS=$FTP_PASS

MODE=$1
METHOD=$2

echo "🚀 Preparando pacote de deploy BACKEND (Modo ${MODE:-light})..."
./generate_deploy_package.sh $MODE

# Verificar se pacotes existem
if [ ! -d "./deploy_package/cronolog_core" ] || [ ! -d "./deploy_package/cronolog_public" ]; then
    echo "❌ Erro: Falha ao gerar pacote de deploy!"
    exit 1
fi

if [ "$METHOD" == "--ftp" ]; then
    echo "🚀 Iniciando deploy via FTP (lftp)..."
    # Lógica FTP original
    if [ -z "$PASS" ]; then
        echo "❌ Erro: Variável FTP_PASS não encontrada."
        exit 1
    fi
    if ! command -v lftp >/dev/null 2>&1; then sudo apt-get install -y lftp -qq; fi
    
    lftp <<EOF
set sftp:auto-confirm yes
open -u "$USER","$PASS" sftp://"$HOST":"$PORT"
mirror -R --exclude-glob .env* --exclude-glob logs/* ./deploy_package/cronolog_core/ "cronolog"
mirror -R --include-glob .env* --only-missing ./deploy_package/cronolog_core/ "cronolog"
mirror -R --exclude-glob .env* ./deploy_package/cronolog_public/ "public_html/cronolog/api"
quit
EOF
else
    echo "🚀 Iniciando deploy via SSH..."
    # Lógica SSH original
    if [ -z "$PASS" ]; then
        echo "❌ Erro: Variável FTP_PASS não encontrada."
        exit 1
    fi
    if ! command -v sshpass >/dev/null 2>&1; then sudo apt-get install -y sshpass -qq; fi
    export SSHPASS=$PASS
    
    cd deploy_package/cronolog_core && zip -r ../../core.zip . && cd ../..
    cd deploy_package/cronolog_public && zip -r ../../public.zip . && cd ../..
    
    sshpass -e scp -P $PORT core.zip public.zip $USER@$HOST:~/
    
    sshpass -e ssh -p $PORT $USER@$HOST <<EOF
        set -e
        mkdir -p "/home1/$USER/cronolog/logs"
        unzip -o ~/core.zip -d "/home1/$USER/cronolog" -x ".env*"
        unzip -n ~/core.zip ".env*" -d "/home1/$USER/cronolog"
        unzip -o ~/public.zip -d "/home1/$USER/public_html/cronolog/api"
        cd "/home1/$USER/cronolog" && \
            export $(grep -v '^#' .env | xargs) && \
            ./vendor/bin/phinx migrate -c phinx.php -e production
        rm ~/core.zip ~/public.zip
EOF
    rm core.zip public.zip
fi

echo "✅ Deploy BACKEND concluído com sucesso!"
