# Contributing an exercise

1. **Pick the ID and folder.** The ID is `sf-<body>-<equip>-<number>`: the body code from the first primary muscle, the equipment code from the equipment, and the next free number for that pair. Find it with `pnpm exercises sf-arms-db-`. Name the folder `<id>_<slug>`, for example `sf-legs-bnd-0011_band_lateral_walk`. See [Using the catalog](./) for the codes.
2. **Write `exercise.json`.** Copy an existing exercise and change it. Equipment and muscles must use the values in `taxonomy/`; `pnpm validate` rejects anything else.
3. **Add media (optional).** Put the video in the same folder and run `pnpm media` to compress it and generate the previews. See [Media standards](./media).
4. **Validate and build.** Run `pnpm validate`, then `pnpm build`, and commit the rebuilt `dist/exercises.json`. CI fails when it is out of date.
5. **Open a pull request.** Say where any new data or media came from and under which license.

Only edit English text in `locales/en/`. Other languages are synced through Weblate.

Media must be your own work or licensed to you. Never add images or videos from other exercise datasets or apps.
