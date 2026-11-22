# Contributing an exercise

0. **Easiest: use the [exercise generator](/contribute).** It builds `exercise.json`, works out the ID, folder and file names, and opens the file on GitHub as a pull request. Every exercise also has a **Suggest an edit** button. Or do it by hand:
1. **Pick the ID and folder.** The ID is `sf-<body>-<equip>-<number>`: the body code from the first primary muscle, the equipment code from the equipment, and the next free number for that pair. Find it with `pnpm exercises sf-arms-db-`. Name the folder `<id>_<slug>`, for example `sf-legs-bnd-0035_band_lateral_walk`. See [Using the catalog](./) for the codes.
2. **Write `exercise.json`.** Copy an existing exercise and change it. Equipment and muscles must use the values in `taxonomy/`; `pnpm validate` rejects anything else.
3. **Add media (optional).** Put the video in the same folder and run `pnpm media` to compress it and generate the previews. See [Media standards](./media).
4. **Validate.** Run `pnpm validate`. You do not need to run `pnpm build` or commit `dist/` or `locales/`: a workflow rebuilds and commits them after the merge.
5. **Open a pull request.** Say where any new data or media came from and under which license.

The English text is in `exercise.json`; `locales/` is generated, so don't edit it. Other languages are synced through Weblate.

Media must be your own work or licensed to you. Never add images or videos from other exercise datasets or apps.
