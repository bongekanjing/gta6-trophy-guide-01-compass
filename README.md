# Leonida Trophy Compass

The offline guide and tracker for all 55 PlayStation 5 trophies of
**Grand Theft Auto VI** — built for the make.fun bounty
`gta6-trophy-guide-01`.

## What it is

A static web app under `app/` that opens in desktop Chrome and works with
the network off. No build step, no account, no network requests at run time.

- **Every trophy, exactly as PlayStation publishes it** — all 55 official
  names, descriptions and grades (1 platinum, 2 gold, 6 silver, 46 bronze;
  28 hidden), in `app/data/trophies.json`.
- **A guide to each trophy in our own words**, with its sources named
  beside it: what to do, where and how, and when it can be missed. The
  guides are written from the official descriptions; where a place or step
  is not pinned down by the official list, the guide says so instead of
  inventing one.
- **A tracker** — a checklist saved in the browser (localStorage), with
  export to a JSON backup file and import back, filters by kind and grade,
  text search, and a spoiler setting that hides the names and descriptions
  of story trophies until they are earned.
- **A roadmap to the platinum** in five stages, in order — story first,
  the missables while the story is still open, side strands, the activity
  and collection grinds, then money and 100% completion.
- **The missables flagged** — eight trophies that are easiest, or only
  reliably available, while a particular setup is in place, each with its
  own note on why it is flagged.

## Sources

Trophy names, descriptions, grades and PSN progress targets: the official
PlayStation 5 list as published on
[Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/)
and
[PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi)
(18 November 2026). Every guide is this project's own words, written from
the official descriptions — not yet checked in the game. No Rockstar Games
logo or official artwork is used; the look is our own. This is an
unofficial fan guide, not affiliated with Rockstar Games or PlayStation.

## The spoiler setting

Turn on **Hide story spoilers** and every story trophy you have not earned
yet shows as "Hidden trophy" — no name, no description — until you earn it.
It mirrors how PlayStation hides its 28 hidden trophies, so you can use the
checklist without the story being spoiled for you. Earned trophies always
show their full details, and the setting itself is saved with your progress.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` through any static file server with `app/` at its
root. A demo playthrough (13 trophies earned) can be previewed at
`/?demo=1`; it only fills an empty save, never overwrites one.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22) copies `app/` and `screenshots/` to the output
directory and writes `dossier.json` with the vendored
`vendor/makefun-frontend.ts` library.

Screenshots in `screenshots/` are real renders of this app's own code in
headless Chrome at 1280×800 — see `shots.json` for the views:

1. `01-cover.jpg` — the checklist with a trophy guide open
2. `02-roadmap.jpg` — the roadmap to the platinum
3. `03-missables.jpg` — the missable trophies
4. `04-spoiler.jpg` — the checklist with the spoiler setting on

## License

MIT — see `LICENSE`.
