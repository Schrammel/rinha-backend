FROM oven/bun:debian as initial
WORKDIR /usr

SHELL ["/bin/bash", "-c"]
RUN apt update
RUN apt install -y curl 
RUN apt install -y unzip
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && apt-get install -y nodejs
COPY . ./src
RUN cd src && bun install && bunx prisma generate
WORKDIR /usr/src

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9999/ || exit 1
  
CMD [ "bun", "index.ts" ]
