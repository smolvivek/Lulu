# Lulu

One white cat, six scenes from her day, and the music that goes with each.
Live at https://smolvivek.github.io/Lulu/

- `docs/` is the site (GitHub Pages serves this folder). Plain HTML, CSS and JS, no build step.
- `docs/img/` has web-size WebP frames (900 to 3840 px wide). The 4K masters are in `art/scenes/`.
- `data/ids.txt` is the track list (`artist|title|youtubeId`). `scripts/build_data.py` sorts it into the
  six scenes and writes `docs/data/lulu.json`. Run it after editing `ids.txt`: `python3 scripts/build_data.py`.
- Scene links: `#kitchen`, `#rain`, `#ledge`, `#paan`, `#marine`, `#night`.
- Keys: left and right arrows change scene, space plays or pauses, `n` skips the track.
