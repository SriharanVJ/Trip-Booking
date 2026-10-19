# Bus Booking frontend — TanStack Start dev server (npm lockfile).
FROM node:22-alpine

WORKDIR /app

# Install dependencies first so this layer is cached.
COPY package.json package-lock.json ./
RUN npm ci

# App code.
COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
