# Сірий Мурчик — scroll-driven hero (test)

A landing page for a fictional cat food brand, built from the approved design
(`Main.dc.html`, converted to plain static HTML). The cat in the hero arch
scrubs through a short video as you scroll: forward on scroll down, backward
on scroll up. Plain HTML, CSS and vanilla JS, no build step.

**Live:** https://tarasishhe.github.io/murchuk/

## How it works

- The video is pre-split into 97 JPG frames in `frames/`. No `<video>` seeking
  is used, so it works the same on iOS Safari.
- The hero arch (`.arch`) holds a `<canvas>` over a fallback
  `<img src="frames/f001.jpg">`. Scroll progress runs from 0 (arch starts
  entering the viewport, or page top) to 1 (arch bottom leaves the top of the
  viewport) and picks the frame index.
- Frames are drawn with "object-fit: cover" maths, cropped around the cat
  (see `FOCAL_X_START` / `FOCAL_X_END` in `script.js`), with devicePixelRatio
  capped at 2 and redraws throttled by `requestAnimationFrame`.

## How the frames were generated

```sh
mkdir -p frames
ffmpeg -i davinci_a_grey_tabby_cat_sitting_in_a_green_velvet_armchai.mp4 \
  -vf fps=24 -q:v 5 frames/f%03d.jpg
```

Native 864×496, 24 fps, 97 frames. `-q:v 5` is roughly JPEG quality 75–80;
all frames come to about 4.4 MB. If you change the frame count, update
`FRAME_COUNT` in `script.js`.

## Changing the brand text

All copy lives in `index.html`, section by section: header, hero, promise
strip, products, quote, footer. Colours are CSS variables at the top of
`styles.css` (`--bg`, `--card`, `--ink`, `--accent`, `--light`).

## Files

- `index.html`, `styles.css`, `script.js`: the page
- `frames/`: video frames
- `screenshots/`: headless Chromium screenshots at 390×844 and 1440×900
  (page scroll 0%, 50%, 100%, plus the mobile menu)
- `.github/workflows/pages.yml`: deploys the repo root to GitHub Pages

## Publishing

Deployed by GitHub Actions on every push to `main`. One-time setting:
**Settings → Pages → Build and deployment → Source: GitHub Actions.**
