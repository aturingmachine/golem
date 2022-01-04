#!/bin/bash

###########################################
# GOLEM DEV INSTALLER
#
# Installs npm deps for needed sub-projects
###########################################

echo "GOLEM > Installing Bot Deps..."
echo "GOLEM > npm ci"
npm ci

echo "GOLEM > Installing Doc Deps..."
echo "GOLEM > npm ci --prefix docs/"
npm ci --prefix docs/

echo "GOLEM > Installing Web Deps..."
echo "GOLEM > npm ci --prefix src/web/client/"
npm ci --prefix src/web/client/

echo "npm dependencies installed."
