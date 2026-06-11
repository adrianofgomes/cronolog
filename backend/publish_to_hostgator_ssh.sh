#!/bin/bash

# Script de Deploy via SSH para HostGator (sh00102.hostgator.com.br)
# Este script gera arquivos compactados, transfere via SCP e descompacta via SSH.
# Preserva arquivos .env conforme regras de negócio.

# Faz o script parar se qualquer comando falhar
set -e

# Carregar variáveis do .env se existir
if [ -f .env ]; then
    # Usando export para carregar variáveis que não sejam comentários
    export $(grep -v '^#' .env | xargs)
fi

# Configurações
HOST="sh00102.hostgator.com.br"
USER=${SSH_USER:-"adri7808"}
PORT=${SSH_PORT:-22}
PASS=$FTP_PASS

if [ -z "$PASS" ]; then
    echo "❌ Erro: Variável FTP_PASS não encontrada no .env."
    exit 1
fi

# Verificar se sshpass está instalado
if ! command -v sshpass >/dev/null 2>&1; then
    echo "📦 sshpass não encontrado. Tentando instalar..."
    sudo apt-get update -qq && sudo apt-get install -y sshpass -qq || {
        echo "❌ Erro: Não foi possível instalar sshpass automaticamente."
        echo "   Por favor, instale manualmente: sudo apt install sshpass"
        exit 1
    }
fi

# Exportar para o sshpass usar
export SSHPASS=$PASS

# Caminhos remotos (relativos ao home do usuário)
REMOTE_HOME="/home1/$USER"
REMOTE_CORE="$REMOTE_HOME/cronolog"
REMOTE_PUBLIC="$REMOTE_HOME/public_html/cronolog/api"

MODE="light"
if [ "$1" == "--full" ]; then
    MODE="full"
fi

echo "🚀 Preparando pacote de deploy (Modo $MODE)..."
./generate_deploy_package.sh $1

# Verificar se pacotes existem
if [ ! -d "./deploy_package/cronolog_core" ] || [ ! -d "./deploy_package/cronolog_public" ]; then
    echo "❌ Erro: Falha ao gerar pacote de deploy!"
    exit 1
fi

echo "📦 Criando arquivos compactados locais..."
cd deploy_package/cronolog_core && zip -r ../../core.zip . && cd ../..
cd deploy_package/cronolog_public && zip -r ../../public.zip . && cd ../..

echo "📤 Transferindo arquivos para o servidor ($HOST)..."
sshpass -e scp -P $PORT core.zip public.zip $USER@$HOST:~/

echo "⚙️ Executando comandos de descompactação no servidor..."
sshpass -e ssh -p $PORT $USER@$HOST <<EOF
    set -e
    echo "  🔹 Garantindo diretórios base..."
    mkdir -p "$REMOTE_CORE"
    mkdir -p "$REMOTE_CORE/logs"
    mkdir -p "$REMOTE_PUBLIC"

    echo "  🔹 Descompactando Core (cronolog)..."
    # -o: Sobrescrever arquivos existentes
    # -x ".env*": EXCETO arquivos que começam com .env
    unzip -o ~/core.zip -d "$REMOTE_CORE" -x ".env*"
    
    # -n: NUNCA sobrescrever arquivos existentes (para os .env)
    unzip -n ~/core.zip ".env*" -d "$REMOTE_CORE"

    echo "  🔹 Descompactando Public (public_html/cronolog/api)..."
    unzip -o ~/public.zip -d "$REMOTE_PUBLIC"

    echo "  🧹 Limpando arquivos temporários no servidor..."
    rm ~/core.zip ~/public.zip
EOF

echo "🧹 Limpando arquivos temporários locais..."
rm core.zip public.zip

echo "✅ Deploy SSH concluído com sucesso!"
