# Leonida Trophy Compass — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/bongekanjing/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/bongekanjing/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline, open guide and tracker for all **55 Grand Theft Auto VI trophies** on PlayStation 5 — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden, 0 online — built for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01) on make.fun.

## What it is

- **Tracker** — a checklist saved in your browser (localStorage): tick trophies off, see progress by grade and in PSN points (1,230 total), filter by grade, kind, missable, hidden, earned or still to earn, search, and sort.
- **Guide pane** — click any trophy for its guide in our own words: what to do, steps, difficulty, time, and the sources each fact comes from. Five trophies the community has not solved yet say so honestly instead of inventing steps.
- **Roadmap to the platinum** — three stages, about 200 hours, difficulty 4/10 (PowerPyx). One playthrough is enough; there is no mission replay, so keep a manual save at the start and end of each chapter.
- **The one missable trophy** — Positive Mental Attitude (meditate at every spot) is the only one that can be missed: during Chapter 1, follow Lucia to the balcony at Jason's house and accept the meditation prompt.
- **Spoiler setting** — hides the names and descriptions of story trophies until you earn them.
- **Export / import / share** — save your progress as a JSON file, bring it back on any device, or copy a share link that carries your progress in the URL.
- **Sources page** — every source the guides draw on, and a list of the claims that are still unconfirmed.

## Run it

Serve the `app/` folder over HTTP (it loads its data with `fetch`, so `file://` will not work):

```sh
node serve.ts
# open http://localhost:8080/
```

## Build the entry

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`. Node 22+, standard library only:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

Names, descriptions and grades are the official list as PlayStation publishes it. Guide steps are written in our own words and draw on PowerPyx, GameMapa, EGamers, Vice City Hustle, GTABase, Push Square, Insider Gaming, Mobalytics, games.gg, TrueAchievements and GTA Vibes — named beside each trophy and listed in full in the app's Sources tab. Nothing is copied from them.

Grand Theft Auto and GTA are trademarks of Rockstar Games. This is an unofficial fan guide, not affiliated with Rockstar Games or Sony Interactive Entertainment. No Rockstar artwork or logo is used here.

---

<sub>Entered on [make.fun](https://make.fun/?ref=5mwjqa3r&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
