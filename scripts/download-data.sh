#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
raw_dir="$project_dir/data/raw"
mkdir -p "$raw_dir"

curl -L --fail --retry 2 -o "$raw_dir/idiomash.txt" \
  https://raw.githubusercontent.com/jbrew/idiomash/master/text/idioms.txt
curl -L --fail --retry 2 -o "$raw_dir/cstafie-idioms.txt" \
  https://gist.githubusercontent.com/cstafie/e0206e97f1403523c183a9a2b1c353f2/raw/idioms.txt
curl -L --fail --retry 2 -o "$raw_dir/proverbs.txt" \
  https://gist.githubusercontent.com/increpare/4c3d2cc1b3fc98e8c34f6de19cd90ab0/raw/gistfile1.txt
curl -L --fail --retry 2 -o "$raw_dir/goodbooks.csv" \
  https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/books.csv
curl -L --fail --retry 2 -o "$raw_dir/rolling-stone-songs.txt" \
  https://raw.githubusercontent.com/epsil/spotgen/master/examples/rollingstone-500-greatest-songs-of-all-time.txt
curl -L --fail --retry 2 -o "$raw_dir/movies.csv" \
  https://gist.githubusercontent.com/planetacomputer/7a6a164d9ea76f750a6da6e82fe7dcdb/raw/top10000.csv
