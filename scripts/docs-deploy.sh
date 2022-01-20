#!/usr/bin/env sh

# abort on errors
set -e

# Generate Command Data
echo ">>> Dumping Commands"
npm run cmd:dmp

# Generate Dynamic command pages
echo ">>> Generating Pages"
npm run gen --prefix ./docs

# Build the Docs
echo ">>> Building Docs"
npm run docs:build

# Navigate into the build output directory
cd ./docs/src/.vuepress/dist

git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:aturingmachine/golem.git main:gh-pages

cd -
