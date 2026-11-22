> [!TIP]
> Run `pnpm validate` and `pnpm build` before you submit, and commit the rebuilt `dist/exercises.json`. CI fails if it is out of date.
>
> - Translations: only edit `locales/en/`. Other languages are synced through Weblate.
> - New exercises: follow the ID and folder naming rules in the README.
> - Media: only original work or media you have the right to license. Never add media from other exercise datasets or apps.
>
> Title format: start with a type, like `feat:`, `fix:`, `docs:` or `refactor:`.

## Description

**What does this PR change?**
(1–2 sentences.)

**Source of new data or media:**
(Where the exercise data, instructions or media came from, and its license.)

Linked Issue: Closes #

## PR Type

- [ ] New or changed exercises
- [ ] Media
- [ ] Tooling / schema
- [ ] Documentation

## Checklist

- [ ] **[MANDATORY - ALL] Integrity & License**: I certify this is my own work or properly licensed, free of malicious code, and I agree to the [License terms](https://github.com/CodeWithCJ/SparkyFitnessExerciseLibrary/blob/main/LICENSE).
- [ ] **Media** (if any): I have the rights to it, and anyone shown, or used as source footage, agreed to it.
- [ ] `pnpm validate` passes and `dist/exercises.json` is rebuilt.

## AI Assistance

Pick **one**. This helps maintainers choose how closely to review.

- [ ] **No AI**: I wrote this change without AI tools.
- [ ] **AI, reviewed line by line**: AI wrote part of this. I read every generated line and edited it before accepting.
- [ ] **AI, tested and partly understood**: AI wrote most of this. I checked the result, but only partly reviewed it.
- [ ] **AI, tested only**: AI wrote this and I did not review it myself.

## Notes for Reviewers

> Optional.
