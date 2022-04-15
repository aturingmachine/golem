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

if [ ! -f docker/docker-compose.volumes.yml ]; then
  scripts/docker-build.sh
fi

echo ">>> Running Docker-Compose..."
echo ">>> docker-compose -f docker/docker-compose.yml -f docker/docker-compose.volumes.yml up -d"
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.volumes.yml up -d
echo ">>> docker-compose -f docker/docker-compose.yml -f docker/docker-compose.volumes.yml logs -f golem"
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.volumes.yml logs -f golem
