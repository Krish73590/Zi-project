# Dockerfile for React Frontend

# # Step 1: Build the React app
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /my-react-app

# # Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# # Copy the rest of the application
COPY . .

# # Build the React app
RUN npm run build

# Expose port 3000 for the React app
EXPOSE 3000

# Start Nginx
CMD ["npm", "start"]