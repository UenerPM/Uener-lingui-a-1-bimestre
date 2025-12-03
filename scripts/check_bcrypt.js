const bcrypt = require('bcryptjs');
(async ()=>{
  const hash = '$2a$10$Ld8BhPLvvzKJEE3V9fNZa.q1SmGzJ.B8vXl3WqJZb2u3VGVDjHkJW';
  const ok = await bcrypt.compare('123', hash);
  console.log('bcrypt compare result for 123:', ok);
})();
