#!/bin/bash

# Script de deploy unificado para HostGator (Front-end e Back-end)

# Faz o script parar se qualquer comando falhar
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MODE="light"
if [ "$1" == "--full" ]; then
    MODE="full"
fi

echo -e "${BLUE}🚀 Iniciando deploy unificado (Modo $MODE)${NC}"

# 1. Deploy do Backend
echo -e "\n${BLUE}📦 [1/2] Fazendo deploy do BACKEND...${NC}"
cd backend
if [ -f "./publish_to_hostgator.sh" ]; then
    bash ./publish_to_hostgator.sh $1
else
    echo -e "${RED}❌ Script backend/publish_to_hostgator.sh não encontrado!${NC}"
    exit 1
fi
cd ..

# 2. Deploy do Frontend
echo -e "\n${BLUE}📦 [2/2] Fazendo deploy do FRONTEND...${NC}"
cd frontend
if [ -f "./publish_to_hostgator.sh" ]; then
    bash ./publish_to_hostgator.sh $1
else
    echo -e "${RED}❌ Script frontend/publish_to_hostgator.sh não encontrado!${NC}"
    exit 1
fi
cd ..

echo -e "\n${GREEN}✅ Deploy unificado concluído com sucesso!${NC}"
