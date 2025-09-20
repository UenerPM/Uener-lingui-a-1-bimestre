const express = require('express');
const path = require('path');
const dbRouter = require('./backend/routes/dbRoutes');
const app = express();
app.use(express.json());
app.use('/api/db', dbRouter);
app.listen(4000, () => console.log('Test server listening on 4000'));
