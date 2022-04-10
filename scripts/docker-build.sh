#!/bin/bash

#################################
# GOLEM Docker Run
#
# Create docker volumes files to 
# map golem libraries to the 
# docker container.
# 
# Build the container and 
# then run the containers
#################################

echo ">>> Creating volumes file..."
echo ">>> cp docker/library-volumes.example.yml docker/docker-compose.volumes.yml"
cp docker/library-volumes.example.yml docker/docker-compose.volumes.yml
echo ">>> node scripts/add-volumes.js"
node scripts/add-volumes.js

echo ">>> Running Docker-Compose..."
echo ">>> docker-compose -f docker/docker-compose.yml -f docker/docker-compose.volumes.yml build"
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.volumes.yml build
