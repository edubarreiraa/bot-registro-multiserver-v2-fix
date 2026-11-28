const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const dir = path.join(__dirname, '..', 'data');
const file = path.join(dir, 'configs.json');

function ensure(){
  fs.mkdirSync(dir,{recursive:true});
  if(!fs.existsSync(file)) fs.writeFileSync(file,'{}','utf8');
}

function all(){
  ensure();
  try{return JSON.parse(fs.readFileSync(file,'utf8'));}
  catch(error){
    logger.error('Falha ao ler o arquivo de configuracoes.', { error: error.message, file });
    throw new Error('Nao foi possivel ler as configuracoes salvas.');
  }
}

function save(data){
  ensure();
  const temporaryFile = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporaryFile,JSON.stringify(data,null,2),'utf8');
  fs.renameSync(temporaryFile,file);
}

function get(id){ return all()[id] || null; }
function set(id,cfg){ const data=all(); data[id]=cfg; save(data); }
function remove(id){ const data=all(); delete data[id]; save(data); }
module.exports={get,set,remove};
