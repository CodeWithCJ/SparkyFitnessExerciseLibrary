# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities in public issues, pull requests or on Discord.

Report them privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**, or go to <https://github.com/CodeWithCJ/SparkyFitnessExerciseLibrary/security/advisories/new>. Only the maintainers can see the report.

Relevant issues here include a script in `scripts/` that can be made to read or write outside the repository, run unexpected commands, or process a crafted media file unsafely, and a change to `dist/exercises.json` that could harm an app that imports it.

Problems in the SparkyFitness app itself belong in the [main repository's security policy](https://github.com/CodeWithCJ/SparkyFitness/security/policy).

SparkyFitness is maintained by volunteers, so response times are best effort. We aim to acknowledge a report within 7 days. Please give us reasonable time to release a fix before you disclose the issue publicly.
