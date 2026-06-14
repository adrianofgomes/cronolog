#!/bin/bash

# Script de deploy unificado para HostGator (Front-end e Back-end)
# Suporta os seguintes parâmetros:
#   --full: Faz o build completo
#   --ftp:  Usa o método legado FTP/lftp (default é SSH/zip)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse de argumentos
BUILD_MODE=""
DEPLOY_METHOD="ssh"
SKIP_TESTS=false
DEPLOY_FRONT=true
DEPLOY_BACK=true

for arg in "$@"; do
    case $arg in
        --full) BUILD_MODE="--full" ;;
        --ftp) DEPLOY_METHOD="--ftp" ;;
        --skipTests) SKIP_TESTS=true ;;
        --front|--frontend) DEPLOY_BACK=false ;;
        --back|--backend) DEPLOY_FRONT=false ;;
    esac
done

echo -e "${BLUE}🚀 Iniciando deploy unificado${NC}"
echo -e "${BLUE}   Modo de Build: ${BUILD_MODE:-default}${NC}"
echo -e "${BLUE}   Método: $DEPLOY_METHOD${NC}"
echo -e "${BLUE}   Pular Testes: $SKIP_TESTS${NC}"
echo -e "${BLUE}   Deploy Frontend: $DEPLOY_FRONT${NC}"
echo -e "${BLUE}   Deploy Backend: $DEPLOY_BACK${NC}"

# 0. Incremento de Build
echo -e "\n${BLUE}🔢 Incrementando build...${NC}"
if [ -f "version.json" ]; then
    # Usando Python para manipular o JSON de forma robusta e segura
    python3 -c "
import json, datetime
try:
    with open('version.json', 'r') as f:
        data = json.load(f)
    data['build'] = data.get('build', 0) + 1
    data['date'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    with open('version.json', 'w') as f:
        json.dump(data, f, indent=4)
    print(f'✅ Build incrementado para: {data[\"build\"]} ({data[\"date\"]})')
except Exception as e:
    print(f'❌ Erro ao atualizar version.json: {e}')
    exit(1)
"
else
    echo -e "${RED}⚠️ Arquivo version.json não encontrado. Pulando incremento.${NC}"
fi

# 1. Execução de Testes
if [ "$SKIP_TESTS" == "false" ]; then
    echo -e "\n${BLUE}🧪 [1/3] Executando testes de integridade...${NC}"
    
    # Testes Backend
    if [ "$DEPLOY_BACK" == "true" ]; then
        echo -e "   🔹 Testes Backend (PHPUnit)..."
        if ! (cd backend && ./vendor/bin/phpunit --colors=always); then
            echo -e "\n${RED}❌ Erro: Os testes do backend falharam! O deploy foi abortado.${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Todos os testes passaram!${NC}"
fi

# 2. Deploy do Backend
if [ "$DEPLOY_BACK" == "true" ]; then
    echo -e "\n${BLUE}📦 [2/3] Fazendo deploy do BACKEND...${NC}"
    cd backend
    if [ -f "./publish_to_hostgator.sh" ]; then
        bash ./publish_to_hostgator.sh $BUILD_MODE $DEPLOY_METHOD
    else
        echo -e "${RED}❌ Script backend/publish_to_hostgator.sh não encontrado!${NC}"
        exit 1
    fi
    cd ..
fi

# 3. Deploy do Frontend
if [ "$DEPLOY_FRONT" == "true" ]; then
    echo -e "\n${BLUE}📦 [3/3] Fazendo deploy do FRONTEND...${NC}"
    cd frontend
    if [ -f "./publish_to_hostgator.sh" ]; then
        bash ./publish_to_hostgator.sh $BUILD_MODE $DEPLOY_METHOD
    else
        echo -e "${RED}❌ Script frontend/publish_to_hostgator.sh não encontrado!${NC}"
        exit 1
    fi
    cd ..
fi

echo -e "\n${GREEN}✅ Deploy unificado concluído com sucesso!${NC}"
