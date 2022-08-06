const { BufferReadable } = require("buffer-readable");
const { app, BrowserWindow, protocol } = require("electron");
const { createReadStream } = require("fs");
const { readFile } = require("fs/promises");
const { Agent, request: _request } = require("https");
const { MultiBufferReadable } = require("multi-readable");
const { join } = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
    },
  });

  win.loadURL("https://127.0.0.1:8080");
  // win.loadURL("https://developer.mozilla.org");
}

app.whenReady().then(async () => {
  const [ca, cert, key] = await Promise.all([
    readFile("cert/ca.crt"),
    readFile("cert/client.crt"),
    readFile("cert/client.key"),
  ]);
  const agent = new Agent({ ca, cert, key });

  protocol.interceptStreamProtocol("https", (request, callback) => {
    const url = new URL(request.url);

    const req = _request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search + url.hash,
        method: request.method,
        headers: request.headers,
        agent: url.hostname === "127.0.0.1" ? agent : false,
        timeout: 10000,
      },
      (res) => {
        callback({
          data: res,
          headers: res.headers,
          method: request.method,
          referrer: request.referrer,
          statusCode: res.statusCode,
        });
      }
    )
      .on("error", (err) => {
        throw err;
      })
      .on("timeout", () => {
        req.destroy(new Error("timeout"));
      });

    const uploadData = request.uploadData;
    if (uploadData && uploadData.length > 0) {
      new MultiBufferReadable(
        uploadData.map(({ bytes, blobUUID, file }) => {
          if (file) {
            return createReadStream(file);
          } else if (blobUUID) {
            // what is it?
            throw new Error("todo");
          } else {
            return new BufferReadable(bytes);
          }
        })
      ).pipe(req);
    } else {
      req.end();
    }
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
