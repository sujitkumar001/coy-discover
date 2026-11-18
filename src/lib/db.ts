import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { profiles, type Profile } from "@/data/profiles";

const CURRENT_USER_ID = 1;
type SwipeAction = "LIKE" | "PASS";

let connection: Database.Database | undefined;

function getDb() {
  if (connection) return connection;

  const directory = path.join(process.cwd(), "data");
  fs.mkdirSync(directory, { recursive: true });

  const dbPath = process.env.COY_DB_PATH || path.join(directory, "coy.sqlite");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      city TEXT NOT NULL,
      college TEXT NOT NULL,
      bio TEXT NOT NULL,
      photo TEXT NOT NULL,
      interests TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS swipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user INTEGER NOT NULL,
      to_user INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('LIKE', 'PASS')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(from_user, to_user),
      CHECK(from_user != to_user),
      FOREIGN KEY(from_user) REFERENCES profiles(id),
      FOREIGN KEY(to_user) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_a INTEGER NOT NULL,
      user_b INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_a, user_b),
      CHECK(user_a < user_b),
      FOREIGN KEY(user_a) REFERENCES profiles(id),
      FOREIGN KEY(user_b) REFERENCES profiles(id)
    );
  `);

  const seed = db.transaction(() => {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO profiles
      (id, name, age, city, college, bio, photo, interests)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      1, "Demo User", 24, "Delhi", "Demo College",
      "Demo account", "/demo-user.svg", "[]"
    );

    for (const profile of profiles) {
      insert.run(
        profile.id,
        profile.name,
        profile.age,
        profile.city,
        profile.college,
        profile.bio,
        profile.photo,
        JSON.stringify(profile.interests)
      );
    }

    const seedLike = db.prepare(`
      INSERT OR IGNORE INTO swipes
      (from_user, to_user, action)
      VALUES (?, ?, 'LIKE')
    `);

    for (const id of [2, 5, 9, 14, 20, 27]) {
      seedLike.run(id, CURRENT_USER_ID);
    }
  });

  seed();

  const updatePhoto = db.prepare(`
    UPDATE profiles
    SET photo = ?
    WHERE id = ?
  `);

  for (const profile of profiles) {
    updatePhoto.run(profile.photo, profile.id);
  }
  connection = db;
  return db;
}

type ProfileRow = Omit<Profile, "interests"> & {
  interests: string;
};

function toProfile(row: ProfileRow): Profile {
  return {
    ...row,
    interests: JSON.parse(row.interests) as string[],
  };
}

export function getFeed(): Profile[] {
  const rows = getDb().prepare(`
    SELECT p.*
    FROM profiles p
    WHERE p.id != ?
      AND NOT EXISTS (
        SELECT 1 FROM swipes s
        WHERE s.from_user = ?
          AND s.to_user = p.id
      )
    ORDER BY p.id
  `).all(CURRENT_USER_ID, CURRENT_USER_ID) as ProfileRow[];

  return rows.map(toProfile);
}

export function recordSwipe(
  profileId: number,
  action: SwipeAction
) {
  const db = getDb();

  return db.transaction(() => {
    if (!Number.isSafeInteger(profileId) ||
        profileId === CURRENT_USER_ID) {
      throw new Error("INVALID_PROFILE");
    }

    const target = db.prepare(
      "SELECT * FROM profiles WHERE id = ?"
    ).get(profileId) as ProfileRow | undefined;

    if (!target) {
      throw new Error("PROFILE_NOT_FOUND");
    }

    const existing = db.prepare(`
      SELECT id FROM swipes
      WHERE from_user = ? AND to_user = ?
    `).get(CURRENT_USER_ID, profileId);

    if (existing) {
      throw new Error("ALREADY_SWIPED");
    }

    db.prepare(`
      INSERT INTO swipes (from_user, to_user, action)
      VALUES (?, ?, ?)
    `).run(CURRENT_USER_ID, profileId, action);

    let matched = false;
    let matchId: number | null = null;

    if (action === "LIKE") {
      const incoming = db.prepare(`
        SELECT id FROM swipes
        WHERE from_user = ?
          AND to_user = ?
          AND action = 'LIKE'
      `).get(profileId, CURRENT_USER_ID);

      if (incoming) {
        const a = Math.min(CURRENT_USER_ID, profileId);
        const b = Math.max(CURRENT_USER_ID, profileId);

        db.prepare(`
          INSERT OR IGNORE INTO matches (user_a, user_b)
          VALUES (?, ?)
        `).run(a, b);

        const match = db.prepare(`
          SELECT id FROM matches
          WHERE user_a = ? AND user_b = ?
        `).get(a, b) as { id: number };

        matched = true;
        matchId = match.id;
      }
    }

    return {
      matched,
      match: matched
        ? { id: matchId, profile: toProfile(target) }
        : null,
    };
  })();
}

export function getMatches() {
  const rows = getDb().prepare(`
    SELECT
      m.id AS match_id,
      p.*
    FROM matches m
    JOIN profiles p
      ON p.id = CASE
        WHEN m.user_a = ? THEN m.user_b
        ELSE m.user_a
      END
    WHERE m.user_a = ? OR m.user_b = ?
    ORDER BY m.id DESC
  `).all(
    CURRENT_USER_ID,
    CURRENT_USER_ID,
    CURRENT_USER_ID
  ) as (ProfileRow & { match_id: number })[];

  return rows.map(({ match_id, ...profile }) => ({
    id: match_id,
    profile: toProfile(profile),
  }));
}