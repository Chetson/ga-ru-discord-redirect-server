const http = require("http");

const PORT = parseInt(process.env.PORT, 10) || 3000;
const REDIRECT_URL =
  process.env.REDIRECT_URL || "https://discord.com/invite/s6ZgA6S9xn";

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  res.writeHead(302, { Location: REDIRECT_URL });
  res.end();
});

server.listen(PORT, () => {
  console.log(`Redirect server listening on port ${PORT}`);
});
