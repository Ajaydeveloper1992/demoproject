# Use an appropriate base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Define build arguments
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_VERSION
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_IMAGE_BASE_URL
ARG NEXT_PUBLIC_ENV_TEST

# Set environment variables for build and runtime
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_VERSION=$NEXT_PUBLIC_API_VERSION
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_IMAGE_BASE_URL=$NEXT_PUBLIC_IMAGE_BASE_URL
ENV NEXT_PUBLIC_ENV_TEST=$NEXT_PUBLIC_ENV_TEST

# Install dependencies
COPY package.json bun.lockb ./
RUN npm install -g bun && bun install

# Copy application code
COPY . .

# Build the Next.js application
RUN bun run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]