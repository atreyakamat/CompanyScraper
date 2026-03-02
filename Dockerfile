# Use Microsoft's official Playwright image
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install necessary browsers
RUN npx playwright install chromium

# The command to run the application (defaults to scraping startupgoa)
ENTRYPOINT ["node", "index.js"]
CMD ["scrape", "-s", "startupgoa"]
