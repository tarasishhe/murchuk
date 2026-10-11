# Сірий Мурчик — scroll-driven hero (test)

A single-screen landing page for a fictional cat food brand. Scrolling scrubs
through a short video of a grey tabby cat: forward on scroll down, backward on
scroll up. Plain HTML, CSS and vanilla JS, no build step.

**Live:** https://tarasishhe.github.io/murchuk/

## How it works

- The video is pre-split into 97 JPG frames in `frames/`. No `<video>` seeking
  is used, so it works the same on iOS Safari.
- `.scroll-hero` is 400vh tall; inside it a sticky 100vh `.stage` holds a
  `<canvas>`. Scroll progress (0–1) through the wrapper picks the frame index.
- Frames are drawn with "object-fit: cover" maths, cropped around the cat
  (see `FOCAL_X_START` / `FOCAL_X_END` in `script.js`), with devicePixelRatio
  capped at 2 and redraws throttled by `requestAnimationFrame`.
- Text blocks show between the progress values in their `data-from` /
  `data-to` attributes.

## How the frames were generated

```sh
mkdir -p frames
ffmpeg -i davinci_a_grey_tabby_cat_sitting_in_a_green_velvet_armchai.mp4 \
  -vf fps=24 -q:v 5 frames/frame_%03d.jpg
```

Native 864×496, 24 fps, 97 frames. `-q:v 5` is roughly JPEG quality 75–80;
all frames come to about 4.4 MB. If you change the frame count, update
`FRAME_COUNT` in `script.js`.

## Changing the brand text

All copy lives in `index.html`: logo and nav in `<header>`, the three text
blocks and stats inside `.stage`, contacts at the bottom. Colours are CSS
variables at the top of `styles.css` (`--cream`, `--gold`, `--green-shade`).

## Files

- `index.html`, `styles.css`, `script.js`: the page
- `frames/`: video frames
- `screenshots/`: headless Chromium screenshots at 390×844 and 1440×900
  (scroll 0%, 45%, 70%, 100%, plus the mobile menu)
- `.github/workflows/pages.yml`: deploys the repo root to GitHub Pages

## Publishing

Deployed by GitHub Actions on every push to `main`. One-time setting:
**Settings → Pages → Build and deployment → Source: GitHub Actions.**
