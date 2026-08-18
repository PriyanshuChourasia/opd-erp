# Queue Display — Live TV Screen

## What is this page?

The Queue Display (`/display`) is a full-screen, TV-style view for the waiting-area monitor. It automatically shows the live patient queue grouped by doctor, so patients can see whose turn is next. It is read-only and designed to run unattended.

## Actions & Effects

- **Monitor the queue** — View "Now Serving" tokens and waiting tokens per doctor. Effect: none; the page is read-only.
- **No interaction** — The display updates itself; nothing on the page is clickable.

## Events

- **Live clock** — A 1-second interval updates the clock and date in the header.
- **Auto-refresh** — Queue data refetches every 5 seconds.
- **Status logic** — IN_PROGRESS entries render as "Now Serving"; WAITING entries render in the waiting list per doctor.

## Features

- Per-doctor panels with large "Now Serving" tokens and waiting-token chips.
- Waiting count per doctor.
- High-contrast black layout with large typography for long-distance readability.
