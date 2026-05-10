FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# The build commands will use the .env files present in apps/web and apps/server
RUN pnpm exec nx build @autoharvest/web
RUN pnpm exec nx build @autoharvest/server

# Final stage
FROM node:20-alpine

# Install nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder /app/dist/apps/server ./dist/apps/server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist/apps/web /usr/share/nginx/html

# Create an NGINX config that forwards /api to node and serves frontend from /
RUN rm -rf /etc/nginx/http.d/default.conf && \
    echo 'server {' > /etc/nginx/http.d/app.conf && \
    echo '    listen 3210;' >> /etc/nginx/http.d/app.conf && \
    echo '    location /api/ {' >> /etc/nginx/http.d/app.conf && \
    echo '        proxy_pass http://127.0.0.1:3001;' >> /etc/nginx/http.d/app.conf && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/http.d/app.conf && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/http.d/app.conf && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /etc/nginx/http.d/app.conf && \
    echo '    }' >> /etc/nginx/http.d/app.conf && \
    echo '    location / {' >> /etc/nginx/http.d/app.conf && \
    echo '        root /usr/share/nginx/html;' >> /etc/nginx/http.d/app.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/http.d/app.conf && \
    echo '        include /etc/nginx/mime.types;' >> /etc/nginx/http.d/app.conf && \
    echo '    }' >> /etc/nginx/http.d/app.conf && \
    echo '}' >> /etc/nginx/http.d/app.conf

# Add a start script to run both nginx and node
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx' >> /app/start.sh && \
    echo 'node dist/apps/server/main.js' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3210

CMD ["/app/start.sh"]
