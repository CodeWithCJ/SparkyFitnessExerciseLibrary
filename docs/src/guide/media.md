# Media standards

Media files sit in the exercise folder and are found by name, so `exercise.json` does not need to list them. Every file is named `<folder>_<m|f>_<shape>.<ext>`, where `m` or `f` is the male or female SparkyFitness model.

| File | Purpose |
| --- | --- |
| `<folder>_m_9_16.mp4` | Vertical video |
| `<folder>_m_16_9.mp4` | Horizontal video |
| `<folder>_m_9_16.webp`, `<folder>_m_16_9.webp` | Animated previews |
| `<folder>_m_thumb.webp` | Static thumbnail for cards |

For example `sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.mp4`. `pnpm validate` rejects other names, and slugs are capped at 50 characters so paths stay short enough for Windows.

Videos are H.264 MP4 without audio, 5–15 seconds, 1–2 clean repetitions that start and end in the same position so they loop, and at most 2.5 MB. `pnpm validate` checks the codec, size and duration when `ffprobe` is installed.

`pnpm media` compresses oversized videos, strips audio and generates any missing previews. It also writes the exercise ID, name, model and license into each MP4's metadata, so a video can still be identified if it is renamed. Set `media.thumbnail_timestamp` in `exercise.json` to choose the thumbnail frame, in seconds.

Generated demonstrations follow the [AI video prompts](./prompts/image-to-video): the SparkyFitness character in the SparkyFitness gym, with primary muscles highlighted red or orange, secondary yellow and stabilizers blue.
