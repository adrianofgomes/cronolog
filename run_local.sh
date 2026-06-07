#!/bin/bash

# Define a porta (padrão 8080 se não for informada)
PORT=${1:-8080}

echo "🚀 Iniciando servidor PHP local em http://localhost:$PORT"
echo "📂 Servindo arquivos de: $(pwd)/public"
echo "Press CTRL+C to stop."

# Verifica se o arquivo .env existe, caso contrário avisa o usuário
if [ ! -f .env ]; then
    echo "⚠️  Aviso: Arquivo .env não encontrado. Certifique-se de configurar suas variáveis de ambiente."
fi

# Comando para rodar o servidor embutido do PHP
# O parâmetro -t public garante que o servidor use a pasta public como raiz (DocumentRoot)
# O PHP lida automaticamente com o index.php como roteador principal
php -S localhost:$PORT -t public/