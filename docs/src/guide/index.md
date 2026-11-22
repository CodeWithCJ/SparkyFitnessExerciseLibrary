# Using the catalog

The whole library compiles to one file, `dist/exercises.json`: an array of every exercise with its taxonomy, biomechanics, steps, coaching cues and media paths. Translations live in `locales/<lang>/exercises.json`, keyed by exercise ID.

SparkyFitness imports the catalog from a tagged release of this repository. Apps should pin a release tag rather than read `main`.

## Exercise IDs

Every exercise has a catalog ID of the form `sf-<body>-<equip>-<number>`, for example `sf-core-oth-0002` for the Ab Wheel Rollout. Its folder is `<id>_<slug>`.

- The **body code** (`chest`, `back`, `shld`, `arms`, `legs`, `core`, `card`) comes from the first primary muscle.
- The **equipment code** (`bb`, `db`, `kb`, `bw`, `cbl`, `mch`, `bnd`, `bal`, `ez`, `oth`) comes from the equipment.
- The **number** is the next free one for that pair.

An ID never changes after it is published, even if the exercise is later reclassified, so apps and translations can rely on it. The full rules are in `taxonomy/catalog-codes.json`.

## Fields

| Field | Values |
| --- | --- |
| `id` | The catalog ID, the key everywhere |
| `folder` | The exercise's directory, `<id>_<slug>` |
| `taxonomy.equipment` | 12 values from `taxonomy/equipment.json` |
| `taxonomy.primary_muscles`, `secondary_muscles` | 17 muscles from `taxonomy/muscles.json` |
| `taxonomy.modality` | How the exercise is tracked, from `taxonomy/modalities.json` |
| `taxonomy.level` | `beginner`, `intermediate`, `expert` |
| `taxonomy.mechanic` | `compound`, `isolation` |
| `biomechanics` | Laterality, movement plane, default tempo, demonstration reps |
| `media` | Video, animation and thumbnail paths, filled in by the build |

The JSON schema in `schema/exercise.schema.json` is the full reference.
