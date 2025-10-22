const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.sqlite');
const MIGRATIONS = path.join(__dirname, 'migrations.sql');

if(!fs.existsSync(DB_FILE)){
  const tmpdb = new Database(DB_FILE);
  const sql = fs.readFileSync(MIGRATIONS, 'utf8');
  tmpdb.exec(sql);
  tmpdb.close();
  console.log('Banco criado e populado.');
}

const db = new Database(DB_FILE);
const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type'] }));
app.use(bodyParser.json());

app.get('/health', (req,res)=>res.json({ ok:true }));
app.get('/', (req,res)=>res.send('Conect Commerce API v4'));

// AUTH
app.post('/auth/register-user', (req, res) => {
  try {
    const { name, email, password, city } = req.body;
    if (!name || !email || !password || !city) return res.status(400).json({ ok:false, error:'Campos obrigatórios ausentes.' });
    const info = db.prepare("INSERT INTO users (name, email, password, city, type) VALUES (?, ?, ?, ?, 'user')").run(name, email, password, city);
    res.json({ ok:true, user: { id: info.lastInsertRowid, name, email, city, type:'user' } });
  } catch (err) { console.error('register-user:', err); res.status(500).json({ ok:false, error:'Erro interno.' }); }
});

app.post('/auth/register-company', (req, res) => {
  try {
    const { companyName, email, password, city, contact } = req.body;
    if(!companyName || !email || !password || !city) return res.status(400).json({ ok:false, error:'Campos obrigatórios ausentes.' });
    const info = db.prepare("INSERT INTO users (name, email, password, city, type) VALUES (?, ?, ?, ?, 'company')").run(companyName, email, password, city);
    const company = { id: info.lastInsertRowid, name: companyName, email, city, contact, type:'company' };
    res.json({ ok:true, company });
  } catch (err) { console.error('register-company:', err); res.status(500).json({ ok:false, error:'Erro interno.' }); }
});

app.post('/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = db.prepare("SELECT id, name, email, city, type FROM users WHERE (email = ? OR name = ?) AND password = ? LIMIT 1").get(identifier, identifier, password);
    if(user) return res.json({ ok:true, user });
    return res.status(401).json({ ok:false, error:'Credenciais inválidas' });
  } catch (err) { console.error('login:', err); res.status(500).json({ ok:false, error:'Erro interno.' }); }
});

// ESTABLISHMENTS
app.get('/establishments', (req,res) => {
  try {
    const { city, ownerId } = req.query;
    let rows;
    if(ownerId){
      rows = db.prepare("SELECT * FROM establishments WHERE owner_id = ?").all(ownerId);
    } else if(city){
      rows = db.prepare("SELECT * FROM establishments WHERE lower(city) = lower(?)").all(city);
    } else {
      rows = db.prepare("SELECT * FROM establishments").all();
    }
    res.json(rows);
  } catch (err) { console.error('establishments:', err); res.status(500).json({ ok:false, error:'Erro interno.' }); }
});

app.post('/establishments', (req,res) => {
  try {
    const { name, category, city, owner_id, image } = req.body;
    if(!name || !city || !owner_id) return res.status(400).json({ ok:false, error:'Campos obrigatórios ausentes.' });
    const info = db.prepare("INSERT INTO establishments (name, category, city, owner_id, image) VALUES (?,?,?,?,?)").run(name, category || null, city, owner_id, image || null);
    res.json({ ok:true, id: info.lastInsertRowid });
  } catch (err) { console.error('create establishment:', err); res.status(500).json({ ok:false, error:'Erro interno.' }); }
});

// PRODUCTS
app.get('/products', (req,res) => {
  try {
    const { establishmentId } = req.query;
    if(!establishmentId) return res.status(400).json({ ok:false, error:'establishmentId é obrigatório' });
    const rows = db.prepare("SELECT * FROM products WHERE establishment_id = ?").all(establishmentId);
    res.json(rows);
  } catch (err) { console.error('products list:', err); res.status(500).json({ ok:false, error:'Erro interno.' }); }
});

app.post('/products', (req,res) => {
  try {
    const { name, description, price, image, establishment_id } = req.body;
    if(!name || price == null || !establishment_id) return res.status(400).json({ ok:false, error:'Campos obrigatórios ausentes.' });
    const info = db.prepare("INSERT INTO products (name, description, price, image, establishment_id) VALUES (?,?,?,?,?)").run(name, description || null, price, image || null, establishment_id);
    res.json({ ok:true, id: info.lastInsertRowid });
  } catch (err) { console.error('product create:', err); res.status(500).json({ ok:false, error:'Erro interno.' }); }
});

app.delete('/products/:id', (req,res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ ok:true });
  } catch (err) { console.error('product delete:', err); res.status(500).json({ ok:false, error:'Erro interno.' }); }
});

// FAVORITES
app.get('/favorites/:user_id', (req,res) => {
  try{
    const { user_id } = req.params;
    const rows = db.prepare('SELECT e.id, e.name, e.category, e.city FROM establishments e JOIN favorites f ON f.establishment_id = e.id WHERE f.user_id = ?').all(user_id);
    res.json(rows);
  }catch(err){
    console.error('favorites list:', err);
    res.status(500).json({ ok:false, error:'Erro interno.' });
  }
});

app.post('/favorites', (req,res) => {
  try{
    const { user_id, establishment_id } = req.body;
    if(!user_id || !establishment_id) return res.status(400).json({ ok:false, error:'Dados faltando' });
    db.prepare('INSERT OR IGNORE INTO favorites (user_id, establishment_id) VALUES (?,?)').run(user_id, establishment_id);
    res.json({ ok:true });
  }catch(err){
    console.error('favorite add:', err);
    res.status(500).json({ ok:false, error:'Erro interno.' });
  }
});

app.delete('/favorites', (req,res) => {
  try{
    const { user_id, establishment_id } = req.body;
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND establishment_id = ?').run(user_id, establishment_id);
    res.json({ ok:true });
  }catch(err){
    console.error('favorite del:', err);
    res.status(500).json({ ok:false, error:'Erro interno.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('API rodando na porta', PORT));
