<div align="center">

<img src="docs/readme/enter.jpg" alt="Lulu-fm, a white cat and two people watching Marine Drive at dusk" width="100%">

# Lulu-fm

**A music discovery platform. Follow Lulu the cat through her day, from blues to ambient, metal, hip-hop, ghazal and jazz.**

[**lulu-fm.vercel.app**](https://lulu-fm.vercel.app)

`67,000 songs` · `6 scenes` · `one player` · `no sign-up` · `no build step`

</div>

---

## What it is

Lulu is a white cat. Her day moves through six illustrated scenes, and each scene plays one genre from a real listening library, liked songs and followed artists pulled from YouTube Music and Spotify.

Press **Enter** and the site opens on the scene that matches your local time. Change scene and the music changes with it. Nothing to log into, nothing to configure.

| Scene | Plays | |
|---|---|---|
| **Kitchen** | blues, soul, the classics | morning |
| **Rain** | ambient, electronic, film scores | late morning |
| **Ledge** | rock, metal, punk | afternoon |
| **Paan tapri** | hip-hop | evening |
| **Marine Drive** | Bollywood, ghazal, Indian classical, Latin | dusk |
| **Night** | jazz | after 8pm |

<table>
<tr>
<td width="33%"><img src="docs/readme/kitchen.jpg" alt="Kitchen"><br><sub><b>Kitchen</b> · blues</sub></td>
<td width="33%"><img src="docs/readme/rain.jpg" alt="Rain"><br><sub><b>Rain</b> · ambient, electronic</sub></td>
<td width="33%"><img src="docs/readme/ledge.jpg" alt="Ledge"><br><sub><b>Ledge</b> · rock, metal</sub></td>
</tr>
<tr>
<td width="33%"><img src="docs/readme/paan.jpg" alt="Paan tapri"><br><sub><b>Paan tapri</b> · hip-hop</sub></td>
<td width="33%"><img src="docs/readme/marine.jpg" alt="Marine Drive"><br><sub><b>Marine Drive</b> · Bollywood, ghazal, Latin</sub></td>
<td width="33%"><img src="docs/readme/night.jpg" alt="Night"><br><sub><b>Night</b> · jazz</sub></td>
</tr>
</table>

## Details

- **One player.** Every song, whatever service it came from, plays through a single YouTube player. Spotify only supplied the list.
- **Opens on your time of day.** 5 to 10 kitchen, 10 to 1 rain, 1 to 4 ledge, 4 to 6 paan tapri, 6 to 8 marine, 8 to 5 night. A link such as `#night` overrides it.
- **A tiny control.** A small pill with a progress ring. Hover (or tap the chevron on a phone) for seek, skip, volume, video and an *open on YouTube* link. It fades out when idle.
- **Arrows on hover.** The scene chevrons only appear when you move toward the edges.
- **Likes surface first.** About one pick in three is a liked song, the rest is the wider catalogue.
- **Fast start.** A small starter list plays immediately and each scene's full list loads in the background when you enter it.
- **Phones.** On a portrait screen the whole frame is shown over a soft blurred copy of itself, rather than a narrow crop.
- **Sharp on a 4K monitor.** Frames ship as responsive WebP, 900 to 3840 px wide. The 4K masters are in `art/scenes/`.

Keys: `←` `→` change scene · `space` play or pause · `n` next track.

<p align="center"><img src="docs/readme/mobile.jpg" alt="Lulu-fm on a phone" width="260"></p>

## How the library was built

| Source | What was taken |
|---|---|
| YouTube Music | liked songs, followed artists, and each followed artist's full songs list |
| Spotify | liked songs, playlists and followed artists |

Each artist is assigned to a scene by genre, then every one of their songs follows. Spotify songs were matched to playable YouTube videos by artist, title and length, and low-confidence matches were dropped. About 67,000 songs in total: ledge 25k, night 12k, rain 12k, kitchen 8k, paan tapri 6k, Marine Drive 4k.

## Project layout

```
docs/                 the site (Vercel serves this folder)
  index.html          one page
  site.css            all styles
  app.js              scenes, player, queue, controls
  img/                responsive WebP frames per scene
  data/lulu.json      scene metadata and the starter tracks
  data/<scene>.json   each scene's full catalogue [videoId, title, artist, liked]
  readme/             screenshots used on this page
art/scenes/           4K masters
data/ids.txt          hand-picked starter tracks (artist|title|youtubeId)
scripts/build_data.py builds docs/data/lulu.json from ids.txt
```

## Run it

No build step. Serve the `docs` folder with anything:

```bash
python3 -m http.server 8000 --directory docs
```

Then open http://localhost:8000. Edit `data/ids.txt` and run `python3 scripts/build_data.py` to change the starter list.

## Roadmap

- [ ] Refresh the library automatically from new likes and follows
- [ ] Marine Drive frame regenerated at native 4K
- [ ] Lulu as a small desktop companion

---

<sub>Lulu is a real cat. The frames are illustrations. The music belongs to the artists. Every song streams from YouTube.</sub>
