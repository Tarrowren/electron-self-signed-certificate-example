const agent = new https.Agent({
  ca: CA_PEM,
  cert: CLIENT_PEM,
  key: CLIENT_KEY,
});

const a = async (options, stream) => {
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
};
