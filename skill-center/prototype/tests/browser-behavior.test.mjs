import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function dumpFixture(profile, width) {
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-sync",
      "--metrics-recording-only",
      "--no-first-run",
      "--disable-crash-reporter",
      "--disable-features=OptimizationHints,MediaRouter,AutofillServerCommunication",
      "--allow-file-access-from-files",
      `--window-size=${width},900`,
      `--user-data-dir=${profile}`,
      "--virtual-time-budget=1000",
      "--dump-dom",
      pathToFileURL(path.join(root, "tests/browser-behavior.html")).href
    ]);
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(new Error(`Chrome fixture timed out\n${stderr}`));
    }, 10000);

    child.stdout.on("data", chunk => {
      stdout += chunk;
      if (!settled && stdout.includes("</html>")) {
        settled = true;
        clearTimeout(timer);
        child.kill("SIGTERM");
        resolve({ stdout, stderr });
      }
    });
    child.stderr.on("data", chunk => {
      stderr += chunk;
    });
    child.once("error", error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Chrome exited with ${code}\n${stderr}`));
    });
  });
}

test("real DOM keeps admin actions stable and renders the no-context Skill shell without overflow", async t => {
  for (const width of [1280, 1440, 1920]) {
    const profile = await mkdtemp(path.join(os.tmpdir(), "skill-center-chrome-"));
    t.after(async () => {
      await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    });
    const { stdout, stderr } = await dumpFixture(profile, width);
    assert.match(stdout, /id="test-results" data-status="passed"/, `viewport ${width}: ${stderr || stdout}`);
  }
});
