const { app, BrowserWindow, protocol } = require("electron");
const { createReadStream } = require("fs");
const { readFile } = require("fs/promises");
const { BufferReadable } = require("buffer-readable");
const { MultiBufferReadable } = require("multi-readable");
const { join } = require("path");
const https = require("https");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
    },
  });

  win.loadURL("tarrow://./");
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "tarrow",
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

app.whenReady().then(async () => {
  const agent = new https.Agent({
    ca: await readFile("cert/ca.crt"),
    cert: await readFile("cert/client.crt"),
    key: await readFile("cert/client.key"),
  });

  async function _request(options, stream) {
    return await new Promise((resolve, reject) => {
      options.agent = agent;

      const req = https
        .request(options, resolve)
        .on("error", reject)
        .on("timeout", () => {
          req.destroy(new Error("timeout"));
        });

      if (stream) {
        stream.pipe(req);
      } else {
        req.end();
      }
    });
  }

  protocol.registerStreamProtocol("tarrow", async (request, callback) => {
    let stream;
    if (request.uploadData) {
      stream = new MultiBufferReadable(
        request.uploadData.map(({ bytes, blobUUID, file }) => {
          if (file) {
            return createReadStream(file);
          } else if (blobUUID) {
            // what is it?
            throw new Error("todo");
          } else {
            return new BufferReadable(bytes);
          }
        })
      );
    }

    const data = await _request(
      {
        hostname: "127.0.0.1",
        port: 8080,
        path: request.url.substring("tarrow://.".length),
        method: request.method,
        headers: request.headers,
      },
      stream
    );

    callback({
      data,
      headers: data.headers,
      method: request.method,
      referrer: request.referrer,
      statusCode: data.statusCode,
    });
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
