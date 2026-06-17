#!/bin/bash

# Script para rodar testes Cypress garantindo que os serviços estejam ativos

echo "📦 Instalando dependências de sistema para Cypress..."
sudo apt-get update && sudo apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb

FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8080/status"

echo "🔍 Verificando serviços..."

# Função para verificar se um serviço está rodando
check_service() {
  curl -s -o /dev/null -w "%{http_code}" "$1"
}

# 1. Verificar/Subir Backend
if [ "$(check_service $BACKEND_URL)" != "200" ]; then
  echo "🚀 Backend não detectado em :8080. Iniciando..."
  cd backend
  ./run_local.sh 8080 > ../backend.log 2>&1 &
  BACKEND_PID=$!
  cd ..
  echo "⏳ Aguardando backend (PID $BACKEND_PID)..."
  sleep 5
else
  echo "✅ Backend já está rodando."
fi

# 2. Verificar/Subir Frontend
if [ "$(check_service $FRONTEND_URL)" != "200" ]; then
  echo "🚀 Frontend não detectado em :3000. Iniciando..."
  cd frontend
  NEXT_PUBLIC_API_URL="http://localhost:8080" npm run dev > ../frontend_dev.log 2>&1 &
  FRONTEND_PID=$!
  cd ..
  echo "⏳ Aguardando frontend (PID $FRONTEND_PID)..."
  # Aguarda até que o frontend responda 200 ou passem 30 segundos
  COUNTER=0
  while [ "$(check_service $FRONTEND_URL)" != "200" ] && [ $COUNTER -lt 30 ]; do
    sleep 2
    let COUNTER=COUNTER+2
    echo "..."
  done
else
  echo "✅ Frontend já está rodando."
fi

# 3. Rodar Testes
echo "🧪 Iniciando testes Cypress..."
cd frontend
npm run cypress:run
EXIT_CODE=$?
cd ..

# 4. Cleanup (Opcional - mata apenas o que este script subiu)
if [ ! -z "$BACKEND_PID" ] || [ ! -z "$FRONTEND_PID" ]; then
  echo "🧹 Limpando processos temporários..."
  [ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID && echo "Morte do backend (PID $BACKEND_PID)"
  [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID && echo "Morte do frontend (PID $FRONTEND_PID)"
fi

echo "🏁 Testes finalizados com código: $EXIT_CODE"
exit $EXIT_CODE
