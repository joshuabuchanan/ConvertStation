import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";

const interfaces = networkInterfaces();
const networkAddress = Object.values(interfaces)
  .flatMap((entries) => entries ?? [])
  .find(({ family, address, internal }) =>
    family === "IPv4" && !internal && !address.startsWith("169.254.")
  )?.address;

const nextCommand = process.platform === "win32" ? "next.cmd" : "next";
const nextArguments = ["dev", "-H", "0.0.0.0", ...process.argv.slice(2)];
const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : nextCommand;
const argumentsList = process.platform === "win32"
  ? ["/d", "/s", "/c", nextCommand, ...nextArguments]
  : nextArguments;
const nextProcess = spawn(command, argumentsList, {
  stdio: ["inherit", "pipe", "pipe"],
});

const rewriteNetworkUrl = (chunk) => {
  const output = chunk.toString().replace(
    /(Network:\s+http:\/\/)0\.0\.0\.0:(\d+)/g,
    (_, prefix, port) => `${prefix}${networkAddress ?? "localhost"}:${port}`
  );
  process.stdout.write(output);
};

nextProcess.stdout.on("data", rewriteNetworkUrl);
nextProcess.stderr.pipe(process.stderr);
nextProcess.on("close", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
