# Use Node.js 22 alpine image for smaller footprint
FROM node:22-alpine

WORKDIR /app

# Install native dependencies required for some packages (like better-sqlite3)
RUN apk add --no-cache python3 make g++ 

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY src/ ./src/
COPY tsconfig.json ./

# Create data directory for volume mapping
RUN mkdir -p .data

# Try to build if needed, but since we run with `tsx`, we don't necessarily need a tsc build step for start
# If 'npm start' requires built files, we'd build here.
# Assuming npm start uses tsx based on package.json: "start": "tsx src/index.ts"

# Expose port if the bot acts as a server (optional, mostly for MC)
# EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
