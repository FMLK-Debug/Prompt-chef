#!/usr/bin/env bash
# Rebuild the gh-pages branch from the current site files and push it.
# The live site is served from that branch by GitHub Pages.
set -euo pipefail

cd "$(dirname "$0")/.."

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git init -q -b gh-pages "$tmp"
git -C "$tmp" config user.name "$(git config user.name)"
git -C "$tmp" config user.email "$(git config user.email)"
git -C "$tmp" remote add origin "$(git remote get-url origin)"

cp index.html styles.css app.js "$tmp/"
touch "$tmp/.nojekyll"

git -C "$tmp" add .
git -C "$tmp" commit -q -m "Deploy Prompt Chef site"
git -C "$tmp" push -f origin gh-pages

echo "Deployed to https://fmlk-debug.github.io/Prompt-chef/"
