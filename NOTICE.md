# Notices

The SparkyFitness Exercise Library is licensed under [`LICENSE`](LICENSE): free for non-commercial use, and commercial use needs written permission.

Parts of the exercise data were adapted from open-source datasets published under permissive licenses, then curated, extended and translated for SparkyFitness. The notice that one of those licenses requires is reproduced below, and travels with every release. No images or videos from third-party datasets are included. The only third-party media are the exercise videos by Your Move listed below.

## Exercise data

Includes names, categories, muscle and equipment data, and instruction text and translations adapted from an open-source dataset:

```text
MIT License

Copyright (c) 2026 Hasan Emir Yıldırım

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation and data files (the "Software"),
to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Free Exercise DB

1,236 exercises list an ID from the [free-exercise-db](https://github.com/yuhonas/free-exercise-db) project in `sources.free_id`; their names and exercise details were matched with, and in part adapted from, that dataset. It is released into the public domain under [The Unlicense](https://unlicense.org/), which requires no notice. It is credited here as a courtesy. No images from it are included.

## Body map figures (browse site)

The female figure's paths were converted from react-native-body-highlighter 3.2.0 (MIT, Copyright (c) 2022 ELABBASSI Hicham). The full notice is kept in the header of `muscle-female.svg`.

## Exercise videos by Your Move

25 exercise videos (the files whose exercise.json lists Your Move in `sources.media`) were downloaded from <https://ymove.app/free-exercise-videos>, published by Your Move B.V. under its free-video terms: free for commercial use, credit required, and not to be sold or redistributed as a standalone product or video library. Those terms apply to these videos in place of this library's license. Each is marked `license_id: "ymove-free-video"` in its exercise.json (`sources.media`) and in `media.credits` of `dist/exercises.json`. Where one is shown, credit it as "Exercise video by Your Move" with a link to <https://ymove.app/exercise-api> (`credit_url` in the catalog). Do not use these videos to train a machine-learning model without a separate written agreement with Your Move. The `comment` and `copyright` tags inside each file name the source and must not be removed.
