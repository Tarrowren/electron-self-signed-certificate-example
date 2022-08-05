const { readFileSync, createReadStream } = require("fs");
const { createServer } = require("https");

const server = createServer(
  {
    ca: readFileSync("cert/ca.crt"),
    cert: readFileSync("cert/server.crt"),
    key: readFileSync("cert/server.key"),
    requestCert: true,
    rejectUnauthorized: true,
  },
  (req, res) => {
    if (req.url === "/") {
      res.statusCode = 200;
      createReadStream("index.html").pipe(res);
    } else {
      res.statusCode = 404;
    }
  }
);

server.listen(8080);
