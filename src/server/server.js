const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const hostname = '127.0.0.1';
const port = 3000;

function pathHandler(req, res) {
  const url = req.url;

  if (url.substring(1,4) == 'cdn') {
    let cdnData = fs.readFileSync(path.join(__dirname, '..', req.url));
    if (cdnData) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/css');
      res.end(cdnData);
    } else {
      res.statusCode = 404;
      res.end();
    }
    return;
  }

  switch(url) {
    case '/':
      let htmlData = fs.readFileSync(path.join(__dirname, '..', '/views/index/index.html'))
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(htmlData);
      break;
    default:
      let errorhtmlData = fs.readFileSync(path.join(__dirname, '..', '/views/errorPage/error.html'))
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end(errorhtmlData);
  }
}

const server = http.createServer((req, res) => {
  pathHandler(req, res);
  
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
}); 