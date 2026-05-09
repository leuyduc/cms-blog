FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json ./
RUN echo "registry=https://registry.npmmirror.com" > .npmrc \
  && npm install \
  && ls node_modules/.bin/vite

COPY . .
RUN ./node_modules/.bin/vite build


FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
