import { createReadStream } from "fs";
import { readFile } from "fs/promises";
import { createServer } from "https";

const server = createServer(
  {
    ca: await readFile("cert/ca.crt"),
    cert: await readFile("cert/server.crt"),
    key: await readFile("cert/server.key"),
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
