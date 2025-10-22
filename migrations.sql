-- users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  password TEXT,
  city TEXT,
  type TEXT DEFAULT 'user'
);

-- favorites
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  establishment_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- establishments
CREATE TABLE IF NOT EXISTS establishments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  category TEXT,
  city TEXT
);

-- seed establishments (Itarema)
INSERT INTO establishments (name, category, city) VALUES
('Farmácia Pague Menos','Farmácia','Itarema'),
('Mercadinho JP','Mercado','Itarema'),
('Supermercado Bom Jesus','Supermercado','Itarema'),
('Lanchonete Sucos e Cia','Lanchonete','Itarema'),
('Padaria Arco Íris','Padaria','Itarema'),
('Prime Açaí','Açaíteria','Itarema'),
('Churrascaria Oasis','Churrascaria','Itarema');
