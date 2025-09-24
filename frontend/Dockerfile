FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm install; \
    fi

# Copy source code
COPY . .

# Build the app (allow overriding API URLs at build time)
ARG REACT_APP_API_BASE_URL=http://localhost:8082
ARG REACT_APP_UPLOADS_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
ENV REACT_APP_UPLOADS_BASE_URL=${REACT_APP_UPLOADS_BASE_URL}
RUN npm run build

FROM nginx:stable-alpine AS production

# Copy custom nginx config for SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
