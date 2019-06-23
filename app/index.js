const express = require('express');
const {makePdf} = require('./makePdf/index.js');
const app = express();
const port = 3333;

makePdf();

app.all(
  '/',
  (req, res) => res.sendFile('public/index.html', { root: __dirname })
);

app.get(
  '/pdf',
  (req, res) => {
    return res.download('files/pdf.pdf', 'report.pdf', { root: __dirname }, (error) => {
      if (error) {
        // TODO: Handle error, but keep in mind the response may be partially sent
        // so check res.headersSent.

        console.error(error);
      } else {
        console.log('🌭 pdf download')
      }
    });
  }
);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
