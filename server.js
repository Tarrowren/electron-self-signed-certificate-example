// @ts-check

import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:https";

const [ca, cert, key] = await Promise.all([
  readFile("cert/ca.crt"),
  readFile("cert/server.crt"),
  readFile("cert/server.key"),
]);

createServer(
  {
    ca,
    cert,
    key,
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
  },
).listen(8080);
