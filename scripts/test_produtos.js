require('dotenv').config();
const repo = require('../src/repositories/produtoRepository');

(async ()=>{
  try{
    const ps = await repo.getAllProdutos();
    console.log('PRODUTOS:', ps);
  }catch(err){
    console.error('Erro:', err.message);
    process.exit(1);
  }finally{
    process.exit(0);
  }
})();
