# Coy Discover — SDE Intern Assignment

A mobile-first, swipe-based discovery application built as a standalone implementation for Coy's Software Development Engineer Intern assignment.

The project demonstrates profile discovery, gesture-based interactions, persistent swipe records, mutual matching, and privacy-conscious backend design.

## Features

- Discover tab with 30 seeded mock profiles
- Profile cards displaying name, age, location, college, bio, and interests
- Swipe right to Like and left to Pass
- Desktop Like and Pass buttons
- Smooth swipe animations with Motion for React
- Persistent swipe history using SQLite
- No repeated profiles after a recorded swipe
- Mutual matching when both users have liked each other
- "It's a match!" popup
- Matches tab displaying confirmed mutual matches
- Empty state after all available profiles have been reviewed
- Fixed mobile header and bottom navigation
- Local illustrated avatars generated using DiceBear

The Home tab is intentionally a blank placeholder, as specified in the assignment.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Animation | Motion for React |
| Icons | Lucide React |
| Backend | Next.js Route Handlers |
| Database | SQLite using better-sqlite3 |
| Testing | Node.js built-in test runner |
| Mock avatars | DiceBear |

## Requirements

- Node.js 20 or a compatible newer supported version
- npm
- Local filesystem access for SQLite

No external authentication service or hosted database is required.

The application assumes a single logged-in demo user.

## Installation

Clone the repository:

```bash
git clone https://github.com/sujitkumar001/coy-discover.git
cd coy-discover
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

http://localhost:3000

The SQLite database is created and seeded automatically when a backend database operation first runs.

## Application Navigation

### Home

Intentionally blank as requested in the assignment.

### Discover

Displays one profile at a time.

- Swipe left or press X to Pass
- Swipe right or press the heart button to Like
- Previously swiped profiles are excluded from future feeds
- A mutual Like triggers the match popup
- The feed displays an empty state when no profiles remain

### Matches

Shows only confirmed mutual matches.

Incoming Likes that have not become mutual matches are not revealed.

## Backend APIs

The application provides the following endpoints.

### GET /feed

Returns profiles that the demo user has not swiped on.

Example:

```json
{
  "profiles": [
    {
      "id": 2,
      "name": "Ananya",
      "age": 21,
      "city": "Delhi",
      "college": "Delhi University",
      "bio": "Coffee, conversations, and spontaneous adventures.",
      "photo": "/profiles/profile-2.svg",
      "interests": ["Travel", "Movies", "Reading"]
    }
  ]
}
```

The response does not disclose whether a profile has already liked the demo user.

### POST /swipe

Records a Like or Pass.

Request:

```json
{
  "profileId": 2,
  "action": "LIKE"
}
```

Example mutual-match response:

```json
{
  "matched": true,
  "match": {
    "id": 1,
    "profile": {
      "id": 2,
      "name": "Ananya",
      "age": 21
    }
  }
}
```

The match profile in the actual response includes additional public profile fields.

A non-matching swipe returns:

```json
{
  "matched": false,
  "match": null
}
```

Error handling includes:

- 400: Invalid request or swipe action
- 404: Unknown profile
- 409: Profile already swiped
- 500: Unexpected backend error

### GET /matches

Returns confirmed mutual matches only.

Example:

```json
{
  "matches": [
    {
      "id": 1,
      "profile": {
        "id": 2,
        "name": "Ananya",
        "age": 21
      }
    }
  ]
}
```

## Database Design

The SQLite database contains three tables.

### profiles

Stores seeded mock profile information.

### swipes

Stores directional interactions:

- from_user
- to_user
- action
- created_at

A unique constraint on from_user and to_user prevents duplicate swipes.

### matches

Stores confirmed mutual matches.

A canonical user-pair ordering and unique constraint prevent duplicate matches.

## Matching Logic

A match occurs only when:

1. The current user Likes a profile.
2. That profile has previously Liked the current user.
3. The backend confirms both Like records.
4. The pair is stored as a mutual match.

A Pass never creates a match.

The swipe and resulting match are recorded in a SQLite transaction.

## Privacy Design

Coy's privacy requirement is that users must not discover who has liked them unless the Like is mutual.

The backend enforces this by:

- Excluding incoming-Like information from GET /feed
- Performing mutual-Like checks on the server
- Returning matched profile details only when the mutual condition is satisfied
- Returning only confirmed matches from GET /matches

Incoming Likes are seeded only in the backend database.

## Demo Data

The application seeds 30 mock profiles.

Demo user ID: 1

Selected mock profiles have pre-existing incoming Likes so the matching flow can be demonstrated.

All profile avatars are locally stored SVG illustrations.

No real user accounts or third-party authentication are required.

## Persistence

SQLite stores swipes and confirmed matches.

Previously swiped profiles remain excluded after browser refreshes and application restarts, provided the same database file is retained.

By default, SQLite is stored at:

```text
data/coy.sqlite
```

The database file is excluded from Git.

The optional COY_DB_PATH environment variable can point the application to another SQLite database file.

## Automated Testing

Build the application:

```bash
npm run build
```

Run API integration tests:

```bash
node --test tests/api.integration.test.mjs
```

The tests launch an isolated server on port 3101 and use a separate temporary SQLite database.

Tests cover:

1. Initial feed contains 30 profiles
2. Incoming Likes are not exposed in feed responses
3. One-sided Likes do not create matches
4. Mutual Likes create matches
5. Passes do not create matches
6. Duplicate swipes return HTTP 409
7. Unknown profiles return HTTP 404
8. Invalid swipe actions return HTTP 400
9. Previously swiped profiles disappear from the feed
10. Matches API returns only mutual matches

The latest verified integration test run passed all 10 subtests.

## Additional Quality Checks

TypeScript:

```bash
npx tsc --noEmit
```

ESLint:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

## Project Structure

```text
src/
  app/
    page.tsx
    feed/route.ts
    swipe/route.ts
    matches/route.ts
  components/
    ProfileCard.tsx
    SwipeDeck.tsx
    MatchesView.tsx
  data/
    profiles.ts
  lib/
    db.ts

public/
  profiles/

scripts/
  generate-avatars.mjs

tests/
  api.integration.test.mjs
```

## Implementation Notes and Limitations

- This is a standalone assignment project, not Coy's production codebase.
- Authentication is intentionally omitted according to the assignment.
- A single logged-in demo user is assumed.
- Profile data and incoming Likes are seeded for demonstration.
- SQLite requires persistent filesystem storage.
- Deployment to serverless environments with ephemeral or read-only storage requires a different database configuration.
- The frontend and backend are intended for local evaluation or deployment with persistent storage.
- Automated tests currently focus on the required API behavior.

## Submission

Created for the Coy Software Development Engineer Intern take-home assignment.

The source code is provided for technical evaluation, including the frontend, backend, database initialization, and automated tests.