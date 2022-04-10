# Base Image
FROM node:16.14.2

# Set Work Directory
WORKDIR /opt/golem

# Copy manifests
COPY ./package.json ./package-lock.json /opt/golem/

# Bundle Source
COPY ./ /opt/golem

# Install dependencies for all projects
RUN npm install --build-from-source
RUN npm install --prefix docs/
RUN npm install --prefix src/web/client/

# Run Golem
CMD ['npm', 'run', 'build']

# Expose API Port
EXPOSE 3828

# Install YTDLP
RUN mkdir -p ./bin/ytdlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./bin/yt-dlp

# Make YTDLP runnable
RUN chmod a+rx ./bin/yt-dlp
