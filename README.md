# SparkyFitness Exercise Library 🏋️

Exercise catalog, media assets, and multilingual instruction database for the SparkyFitness ecosystem.

Contains **1,908 canonical exercises** with comprehensive biomechanical metadata, equipment taxonomy, muscle engagement targets, and localized instructions across 9 languages.

## Browse the Catalog

Search and filter every exercise by muscle, equipment, level and more, play its video and read its steps in 9 languages: <https://codewithcj.github.io/SparkyFitnessExerciseLibrary/>. Every exercise has a **Suggest an edit** button, and the [Contribute](https://codewithcj.github.io/SparkyFitnessExerciseLibrary/contribute) page builds a new exercise for you. To run the site locally, run `pnpm install` in `docs/`, then `pnpm docs:dev` from the repository root.

## Sample Videos

Demonstrations generated with the SparkyFitness character and gym. Muscle highlights: red/orange for primary, yellow for secondary, blue for stabilizers. Click a preview to open the full MP4.

<table>
  <tr>
    <td align="center">
      <a href="exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.mp4?raw=true"><img src="exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.webp" width="240" alt="Ab wheel rollout demonstration" /></a><br />
      <b>Ab Wheel Rollout</b><br />
      <a href="exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.mp4?raw=true">9:16 MP4</a> · <a href="exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_16_9.mp4?raw=true">16:9 MP4</a>
    </td>
    <td align="center">
      <a href="exercises/sf-legs-bnd-0010_squat_band/sf-legs-bnd-0010_squat_band_m_9_16.mp4?raw=true"><img src="exercises/sf-legs-bnd-0010_squat_band/sf-legs-bnd-0010_squat_band_m_9_16.webp" width="240" alt="Band squat demonstration" /></a><br />
      <b>Band Squat</b><br />
      <a href="exercises/sf-legs-bnd-0010_squat_band/sf-legs-bnd-0010_squat_band_m_9_16.mp4?raw=true">MP4</a>
    </td>
  </tr>
</table>

## Structure

- **`exercises/<id>_<slug>/`** — One folder per exercise (for example `sf-core-oth-0002_ab_wheel_rollout`) containing `exercise.json` and its media (`.mp4`, `.webp`).
- **`locales/<lang>/exercises.json`** — Translation dictionaries synced with Weblate (`en`, `es`, `fr`, `it`, `tr`, `zh`, `hi`, `pl`, `ko`).
- **`taxonomy/`** — Standard muscle (`muscles.json`), equipment (`equipment.json`), and modality (`modalities.json`) lists, plus the catalog ID codes (`catalog-codes.json`).
- **`schema/`** — JSON schema validation rules (`exercise.schema.json`).
- **`dist/exercises.json`** — Consolidated catalog (1,908 exercises) compiled by the build script and rebuilt automatically after every merge.

## CLI & Catalog Inspection

Use `pnpm exercises` to inspect and search the catalog from your terminal:

```bash
# 1. Quick overview (lists first 25 exercises)
pnpm exercises

# 2. Search by name, keyword, or alias
pnpm exercises "bench press"
pnpm exercises "squat"
pnpm exercises "deadlift"

# 3. Filter by muscle group
pnpm exercises --muscle chest
pnpm exercises --muscle biceps
pnpm exercises --muscle quadriceps

# 4. Filter by equipment
pnpm exercises --equipment dumbbell
pnpm exercises --equipment kettlebells
pnpm exercises --equipment cable

# 5. Show catalog statistics & breakdowns
pnpm exercises --stats

# 6. List all 1,908 exercises without pagination
pnpm exercises --all
```

## Example Exercise

The Ab Wheel Rollout from the sample videos above:

```text
exercises/sf-core-oth-0002_ab_wheel_rollout/
├── exercise.json
├── sf-core-oth-0002_ab_wheel_rollout_m_9_16.mp4     # vertical video
├── sf-core-oth-0002_ab_wheel_rollout_m_9_16.webp    # vertical animated preview
├── sf-core-oth-0002_ab_wheel_rollout_m_16_9.mp4     # horizontal video
├── sf-core-oth-0002_ab_wheel_rollout_m_16_9.webp    # horizontal animated preview
└── sf-core-oth-0002_ab_wheel_rollout_m_thumb.webp   # static card thumbnail
```

**`exercise.json`:**
```json
{
  "$schema": "../../schema/exercise.schema.json",
  "id": "sf-core-oth-0002",
  "slug": "ab_wheel_rollout",
  "name": "Ab Wheel Rollout",
  "aliases": [
    "Wheel Rollerout",
    "Ab Roller Rollout",
    "Kneeling Ab Wheel Rollout"
  ],
  "taxonomy": {
    "modality": "weight_reps",
    "category": "waist",
    "body_part": "waist",
    "mechanic": "isolation",
    "force": null,
    "level": "intermediate",
    "equipment": "other",
    "primary_muscles": [
      "abdominals"
    ],
    "secondary_muscles": [
      "lower back"
    ]
  },
  "biomechanics": {
    "laterality": "bilateral",
    "movement_plane": "sagittal",
    "default_tempo": "2-0-2-0",
    "demonstration_reps": 2
  },
  "steps": [
    "Kneel on the floor and place the wheel roller in front of you.",
    "Place your hands on the handles of the wheel roller and extend your arms straight out in front of you.",
    "Engage your core muscles and slowly roll the wheel forward, keeping your back straight and your abs tight.",
    "Continue rolling forward until your body is fully extended and your arms are overhead.",
    "Pause for a moment, then slowly roll the wheel back towards your knees, maintaining control and keeping your abs engaged.",
    "Repeat for the desired number of repetitions."
  ],
  "coaching_cues": [
    "Do not let your lower back sag or hyperextend at full extension",
    "Keep tension in your glutes and core throughout the entire range of motion",
    "Pull back using your abdominals and lats, not by sitting back onto your heels"
  ],
  "media": {
    "thumbnail_timestamp": 3
  }
}
```

The `media` block is optional; here it only picks the thumbnail frame (`thumbnail_timestamp`, in seconds). The build finds the media files by their names and writes this into `dist/exercises.json`:

```json
"media": {
  "video_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.mp4",
  "video_vertical_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.mp4",
  "video_horizontal_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_16_9.mp4",
  "animation_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.webp",
  "animation_vertical_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.webp",
  "animation_horizontal_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_16_9.webp",
  "thumbnail_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_thumb.webp",
  "image_path": null,
  "male": {
    "video_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.mp4",
    "video_vertical_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.mp4",
    "video_horizontal_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_16_9.mp4",
    "animation_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.webp",
    "animation_vertical_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_9_16.webp",
    "animation_horizontal_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_16_9.webp",
    "thumbnail_path": "exercises/sf-core-oth-0002_ab_wheel_rollout/sf-core-oth-0002_ab_wheel_rollout_m_thumb.webp",
    "image_path": null
  }
}
```

The flat keys are the default set (male, or female when that is all there is). `male` and `female` list each model's own files and are only present when that model has media.

## Media Standards & Auto-Discovery

Media files are **auto-discovered by filename convention** inside each exercise folder:

| Asset Type | File Naming Convention | Description |
| :--- | :--- | :--- |
| **Vertical Video (9:16)** | `<folder>_<m\|f>_9_16.mp4` | 720×1280 portrait loop (ideal for mobile full-screen / tutorial) |
| **Horizontal Video (16:9)**| `<folder>_<m\|f>_16_9.mp4` | 1280×720 widescreen (ideal for web, desktop & compact logger) |
| **Animated Preview** | `<folder>_<m\|f>_9_16.webp` / `<folder>_<m\|f>_16_9.webp` | Looping preview of the video with the same name (~160–460 KB) |
| **Thumbnail Image** | `<folder>_<m\|f>_thumb.webp` (or `.jpg`, `.png`) | Card thumbnail image (~15–40 KB) |

`<folder>` is the exercise's folder name, for example `sf-core-oth-0002_ab_wheel_rollout`. `m` or `f` says whether the male or the female SparkyFitness model demonstrates the exercise. Every file in an exercise folder must follow this pattern; `pnpm validate` rejects other names.

### Video Encoding Guidelines
- **Codec:** H.264 (`libx264`)
- **Audio:** Silent (`-an`) for smooth seamless looping
- **Optimization:** Web-ready `+faststart`
- **Target Size:** ~0.5 MB to 1.5 MB (hard cap 2.5 MB)
- **Duration:** 5 to 15 seconds (shows 1–2 complete repetitions)
- **Metadata:** `pnpm media` writes the exercise ID, name, model and license into each MP4's title, comment and copyright tags, so a video can still be identified if it is renamed or copied out of its folder

## Media Optimization CLI

Whenever you add or update raw video files, run the automated media optimizer:

```bash
# 1. Automatically compress oversized videos, strip audio, and generate missing .webp previews
pnpm media

# 2. Extract 4 candidate thumbnail frames across the rep cycle to pick the best action frame
pnpm media candidates sf-core-oth-0002

# 3. Force re-encoding of all media
pnpm media force-all
```

*(If you wish to specify an exact timestamp for the thumbnail in `exercise.json`, you can optionally add `"media": { "thumbnail_timestamp": 3.0 }`).*

## Taxonomy Reference

`exercise.json` enforces canonical taxonomy values matching the SparkyFitness ecosystem:

* **Modality (`taxonomy.modality`):**  
  `weight_reps` · `bodyweight_reps` · `reps_only` · `weight_duration` · `weight_distance` · `duration` · `duration_distance`
* **Equipment (`taxonomy.equipment`):**  
  `barbell` · `dumbbell` · `kettlebells` · `cable` · `machine` · `bands` · `body only` · `medicine ball` · `exercise ball` · `foam roll` · `e-z curl bar` · `other`
* **Muscles (`primary_muscles` / `secondary_muscles`):**  
  `abdominals` · `abductors` · `adductors` · `biceps` · `calves` · `chest` · `forearms` · `glutes` · `hamstrings` · `lats` · `lower back` · `middle back` · `neck` · `quadriceps` · `shoulders` · `traps` · `triceps`
* **Mechanic & Force:**  
  `mechanic`: `compound` · `isolation` · `other`  
  `force`: `push` · `pull` · `static` · `other`  
  `level`: `beginner` · `intermediate` · `advanced`

*(See the `taxonomy/` folder for complete schema definitions).*

## Contributing an Exercise

**Easiest way:** use the [exercise generator](https://codewithcj.github.io/SparkyFitnessExerciseLibrary/contribute). It builds `exercise.json`, works out the ID, folder and media file names, checks them with the same rules as `pnpm validate`, and opens the file on GitHub so you can send it as a pull request without installing anything.

Or follow these step-by-step instructions to add a new exercise by hand:

### 1. Choose the ID & Folder Name
Every exercise gets a catalog ID of the form **`sf-<body>-<equip>-<number>`**, all lowercase, for example `sf-arms-db-0007`.

* **Body code**: the first primary muscle decides it (`taxonomy.category` `cardio` is always `card`).

  | Code | Muscles |
  | :--- | :--- |
  | `chest` | chest |
  | `back` | lats, middle back, lower back, traps |
  | `shld` | shoulders, neck |
  | `arms` | biceps, triceps, forearms |
  | `legs` | quadriceps, hamstrings, glutes, calves, abductors, adductors |
  | `core` | abdominals |
  | `card` | cardio / conditioning |

* **Equipment code**: taken from `taxonomy.equipment`.

  | Code | Equipment | Code | Equipment |
  | :--- | :--- | :--- | :--- |
  | `bb` | barbell | `bnd` | bands |
  | `db` | dumbbell | `bal` | medicine ball, exercise ball |
  | `kb` | kettlebells | `ez` | e-z curl bar |
  | `bw` | body only | `cbl` | cable |
  | `mch` | machine | `oth` | other, foam roll |

* **Number**: the next free 4-digit number in that body/equipment pair. List what exists with `pnpm exercises sf-arms-db-` and take the next one.
* **An ID never changes** once it is published, even if the exercise is later reclassified. Apps and translations rely on it. The codes in `taxonomy/catalog-codes.json` are the single source of the rules.
* **Expected Naming Convention Format**:
  * **Folder Name**: `exercises/<id>_<slug>/` (e.g., `exercises/sf-legs-bnd-0035_band_lateral_walk/`).
  * **`id`**: The catalog ID only (`"sf-legs-bnd-0035"`).
  * **`slug`**: Lowercase snake_case, at most 50 characters (`"band_lateral_walk"`).
  * **`name`**: Clean Title Case display name (`"Band Lateral Walk"`).
* **Word Order Standards**:
  * **Weighted / Machine exercises**: `[Equipment] [Angle/Grip] [Movement]` (e.g. *Barbell Bench Press*, *Dumbbell Incline Bench Press*, *Cable Triceps Pushdown*, *Band Squat*).
  * **Bodyweight / Calisthenics**: `[Movement]` (e.g. *Push-up*, *Pull-up*, *Air Bike*, *Plank*).
  * **Search Synonyms**: Put common variations or inverted word orders into the **`aliases`** array (e.g. `aliases: ["Incline Barbell Bench Press"]`).
* Check whether the exercise already exists with `pnpm exercises "<name>"`.

### 2. Create `exercise.json`
* Copy an existing `exercise.json` (like the Ab Wheel Rollout example above).
* Fill in the canonical taxonomy, biomechanics, and clear English **`steps`** (which serve as the source of truth for translations).
* **You do not need to write a `"media"` block** — media files are auto-discovered from the folder.

### 3. Add Media & Auto-Optimize
* Drop your video (`.mp4`) into the exercise folder following the naming convention:
  * `<folder>_m_9_16.mp4` for vertical video, or `<folder>_m_16_9.mp4` for horizontal video (or both!). Use `f` instead of `m` for the female model.
* Run the media optimizer commands:
  ```bash
  # Optimize only missing or unoptimized media across all exercises:
  pnpm media

  # Force re-encode all exercises:
  pnpm media force-all

  # Force re-encode only one specific exercise:
  pnpm media force sf-core-oth-0002

  # Preview candidate thumbnail frames to pick the best action frame timestamp:
  pnpm media candidates sf-core-oth-0002
  ```
  *This automatically compresses videos to ≤ 1.5 MB, mutes audio (`-an`), adds `+faststart`, and generates:*
  * `<folder>_m_thumb.webp`: Lightweight static card thumbnail (360x640 / 640x360, ~15–25 KB).
  * `<folder>_m_9_16.webp` / `<folder>_m_16_9.webp`: Full-duration animated WebP preview loops (~160–460 KB) with 24-bit true color for smooth mobile & web playback and compact offline caching.

### 4. Validate
Before opening the PR, run:
```bash
pnpm validate   # Must pass with zero errors
```
You do **not** need to run `pnpm build` or commit `dist/` or `locales/`: after your PR is merged, a workflow rebuilds and commits them. Run `pnpm build` only to try the result locally (for example with `pnpm exercises` or `pnpm docs:dev`).

### 5. What to Commit & Submit in PR
Videos live in the exercise folder and are committed like any other file. In your pull request, include:
* ✅ `exercises/<folder>/exercise.json`
* ✅ The compressed MP4 video(s) in the same folder: `<folder>_m_9_16.mp4` (vertical, recommended) and optionally `<folder>_m_16_9.mp4` (horizontal), at most 2.5 MB each. Use `f` instead of `m` for a female model.
* ✅ The thumbnail and animated previews that `pnpm media` creates from them: `<folder>_m_thumb.webp`, `<folder>_m_9_16.webp` and `<folder>_m_16_9.webp`. Editing on github.com? Skip these: after the merge, a workflow creates them from your video.

## AI Video Generation Prompts

If you are using generative AI to produce new 3D anatomy exercise demonstration videos:
* [Image-to-Video Prompt Guide](prompts/image-to-video.md) — When creating video demonstrations from 2D reference images or diagrams.
* [Video-to-Video Prompt Guide](prompts/video-to-video.md) — When transforming existing raw exercise footage into consistent SparkyFitness branded demonstrations.

## Common Commands

```bash
pnpm exercises           # Interactive exercise inspector & search CLI (e.g. pnpm exercises "bench press")
pnpm validate            # Validates catalog IDs, folder and media names, taxonomy, and video codec/sizes
pnpm build               # Compiles dist/exercises.json with auto-discovered media & syncs Weblate
pnpm media               # In-place video compression and auto-generation of WebP previews
pnpm docs:dev            # Runs the browse site locally (run pnpm install in docs/ first)
pnpm docs:build          # Builds the browse site into docs/.vitepress/dist
```

## Using the Catalog

SparkyFitness imports `dist/exercises.json` from a tagged release of this repository. Apps should pin a release tag rather than read `main`, and key exercises by their `id`, which never changes. `folder` gives the exercise's directory, and every media path is relative to the repository root.

Each [release](https://github.com/CodeWithCJ/SparkyFitnessExerciseLibrary/releases) carries `exercises.json` (the catalog), `locales.zip` (all translations), the `LICENSE` and `NOTICE.md` that must travel with them, and `SHA256SUMS.txt`. Versions follow the effect on apps: **major** for ID or schema changes, **minor** for new exercises, media or fields, **patch** for fixes.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). AI tools and developers: read [`AGENTS.md`](AGENTS.md) first.

## License & Credits

Free for personal, educational and other non-commercial use; commercial use needs written permission. This covers the exercise data, translations, images and videos as well as the code. The SparkyFitness name, logo and character are not licensed for branding your own work. See [`LICENSE`](LICENSE).

Parts of the exercise data were adapted from open-source datasets under permissive licenses. The notices they require are in [`NOTICE.md`](NOTICE.md). No third-party media is included, and none may be added without a license.
