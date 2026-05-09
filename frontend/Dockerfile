# --- builder ---
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Cache dependencies
COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com \
  && npm ci

# Copy source
COPY . .

# Build
RUN npm run build


# --- runner (nginx) ---
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]