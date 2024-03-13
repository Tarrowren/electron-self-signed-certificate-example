// @ts-check

import { app, BrowserWindow, protocol } from "electron";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Agent } from "undici";

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: resolve("preload.js"),
    },
  });

  win.loadURL("https://127.0.0.1:8080");
  // win.loadURL("https://developer.mozilla.org");
}

Promise.all([
  app.whenReady(),
  readFile("cert/ca.crt"),
  readFile("cert/client.crt"),
  readFile("cert/client.key"),
]).then(([_, ca, cert, key]) => {
  const agent = new Agent({
    connect: {
      ca,
      cert,
      key,
    },
  });

  protocol.handle("https", (request) => {
    const url = new URL(request.url);

    return fetch(request, {
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
