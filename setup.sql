-- Script de configuração do banco de dados no Supabase

-- Habilitar a extensão pgcrypto para uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Simulacoes
CREATE TABLE IF NOT EXISTS public.simulacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_consorcio TEXT NOT NULL,
    valor_credito NUMERIC NOT NULL,
    valor_parcela NUMERIC NOT NULL,
    nome TEXT,
    whatsapp TEXT,
    realizou_cadastro BOOLEAN DEFAULT FALSE,
    data_simulacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Administradores
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir um administrador padrão (Senha: 'admin123')
-- O Hash corresponde à string 'admin123' encryptada em bcrypt
INSERT INTO public.admins (email, senha_hash)
VALUES ('admin@palhano.com.br', '$2b$10$wN9iL6Yd.qXF9pY8v4R.0.ZfGkE7XlNj6nB9rF0C5g5xY.mC5g5xY')
ON CONFLICT (email) DO NOTHING;
