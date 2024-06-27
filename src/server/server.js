const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const Session = require('./sessions.js');
const {URL} = require('node:url');

const sessions = Session.sessions;

const hostname = '127.0.0.1';
const port = 3000;

async function getHandler(req, res) {
  const url = req.url;

  if (url.substring(1, 4) == 'cdn') {
    let cdnData = null;
    try {
      cdnData = await fs.readFile(path.join(__dirname, '..', req.url));
    }
    catch {
      cdnData = null;
    }

    if (cdnData) {
      let contentType = null;

      switch (path.extname(req.url)) {
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

  switch (url) {
    case '/':
      const htmlData = await fs.readFile(path.join(__dirname, '..', '/views/index.html'))
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(htmlData);
      break;
    default:

      if (!sessions[url]) {
        const errorhtmlData = await fs.readFile(path.join(__dirname, '..', '/views/error.html'))
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        res.end(errorhtmlData);

        return;
      }
      const sessionData = await fs.readFile(path.join(__dirname, '..', '/views/sessionTemplate.html'))
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(sessionData)

  }
}

async function postHandler(req, res) {
  const url = req.url

  switch (url) {
    case '/createSession':
      const hash = crypto.randomBytes(4).toString('hex');
      const sessionID = `/` + hash;
      const session = new Session(sessionID);
      session.createGame();
      sessions[sessionID] = session;

      res.statusCode = 200;
      res.setHeader('Location', sessionID); // Client will redirect themselves

      res.end();
      break;
    default:
      res.statusCode = 404;
      res.end();
  }
}

function router(req, res) {
  switch (req.method) {
    case 'GET':
      getHandler(req, res);
      break;
    case 'POST':
      postHandler(req, res);
      break;
    default:
      res.statusCode = 404;
      res.end();
  }
}

const server = http.createServer((req, res) => {
  router(req, res);
});

let firstsocket = null;

server.on('upgrade', (req, socket) => {

 
  const url = new URL(`ws://${hostname}:${port}${req.url}`);
  if (req.headers['upgrade'] !== 'websocket' || !sessions[url.pathname] || url.searchParams.get('display-name') === undefined) {
    socket.end();
    return;
  }

  const session = sessions[url.pathname];

  if (session.numOfPlayers >= 4) {
    socket.end();
    return;
  }

  const acceptKey = req.headers['sec-websocket-key'];

  const hash = crypto
    .createHash('sha1')
    .update(acceptKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
    .digest('base64');

  socket.write(`HTTP/1.1 101 Switching Protocol\r\nUpgrade: WebSocket\r\nConnection: Upgrade\r\nSec-Websocket-Accept: ${hash}\r\n\r\n`);

  session.connectPlayer(socket, url.searchParams.get('display-name'));

})


server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
}); 