# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript)
RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Create public directory for file uploads
RUN mkdir -p ./dist/public

# Expose port (default 5000 based on env)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
