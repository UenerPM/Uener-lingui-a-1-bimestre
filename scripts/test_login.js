require('dotenv').config();
const userRepo = require('../src/repositories/userRepository');

(async ()=>{
  try{
    const res = await userRepo.validateCredentials('adm','123');
    console.log('validateCredentials result:', res);
  }catch(err){
    console.error('Erro teste login:', err.message);
  }finally{
    process.exit(0);
  }
})();
