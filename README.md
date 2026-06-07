# PHP REST API Template (Slim 4)

Este projeto é um template estruturado para o desenvolvimento de APIs REST em PHP 8.2+, utilizando o Slim Framework 4 e seguindo princípios de Clean Architecture.

## 🚀 Tecnologias Utilizadas

- **PHP 8.2+**: Utilizando recursos modernos como Readonly Properties e Typed Properties.
- **Slim Framework 4**: Micro-framework para roteamento e middleware.
- **PHP-DI**: Container de injeção de dependência.
- **MySQL (PDO)**: Camada de persistência nativa e eficiente.
- **vlucas/phpdotenv**: Gestão de variáveis de ambiente.
- **PHPUnit**: Framework de testes para garantir a qualidade do código.
- **Monolog**: Sistema de logs estruturado.
- **Google OAuth 2.0**: Estrutura pronta para autenticação via Google.

## 📋 Requisitos

- PHP 8.2 ou superior
- Extensões PHP: `pdo_mysql`, `json`, `mbstring`, `dom`, `xml`
- Composer
- **lftp** (necessário para o script de publicação. Instale com: `sudo apt install lftp`)
- MySQL 8.0+

## 📂 Estrutura de Pastas

```text
├── app/                # Configurações do framework (rotas, dependências, settings)
├── public/             # Ponto de entrada (index.php) e .htaccess
├── src/
│   ├── Application/    # Actions (Controllers), Middlewares e Handlers
│   ├── Domain/         # Entidades de negócio e Interfaces de Repositório
│   └── Infrastructure/ # Implementações concretas (MySQL, Integrações Externas)
├── tests/              # Testes unitários e de integração
├── logs/               # Arquivos de log da aplicação
└── database.sql        # Esquema inicial do banco de dados
```

## 🛠️ Instalação e Configuração

1. **Instalar Dependências:**
   ```bash
   composer install
   ```

2. **Configurar Ambiente:**
   Copie o arquivo `.env.example` para `.env` e preencha as credenciais:
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`
   - `GOOGLE_CLIENT_ID`

3. **Configurar Banco de Dados:**
   Execute o conteúdo de `database.sql` no seu servidor MySQL.

4. **Executar Localmente:**
   ```bash
   ./run_local.sh 8080
   ```

## 🔐 Autenticação e Fluxo de Usuários

A API possui um **AuthMiddleware** que protege as rotas:
1. O cliente envia um `Google ID Token` no cabeçalho `Authorization: Bearer <TOKEN>`.
2. O sistema valida o token com o Google.
3. **Cadastro Automático**: No primeiro login, o usuário é cadastrado com `status = 'pending'`.
4. **Fluxo de Aprovação**: O acesso é bloqueado até que um administrador altere o status para `active`.

## 🧪 Testes

A aplicação utiliza o PHPUnit para testes automatizados. Para rodar a suíte completa de testes, utilize o comando:
```bash
./vendor/bin/phpunit
```

## 📦 Deploy (HostGator)

Existem scripts automatizados para preparar a estrutura de pastas e realizar o upload para a HostGator, separando o código sensível da pasta pública.

### 1. Modos de Deploy
Os scripts suportam dois modos:
- **Light (Padrão):** Ignora a pasta `vendor/`. Ideal para atualizações rápidas de código quando as dependências não mudaram.
- **Full (`--full`):** Inclui a pasta `vendor/`. Necessário no primeiro deploy ou quando novas dependências forem instaladas via Composer.

### 2. Gerar pacote de deploy:
```bash
chmod +x generate_deploy_package.sh

# Modo Light (padrão)
./generate_deploy_package.sh

# Modo Full (com vendor)
./generate_deploy_package.sh --full
```

### 3. Estrutura gerada em `/deploy_package`:
- `php_template_core`: Deve ser movido para fora da pasta pública (ex: `/home1/usuario/php_template`).
- `php_template_public`: Conteúdo para a pasta pública (ex: `/home1/usuario/public_html/php_template`).

### 4. Publicar via FTP:
Configure as variáveis `FTP_HOST`, `FTP_USER` e `FTP_PASS` no seu `.env` e execute:
```bash
chmod +x publish_to_hostgator.sh

# Deploy Light (rápido)
./publish_to_hostgator.sh

# Deploy Full (completo)
./publish_to_hostgator.sh --full
```

### 5. Configuração Final:
Após o upload, edite o arquivo `.env` na pasta core do servidor com as credenciais de produção.

## 📍 Endpoints Atuais

### Usuários
- `GET /users/{google_id}/is-admin`: Verifica se um ID específico é admin.
- `GET /users/me/is-admin`: Verifica o status do usuário autenticado pelo token.

## 📝 Comandos Úteis

- **Executar Testes:**
  ```bash
  ./vendor/bin/phpunit --colors=always
  ```

- **Aprovar Usuário Manualmente:**
  ```sql
  UPDATE users SET status = 'active' WHERE google_id = 'ID_DO_GOOGLE';
  ```

- **Tornar Usuário Administrador:**
  ```sql
  UPDATE users SET is_admin = 1 WHERE google_id = 'ID_DO_GOOGLE';
  ```
