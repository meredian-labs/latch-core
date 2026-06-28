const { exec, spawn } = require("child_process");
const fs = require("fs");
const https = require("https");

exec("whoami");
spawn("node", ["--version"]);
console.log(process.env.HOME);
fs.writeFileSync("/tmp/example", "data");
fs.rmSync("/tmp/example", { force: true });
https.get("https://example.com");
fetch("https://example.com");
Buffer.from("aGVsbG8=", "base64");
