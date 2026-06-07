#!/bin/bash

# Script para preparar o pacote de deploy para HostGator
# Estrutura solicitada:
# /home1/adri7808/php_template/              <- Arquivos do sistema (protegidos)
# /home1/adri7808/public_html/php_template/  <- Arquivos públicos (acesso via site.com/php_template)

DEPLOY_DIR="./deploy_package"
CORE_DIR="$DEPLOY_DIR/php_template_core"
PUBLIC_DIR="$DEPLOY_DIR/php_template_public"

MODE="light"
if [ "$1" == "--full" ]; then
    MODE="full"
fi

echo "🚀 Iniciando geração do pacote em modo: $MODE"

echo "🧹 Limpando pacote anterior..."
rm -rf $DEPLOY_DIR
mkdir -p $CORE_DIR
mkdir -p $PUBLIC_DIR

echo "📦 Copiando arquivos do core..."
# Copiamos explicitamente as pastas necessárias para evitar exclusões indesejadas
cp -vR src "$CORE_DIR/"
cp -vR app "$CORE_DIR/"
cp -v composer.json "$CORE_DIR/"
cp -v composer.lock "$CORE_DIR/"

if [ "$MODE" == "full" ]; then
    if [ -d "vendor" ]; then
        echo "📦 Copiando pasta vendor..."
        cp -vR vendor "$CORE_DIR/"
    else
        echo "⚠️ Pasta vendor não encontrada!"
    fi
else
    echo "⏭️ Pulando pasta vendor (Modo Light)"
fi

echo "🌐 Copiando arquivos públicos..."
cp -r public/* $PUBLIC_DIR/
cp public/.htaccess $PUBLIC_DIR/

echo "🔧 Ajustando caminhos no index.php para a estrutura HostGator..."
# Altera os caminhos para subir dois níveis: um para sair da pasta php_template e outro da public_html
# de: __DIR__ . '/../  para: __DIR__ . '/../../php_template/
sed -i "s|__DIR__ . '/\.\./|__DIR__ . '/../../php_template/|g" $PUBLIC_DIR/index.php

echo "🔒 Criando .env de produção sugerido..."
cat <<EOF > $CORE_DIR/.env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=adri7808_nome_do_banco
DB_USER=adri7808_usuario
DB_PASS=sua_senha_aqui
DB_CHARSET=utf8mb4
GOOGLE_CLIENT_ID=seu_client_id_google
EOF

echo "✅ Pacote gerado com sucesso na pasta: $DEPLOY_DIR"

echo "📦 Conteúdo do pacote core (resumo):"
ls -R $CORE_DIR/src/Application/Actions | grep StatusAction || echo "❌ StatusAction MISSING in package!"
grep "status" $CORE_DIR/app/routes.php > /dev/null && echo "✅ Rota /status encontrada no pacote." || echo "❌ Rota /status NÃO encontrada no pacote!"

echo ""
echo "--- PRÓXIMOS PASSOS NO HOSTGATOR ---"
echo "1. Crie a pasta /home1/adri7808/php_template/ e mova o conteúdo de 'php_template_core' para lá."
echo "2. Crie a pasta /home1/adri7808/public_html/php_template/ e mova o conteúdo de 'php_template_public' para lá."
echo "3. Sua API estará acessível em: https://seudominio.com.br/php_template/"
echo "4. Configure o .env na pasta /home1/adri7808/php_template/.env"
