# Contributing to the SparkyFitness Exercise Library

Thank you for helping improve the library! By taking part you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md). To report a security vulnerability, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

You can browse the catalog at <https://codewithcj.github.io/SparkyFitnessExerciseLibrary/>. The [README](README.md) has the full rules for IDs, file names and media.

## What helps most

- **Fixing exercise data**: a wrong muscle, equipment, step or typo. Every exercise on the [site](https://codewithcj.github.io/SparkyFitnessExerciseLibrary/browse) has a **Suggest an edit** button that opens it prefilled in the generator. You can also open an issue with the "Exercise data issue or request" form.
- **New exercises**: use the [exercise generator](https://codewithcj.github.io/SparkyFitnessExerciseLibrary/contribute). It builds `exercise.json` and works out the ID, folder and file names, then opens the file on GitHub as a pull request. Or follow "Contributing an Exercise" in the README.
- **Translations**: the English text is in each exercise's `exercise.json`; `locales/` is generated, so don't edit it. Other languages are synced through Weblate, and PRs that change them are rejected.
- **Media**: a demonstration video for an exercise that has none (see the media rules below).
- **Tooling and the browse site**: open an issue first for anything larger than a small fix, so we can agree on the approach before you build it.

## Pull request checklist

Every PR must:

- **Pass the checks.** Run `pnpm validate` locally; CI runs it and a full build. You do not need to commit `dist/` or `locales/`: a workflow rebuilds and commits them after the merge. For site changes, `cd docs && pnpm install && pnpm run build` must succeed.
- **Keep IDs stable.** Never change or reuse an existing exercise ID. New IDs are `sf-<body>-<equip>-<number>` with the next free number (see the README).
- **Say where data and media came from**, in the "Source of new data or media" section of the PR template.
- **Use only media you have the right to.** Never add images or videos from other exercise datasets or apps. Anyone shown in a video, or used as source footage, must have agreed to its use. Tick the "Rights & consent" box when the PR adds or changes media.
- **Pick one AI-assistance option.** It tells maintainers how closely to review and is not a judgment on AI use. You remain responsible for fully understanding what you submit.
- **Certify your work.** You confirm your contribution contains no malicious code.
- **License.** By submitting, you agree to the [License terms](LICENSE). The library is free for non-commercial use, and commercial use needs written permission. Section 6 of the license assigns your contribution to the original author. For photos and videos of people, you may instead grant a license and confirm everyone shown has consented.

## Workflow

1. Fork the repository and create a branch.
2. Commit with [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, ...). The PR title must start with a type too.
3. Open a PR and fill in the template. Add any new videos to the exercise folder, next to `exercise.json`, with the exact names the generator shows (each at most 2.5 MB). You do not need to create the previews and the thumbnail: after the merge, a workflow makes them from your video.

## Automated PR checks

A workflow checks every PR: the mandatory checkboxes, a conventional title, one AI-assistance option, and that only `locales/en/` changed. It labels the PR and posts one comment with what is left to do. If you delete a required checkbox from the description, it is added back at the bottom. Please tick it rather than removing it.

Thanks for contributing!
