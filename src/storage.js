const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'data');
const file = path.join(dir, 'configs.json');
function ensure(){ fs.mkdirSync(dir,{recursive:true}); if(!fs.existsSync(file)) fs.writeFileSync(file,'{}','utf8'); }
function all(){ ensure(); try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return{};} }
function get(id){ return all()[id] || null; }
function set(id,cfg){ const data=all(); data[id]=cfg; ensure(); fs.writeFileSync(file,JSON.stringify(data,null,2),'utf8'); }
function remove(id){ const data=all(); delete data[id]; ensure(); fs.writeFileSync(file,JSON.stringify(data,null,2),'utf8'); }
module.exports={get,set,remove};
