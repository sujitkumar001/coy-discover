import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const port = 3101;
const base = `http://127.0.0.1:${port}`;
const dbPath = path.join(root, "data", "coy-test.sqlite");

function clearTestDatabase() {
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = dbPath + suffix;
    if (existsSync(file)) {
      rmSync(file, { force: true });
    }
  }
}

function stopServer(server) {
  if (!server?.pid) return;

  try {
    if (process.platform === "win32") {
      execFileSync(
        "taskkill",
        ["/PID", String(server.pid), "/T", "/F"],
        { stdio: "ignore" }
      );
    } else {
      server.kill("SIGTERM");
    }
  } catch {
    // Server may already have exited.
  }
}

async function waitForServer(server, logs) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) {
      throw new Error(
        "Test server exited unexpectedly:\n" + logs.join("")
      );
    }

    try {
      const response = await fetch(`${base}/feed`, {
        signal: AbortSignal.timeout(1500),
      });

      if (response.ok) return;
    } catch {
      // Wait until the server is ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    "Test server did not become ready:\n" + logs.join("")
  );
}

async function getJSON(endpoint) {
  const response = await fetch(`${base}${endpoint}`, {
    cache: "no-store",
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

async function swipe(profileId, action) {
  const response = await fetch(`${base}/swipe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, action }),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

test("Coy Discover API integration", { timeout: 60000 }, async (t) => {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  clearTestDatabase();

  const logs = [];

  const server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules", "next", "dist", "bin", "next"),
      "start",
      "-p",
      String(port),
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        COY_DB_PATH: dbPath,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  server.stdout.on("data", (data) => logs.push(String(data)));
  server.stderr.on("data", (data) => logs.push(String(data)));

  try {
    await waitForServer(server, logs);

    await t.test("Feed contains 30 profiles", async () => {
      const result = await getJSON("/feed");
      assert.equal(result.status, 200);
      assert.equal(result.body.profiles.length, 30);
    });

    await t.test("Incoming likes are private", async () => {
      const result = await getJSON("/feed");

      for (const profile of result.body.profiles) {
        assert.equal("likedYou" in profile, false);
        assert.equal("likedBy" in profile, false);
        assert.equal("incomingLikes" in profile, false);
      }
    });

    await t.test("One-sided Like does not match", async () => {
      const result = await swipe(3, "LIKE");
      assert.equal(result.status, 200);
      assert.equal(result.body.matched, false);
      assert.equal(result.body.match, null);
    });

    await t.test("Mutual Like creates a match", async () => {
      const result = await swipe(2, "LIKE");
      assert.equal(result.status, 200);
      assert.equal(result.body.matched, true);
      assert.equal(result.body.match.profile.id, 2);
    });

    await t.test("Pass does not create a match", async () => {
      const result = await swipe(4, "PASS");
      assert.equal(result.status, 200);
      assert.equal(result.body.matched, false);
    });

    await t.test("Duplicate swipe returns 409", async () => {
      const result = await swipe(2, "LIKE");
      assert.equal(result.status, 409);
    });

    await t.test("Unknown profile returns 404", async () => {
      const result = await swipe(999, "LIKE");
      assert.equal(result.status, 404);
    });

    await t.test("Invalid action returns 400", async () => {
      const result = await swipe(5, "INVALID");
      assert.equal(result.status, 400);
    });

    await t.test("Swiped profiles disappear from feed", async () => {
      const result = await getJSON("/feed");
      const ids = result.body.profiles.map((p) => p.id);

      assert.equal(result.body.profiles.length, 27);
      assert.equal(ids.includes(2), false);
      assert.equal(ids.includes(3), false);
      assert.equal(ids.includes(4), false);
    });

    await t.test("Only mutual matches are returned", async () => {
      const result = await getJSON("/matches");

      assert.equal(result.status, 200);
      assert.equal(result.body.matches.length, 1);
      assert.equal(result.body.matches[0].profile.id, 2);
    });
  } finally {
    stopServer(server);
    await new Promise((resolve) => setTimeout(resolve, 700));
    clearTestDatabase();
  }
});