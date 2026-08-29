# Source lists

The raw files in `data/raw/` are reproducible inputs, not hand-edited game
content. Run `npm run data:download` to refresh them and `npm run data:build`
to rebuild the clean master list, reports, and 365-game bank.

| File | Contents | Source |
| --- | --- | --- |
| `idiomash.txt` | English idioms | https://github.com/jbrew/idiomash/blob/master/text/idioms.txt |
| `cstafie-idioms.txt` | Large English idiom/phrase list | https://gist.github.com/cstafie/e0206e97f1403523c183a9a2b1c353f2 |
| `proverbs.txt` | English proverbs | https://gist.github.com/increpare/4c3d2cc1b3fc98e8c34f6de19cd90ab0 |
| `goodbooks.csv` | 10,000 popular books | https://github.com/zygmuntz/goodbooks-10k |
| `rolling-stone-songs.txt` | Rolling Stone 500 song list | https://github.com/epsil/spotgen/blob/master/examples/rollingstone-500-greatest-songs-of-all-time.txt |
| `movies.csv` | Ranked IMDb movie data | https://gist.github.com/planetacomputer/7a6a164d9ea76f750a6da6e82fe7dcdb |

The build keeps 3–7-word entries, converts dashes to spaces, requires letters
and spaces only, deduplicates case-insensitively, and applies a conservative
family-safe blocklist. Raw inputs retain their upstream terms so filtering is
auditable.
