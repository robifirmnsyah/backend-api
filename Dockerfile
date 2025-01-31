FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source
COPY . .

# Set environment variables
ENV DB_HOST=postgres
ENV DB_USER=magna
ENV DB_PASSWORD=M@gn@123
ENV DB_PORT=5432
ENV DB_NAME=support_ticket_db

# Expose port
EXPOSE 8000

# Start the application
CMD ["node", "index.js"]
