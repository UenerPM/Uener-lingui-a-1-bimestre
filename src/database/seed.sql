-- Script para inserir usuário admin de teste
-- IMPORTANTE: A senha 'adm' será hasheada pelo Node.js, mas para teste você pode usar bcrypt.hash(

) manualmente
-- Para este seed, após executar a migração init.sql, rode o comando Node abaixo:
--
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('123', 10).then(hash => console.log(\`INSERT INTO users(username, password_hash, is_admin) VALUES('adm', '\${hash}', true);\`)).catch(e => console.log(e))"

-- Alternativamente, use este hash pré-gerado (123 com salt 10):
INSERT INTO users (username, password_hash, is_admin) VALUES 
('adm', '$2a$10$eImiTXuWVxfaHNYY0iNAiOjZua/.Ym3nHT8/LewY5YksVWftPkJDK', true)
ON CONFLICT (username) DO NOTHING;
