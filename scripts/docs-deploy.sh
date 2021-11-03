#!/usr/bin/env sh

# abort on errors
set -e

echo ">>> Dumping Commands"
# Generate Command Data
npm run cmd:dmp

echo ">>> Generating Pages"
# Generate Dynamic command pages
npm run dev:gen --prefix ./docs

echo ">>> Building Docs"
# build
npm run docs:build

# navigate into the build output directory
cd docs/.vuepress/dist

git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:aturingmachine/golem.git master:gh-pages

cd -
