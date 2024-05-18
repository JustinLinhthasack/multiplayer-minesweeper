const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Session = require('./sessions.js');

const hostname = '127.0.0.1';
const port = 3000;

const sessions = {};

function getHandler(req, res) {
  const url = req.url;

  if (url.substring(1,4) == 'cdn') {
    let cdnData = null;
    try {
      cdnData = fs.readFileSync(path.join(__dirname, '..', req.url));
    } 
    catch {
      cdnData = null;
    }

    if (cdnData) {
      let contentType = null;

      switch(path.extname(req.url)) {
        case '.css':
          contentType = 'text/css';
          break;
        case '.js':
          contentType = 'text/javascript';
          break;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
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

      if (!sessions[url]) {
        let errorhtmlData = fs.readFileSync(path.join(__dirname, '..', '/views/errorPage/error.html'))
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        res.end(errorhtmlData);

        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end('SUCCESS!')
      
  }
}

function postHandler(req,res) {
  const url = new URL(`http:${hostname}:${port}${req.url}`);

  switch(url.pathname) {
    case '/createSession':
      let hash = crypto.randomBytes(4).toString('hex');
      let userID = crypto.randomBytes(16).toString('hex');
      sessions['/'+hash] = new Session();

      res.statusCode = 200;
      res.setHeader('Location', '/'+hash); // Client will redirect themselves
      res.setHeader('userId', userID);
 
      res.end();
      break;
    default:
      res.statusCode = 404;
      res.end();
  }
}

function router(req, res) {
  switch(req.method) {
    case 'GET':
      getHandler(req, res);
      break;
    case 'POST':
      postHandler(req,res);
      break;
    default:
      res.statusCode = 404;
      res.end();
  }
}

const server = http.createServer((req, res) => {
  router(req, res);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
}); 