# ============================================================
# Dockerfile — React Frontend Container (Multi-Stage Build)
# ============================================================
# What: Builds a Docker image for the React frontend
# How:  Uses a multi-stage build:
#         Stage 1 (build): Node.js compiles React into static files
#         Stage 2 (serve): Nginx serves the static files
# Why:  Multi-stage keeps the final image small (~25MB)
#       instead of shipping the full Node.js runtime (~1GB)
#
# Build: docker build -t earth-frontend .
# Run:   docker run -p 3000:80 earth-frontend
# ============================================================

# ================================================================
# STAGE 1: BUILD — Compile React app into static HTML/CSS/JS files
# ================================================================
# node:18-alpine is a lightweight Node.js image (~130MB)
FROM node:18-alpine AS build

# Set working directory inside the container
WORKDIR /app

# ---- Install Dependencies First (Docker Layer Caching) ----
# Copy package.json and package-lock.json BEFORE source code
# so npm install is cached when only code changes (not deps)
COPY package*.json ./
RUN npm install

# ---- Copy Source Code & Build ----
# Copy all React source files into the container
COPY . .

# Set the backend API URL as an environment variable for the build
# This tells React where to send API requests
ENV REACT_APP_API_URL=http://localhost:8000

# Run the React build command — outputs to /app/build/
RUN npm run build


# ================================================================
# STAGE 2: SERVE — Use Nginx to serve the built static files
# ================================================================
# nginx:alpine is a tiny (~5MB) web server image
FROM nginx:alpine

# ---- Copy Built Files from Stage 1 ----
# Only the /app/build/ folder from Stage 1 is copied
# All Node.js, node_modules, and source code are discarded
COPY --from=build /app/build /usr/share/nginx/html

# ---- Custom Nginx Config for React Router ----
# React Router uses client-side routing, so all routes
# need to serve index.html (not return 404)
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

# ---- Expose Port 80 ----
# Nginx serves on port 80 by default
EXPOSE 80

# ---- Start Nginx ----
# "daemon off" keeps Nginx in the foreground (required for Docker)
CMD ["nginx", "-g", "daemon off;"]
