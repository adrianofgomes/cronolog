-- ==========================================================
-- CRONOLOG DATABASE SCHEMA v2
-- ==========================================================

-- Tabela de Usuários
-- Gerencia os usuários autenticados via Google OAuth
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    is_admin TINYINT(1) DEFAULT 0,
    status ENUM('pending', 'active', 'blocked') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Perfis/Membros da Família
-- Permite que um usuário gerencie eventos para si e para outros membros da família
CREATE TABLE IF NOT EXISTS profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50), -- ex: 'Self', 'Son', 'Daughter', 'Spouse', 'Pet'
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorias de Eventos
-- metadata_schema: Define quais campos a IA deve procurar no texto para esta categoria
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50), -- ex: 'car', 'heart', 'shopping-cart'
    color VARCHAR(7), -- ex: '#FF5733'
    metadata_schema JSON, -- Ex: {"km": "number", "litros": "number", "valor": "number"}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eventos (Log Principal)
-- metadata: Armazena os valores extraídos (ex: { "km": 55000 })
-- raw_input: Armazena o texto original processado pela IA para auditoria
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    profile_id INT, -- Opcional: pode ser um evento geral do usuário
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    event_date DATETIME NOT NULL,
    description TEXT,
    metadata JSON,
    tags JSON,
    source ENUM('manual', 'ai_voice', 'ai_text') DEFAULT 'manual',
    raw_input TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Anexos (Genérico)
CREATE TABLE IF NOT EXISTS attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    file_type VARCHAR(50), -- 'pdf', 'image'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
