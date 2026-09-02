# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_BACKEND_URL
ARG VITE_SENTINEL_API_KEY
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_SENTINEL_API_KEY=$VITE_SENTINEL_API_KEY
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
