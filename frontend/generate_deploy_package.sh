#!/bin/bash

# Script otimizado para preparar o pacote de deploy para HostGator (Static Export)
# Agora gera um site estático puro que não depende de Node.js no servidor.

# Garante que estamos no diretório do script
cd "$(dirname "$0")"

DEPLOY_DIR="./deploy_package"

echo "🚀 Iniciando geração do pacote FRONTEND ESTÁTICO..."

# 1. Limpeza rigorosa
echo "🧹 Limpando ambiente e builds anteriores..."
rm -rf "$DEPLOY_DIR"
rm -rf .next
rm -rf out

# 2. Build estático
echo "🏗️ Construindo aplicação Next.js (Static Export)..."
export NODE_ENV=production
if ! npm run build; then
    echo "❌ Erro: Falha no build do Next.js!"
    exit 1
fi

# 3. Preparação do diretório de deploy
mkdir -p "$DEPLOY_DIR"

# 4. Organização do pacote Estático
echo "📦 Organizando arquivos estáticos..."
if [ -d "out" ]; then
    cp -rp out/. "$DEPLOY_DIR/"
else
    echo "❌ Erro: Diretório 'out' não encontrado. Verifique se 'output: export' está no next.config.ts"
    exit 1
fi

# 5. Otimizações de tamanho
echo "🧹 Removendo arquivos desnecessários..."
find "$DEPLOY_DIR" -name "*.map" -type f -delete

# 6. Finalização
echo "✅ Pacote frontend estático gerado em: $DEPLOY_DIR"
echo "📊 Resumo de tamanho:"
du -sh "$DEPLOY_DIR"

echo "----------------------------------------------------------------"
echo "💡 PRONTO: Agora você pode enviar o conteúdo de '$DEPLOY_DIR'"
echo "   para a HostGator. Ele funcionará como um site estático comum."
echo "   NÃO é necessário configurar o Node.js Selector no cPanel."
echo "----------------------------------------------------------------"
