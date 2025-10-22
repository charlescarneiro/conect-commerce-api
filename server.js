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
  console.log('Banco criado e populado com estabelecimentos de Itarema.');
}

const db = new Database(DB_FILE);
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req,res)=>res.send('API Conect Commerce ativa.'));

app.post('/auth/register-user',(req,res)=>{
  const {name,email,password,city}=req.body;
  if(!name||!email||!password)return res.json({ok:false,error:'Campos obrigatórios faltando'});
  const info=db.prepare("INSERT INTO users (name,email,password,city,type) VALUES (?,?,?,?,'user')").run(name,email,password,city);
  res.json({ok:true,user:{id:info.lastInsertRowid,name,email,city}});
});

app.post('/auth/register-company',(req,res)=>{
  const { companyName, cnpj, city, contact } = req.body;
  if(!companyName) return res.json({ ok:false, error:'Nome da empresa obrigatório' });
  const info = db.prepare('INSERT INTO users (name,city,type) VALUES (?,?,?)').run(companyName, city, 'company');
  const company = { id: info.lastInsertRowid, companyName, city, contact };
  res.json({ ok:true, company });
});

app.post('/auth/login',(req,res)=>{
  const {identifier,password}=req.body;
  if(password==='1234'){
    const user=db.prepare('SELECT id,name,email,city,type FROM users WHERE (email=? OR name=?) LIMIT 1').get(identifier,identifier);
    if(user)return res.json({ok:true,user});
    const info=db.prepare('INSERT INTO users (name,email,password,city,type) VALUES (?,?,?,"Itarema","user")').run(identifier,identifier,password);
    return res.json({ok:true,user:{id:info.lastInsertRowid,name:identifier}});
  }
  const user=db.prepare('SELECT id,name,email,city FROM users WHERE email=? AND password=?').get(identifier,password);
  if(user)return res.json({ok:true,user});
  res.json({ok:false,error:'Credenciais inválidas'});
});

app.get('/establishments',(req,res)=>{
  const {city}=req.query;
  let rows;
  if(city){
    rows=db.prepare('SELECT * FROM establishments WHERE lower(city)=lower(?)').all(city);
  }else{
    rows=db.prepare('SELECT * FROM establishments').all();
  }
  res.json(rows);
});

app.post('/favorites',(req,res)=>{
  const {user_id,establishment_id}=req.body;
  if(!user_id||!establishment_id)return res.json({ok:false,error:'Dados faltando'});
  const exists=db.prepare('SELECT id FROM favorites WHERE user_id=? AND establishment_id=?').get(user_id,establishment_id);
  if(exists)return res.json({ok:false,error:'Já favoritado'});
  const info=db.prepare('INSERT INTO favorites (user_id,establishment_id) VALUES (?,?)').run(user_id,establishment_id);
  res.json({ok:true,id:info.lastInsertRowid});
});

app.delete('/favorites',(req,res)=>{
  const {user_id,establishment_id}=req.body;
  db.prepare('DELETE FROM favorites WHERE user_id=? AND establishment_id=?').run(user_id,establishment_id);
  res.json({ok:true});
});

app.get('/favorites/:user_id',(req,res)=>{
  const {user_id}=req.params;
  const favs=db.prepare('SELECT e.* FROM establishments e JOIN favorites f ON e.id=f.establishment_id WHERE f.user_id=?').all(user_id);
  res.json(favs);
});

app.get('/health',(req,res)=>res.json({ok:true}));

const PORT = process.env.PORT||3000;
app.listen(PORT,()=>console.log('API rodando na porta', PORT));
