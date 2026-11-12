"""Builds docs/data/lulu.json from data/ids.txt (artist|title|youtube_id).

The site has six scenes, one frame each, ordered as a day: morning to night.
Each scene is a genre; artists are assigned to the scene whose frame they fit,
using the artists and channels followed on YouTube and Spotify.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# focal = where the cat / subject sits horizontally (CSS object-position x%),
# so phones in portrait crop around her.
SCENES = [
    {"id": "kitchen", "name": "Kitchen", "genre": "Blues",
     "line": "Something is on the stove.", "focal": 30},
    {"id": "rain", "name": "Rain", "genre": "Ambient",
     "line": "Nobody is going anywhere.", "focal": 48},
    {"id": "ledge", "name": "The ledge", "genre": "Rock and metal",
     "line": "She is out the window again.", "focal": 50},
    {"id": "paan", "name": "Paan tapri", "genre": "Hip-hop",
     "line": "Nap on the scooty.", "focal": 38},
    {"id": "marine", "name": "Marine Drive", "genre": "Ghazal and Bollywood",
     "line": "Sunset, the three of us.", "focal": 40},
    {"id": "night", "name": "Terrace", "genre": "Jazz",
     "line": "Lights on in every window.", "focal": 49},
]

# first matching artist substring wins
TRACK_SCENE = [
    # rock and metal
    ("IDLES", "ledge"), ("Sleep Token", "ledge"), ("Whitechapel", "ledge"),
    ("Chelsea Grin", "ledge"), ("Alex Terrible", "ledge"), ("The Sword", "ledge"),
    ("Truckfighters", "ledge"), ("Valley of the Sun", "ledge"), ("Architects", "ledge"),
    # hip-hop
    ("Gang Starr", "paan"), ("Mobb Deep", "paan"), ("Beastie Boys", "paan"),
    ("Jay-Z", "paan"), ("Skepta", "paan"), ("Cage", "paan"), ("Anderson", "paan"),
    ("DJ Shadow", "paan"),
    # ambient
    ("William Basinski", "rain"), ("Harold Budd", "rain"), ("Aphex Twin", "rain"),
    ("Boards of Canada", "rain"), ("Global Communication", "rain"), ("Four Tet", "rain"),
    ("Debussy", "rain"), ("Dvořák", "rain"), ("Clint Mansell", "rain"),
    ("Vangelis", "rain"), ("Orbital", "rain"), ("Steve Reich", "rain"),
    # jazz
    ("Bill Evans", "night"), ("Chet Baker", "night"), ("Wes Montgomery", "night"),
    ("Django", "night"), ("Sonny Rollins", "night"), ("Nat King Cole", "night"),
    ("Rodrigo", "night"),
    # blues
    ("Muddy Waters", "kitchen"), ("Stevie Ray Vaughan", "kitchen"),
    ("Johnny Winter", "kitchen"),
    # ghazal and bollywood
    ("Nusrat", "marine"), ("Asha Bhosle", "marine"), ("KK", "marine"),
    ("Bally Sagoo", "marine"),
]

# followed on YouTube (channels / topic channels), by scene
ARTISTS = {
    "kitchen": ["Johnny Winter", "Eric Clapton", "Muddy Waters", "Stevie Ray Vaughan"],
    "rain": ["Brian Eno", "Vangelis", "Pink Floyd", "Peter Gabriel", "Essential Classics"],
    "ledge": ["Iron Maiden", "Judas Priest", "Kreator", "Whitechapel", "I See Stars",
              "The Browning", "Make Them Suffer", "Clutch", "The Strokes"],
    "paan": ["Wu-Tang Clan", "Rock The Bells"],
    "marine": ["Mehdi Hassan"],
    "night": ["Ryo Fukui", "Paul Desmond", "Gerry Mulligan", "Frank Sinatra"],
}


def scene_for(artist):
    for needle, scene in TRACK_SCENE:
        if needle.lower() in artist.lower():
            return scene
    raise SystemExit(f"no scene for {artist}")


def main():
    tracks = []
    for line in (ROOT / "data" / "ids.txt").read_text().splitlines():
        if not line.strip():
            continue
        artist, title, vid = line.split("|")
        tracks.append({"artist": artist, "title": title, "yt": vid, "scene": scene_for(artist)})
    out = {
        "scenes": [dict(s, artists=ARTISTS[s["id"]],
                        tracks=[{k: t[k] for k in ("artist", "title", "yt")}
                                for t in tracks if t["scene"] == s["id"]])
                   for s in SCENES]
    }
    dest = ROOT / "docs" / "data"
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "lulu.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    for s in out["scenes"]:
        print(s["id"], len(s["tracks"]), "tracks,", len(s["artists"]), "artists")


if __name__ == "__main__":
    main()
