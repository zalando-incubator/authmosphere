'use strict';


/// <reference path="./typings/express/express.d.ts" />



import * as express from 'express';


var app = express();



app
  .get('/contents', function list(req, res) {
      res.send({
        id: '0001',
        contents: {
          'text': 'test'
        }
      });
  });

app.listen(3000);

export default app;
