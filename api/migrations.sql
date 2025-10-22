PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, city TEXT, type TEXT CHECK(type IN ('user','company')) NOT NULL DEFAULT 'user');
CREATE TABLE IF NOT EXISTS establishments (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT, city TEXT, owner_id INTEGER, image TEXT, FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, price REAL NOT NULL, image TEXT, establishment_id INTEGER NOT NULL, FOREIGN KEY(establishment_id) REFERENCES establishments(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, establishment_id INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, establishment_id), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(establishment_id) REFERENCES establishments(id) ON DELETE CASCADE);
INSERT INTO establishments (name, category, city, owner_id, image) VALUES
('Farmácia Pague Menos','Farmácia','Itarema', NULL, NULL),
('Mercadinho JP','Mercado','Itarema', NULL, NULL),
('Supermercado Bom Jesus','Supermercado','Itarema', NULL, NULL),
('Lanchonete Sucos e Cia','Lanchonete','Itarema', NULL, NULL),
('Padaria Arco Íris','Padaria','Itarema', NULL, NULL),
('Prime Açaí','Açaíteria','Itarema', NULL, NULL),
('Churrascaria Oasis','Churrascaria','Itarema', NULL, NULL);
