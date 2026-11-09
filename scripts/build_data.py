"""Builds docs/data/lulu.json from data/ids.txt (artist|title|youtube_id).

Tracks are grouped into moods (what is happening in the apartment), not genres.
Artists per mood come from the channels / artists followed on YouTube and Spotify.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

MOODS = [
    {"id": "focused", "name": "Focused", "line": "Coffee, laptop, one cat on the desk.", "default": True},
    {"id": "still", "name": "Still", "line": "Nobody is going anywhere.", "default": False},
    {"id": "warm", "name": "Warm", "line": "Window seat. Golden light.", "default": False},
    {"id": "wired", "name": "Wired", "line": "She is out the window again.", "default": False},
]

# first matching artist substring wins
TRACK_MOOD = [
    ("IDLES", "wired"), ("Sleep Token", "wired"), ("Whitechapel", "wired"),
    ("Chelsea Grin", "wired"), ("Alex Terrible", "wired"), ("The Sword", "wired"),
    ("Truckfighters", "wired"), ("Valley of the Sun", "wired"), ("Architects", "wired"),
    ("Gang Starr", "wired"), ("Mobb Deep", "wired"), ("Beastie Boys", "wired"),
    ("Jay-Z", "wired"), ("Skepta", "wired"), ("Cage", "wired"), ("Anderson", "wired"),
    ("Bally Sagoo", "wired"),
    ("Bill Evans", "still"), ("Chet Baker", "still"), ("William Basinski", "still"),
    ("Harold Budd", "still"), ("Aphex Twin", "still"), ("Boards of Canada", "still"),
    ("Global Communication", "still"), ("Four Tet", "still"), ("Debussy", "still"),
    ("Dvořák", "still"), ("Clint Mansell", "still"),
    ("Nusrat", "warm"), ("Asha Bhosle", "warm"), ("KK", "warm"),
    ("Rodrigo", "warm"), ("Vangelis", "warm"), ("Nat King Cole", "warm"),
    ("Wes Montgomery", "focused"), ("Django", "focused"), ("Sonny Rollins", "focused"),
    ("Muddy Waters", "focused"), ("Stevie Ray Vaughan", "focused"), ("Johnny Winter", "focused"),
    ("Orbital", "focused"), ("DJ Shadow", "focused"), ("Steve Reich", "focused"),
]

# followed on YouTube (channels / topic channels)
ARTISTS = {
    "wired": ["Iron Maiden", "Judas Priest", "Kreator", "Whitechapel", "I See Stars",
              "The Browning", "Make Them Suffer", "Clutch", "Wu-Tang Clan", "Rock The Bells"],
    "still": ["Brian Eno", "Ryo Fukui", "Paul Desmond", "Gerry Mulligan", "Essential Classics"],
    "warm": ["Mehdi Hassan", "Frank Sinatra", "Peter Gabriel", "Pink Floyd"],
    "focused": ["Johnny Winter", "Eric Clapton", "Vulfpeck", "Jordan Rudess", "Ichika Nito",
                "The Strokes", "Justice", "BICEP", "Digitalism", "Fatboy Slim"],
}


def mood_for(artist):
    for needle, mood in TRACK_MOOD:
        if needle.lower() in artist.lower():
            return mood
    raise SystemExit(f"no mood for {artist}")


def main():
    tracks = []
    for line in (ROOT / "data" / "ids.txt").read_text().splitlines():
        if not line.strip():
            continue
        artist, title, vid = line.split("|")
        tracks.append({"artist": artist, "title": title, "yt": vid, "mood": mood_for(artist)})
    out = {
        "moods": [dict(m, artists=ARTISTS[m["id"]],
                       tracks=[t for t in tracks if t["mood"] == m["id"]]) for m in MOODS]
    }
    dest = ROOT / "docs" / "data"
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "lulu.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    for m in out["moods"]:
        print(m["id"], len(m["tracks"]), "tracks,", len(m["artists"]), "artists")


if __name__ == "__main__":
    main()
