const { app, BrowserWindow, protocol } = require("electron");
const { readFile } = require("node:fs/promises");
const { join } = require("node:path");
const { Agent, fetch } = require("undici");

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
  const agent = new Agent({ connect: { ca, cert, key } });

  protocol.handle("https", (request) => {
    const url = new URL(request.url);

    return fetch(url, {
      body: request.body,
      credentials: request.credentials,
      duplex: "half",
      headers: request.headers,
      integrity: request.integrity,
      keepalive: request.keepalive,
      method: request.method,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      signal: request.signal,
      dispatcher: url.hostname === "127.0.0.1" ? agent : undefined,
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
