# Smart Farm Management System - Frontend

A modern Angular-based frontend application for managing smart farm operations with IoT sensors and real-time data monitoring.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Dashboard**: Real-time overview of farms, devices, and sensor data
- **Farm Management**: Create and manage multiple farms
- **Device Management**: Monitor and control IoT devices
- **Sensor Management**: Track sensor readings and configurations
- **Crop Management**: Manage crop cultivation and tracking
- **User Profile**: Personal account management
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Data**: Live updates from sensors and devices

## Technology Stack

- **Angular 20**: Latest version with standalone components
- **Angular Material**: Modern UI components and theming
- **TypeScript**: Type-safe development
- **SCSS**: Advanced styling with Material Design
- **RxJS**: Reactive programming for data streams
- **Chart.js**: Data visualization and analytics
- **JWT**: Secure authentication tokens

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v20 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smart-farm-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
# Copy environment template
cp src/environments/environment.ts.example src/environments/environment.ts

# Edit the environment file with your API endpoints
```

4. Start the development server:
```bash
ng serve
```

5. Open your browser and navigate to `http://localhost:4200`

### Building for Production

```bash
# Build for production
ng build --configuration production

# The build artifacts will be stored in the `dist/` directory
```

### Running Tests

```bash
# Unit tests
ng test

# End-to-end tests
ng e2e
```

## Project Structure

```
src/
├── app/
│   ├── core/                 # Core functionality
│   │   ├── guards/          # Route guards
│   │   ├── interceptors/    # HTTP interceptors
│   │   ├── models/          # TypeScript interfaces
│   │   └── services/        # Core services
│   ├── features/            # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── dashboard/      # Main dashboard
│   │   ├── farms/          # Farm management
│   │   ├── devices/        # Device management
│   │   ├── sensors/        # Sensor management
│   │   ├── crops/          # Crop management
│   │   └── profile/        # User profile
│   ├── shared/             # Shared components
│   │   └── components/     # Reusable components
│   ├── app.config.ts       # App configuration
│   ├── app.routes.ts       # Routing configuration
│   └── app.ts              # Root component
├── assets/                 # Static assets
├── environments/           # Environment configurations
└── styles.scss            # Global styles
```

## Configuration

### Environment Variables

Create `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'ws://localhost:3000',
  appName: 'Smart Farm Management System',
  version: '1.0.0'
};
```

### API Integration

The frontend integrates with the Smart Farm backend API. Ensure the backend is running and accessible at the configured API URL.

## Features Overview

### Authentication
- User registration and login
- JWT token management
- Role-based access control (Admin, Farmer, Viewer)
- Password reset functionality

### Dashboard
- Real-time statistics overview
- Device status monitoring
- Recent sensor readings
- Farm overview cards
- Interactive charts and graphs

### Farm Management
- Create and edit farms
- Farm location and details
- Device and sensor associations
- Farm statistics and metrics

### Device Management
- Device registration and configuration
- Status monitoring (online/offline/maintenance)
- Device type management
- Location tracking
- Firmware version tracking

### Sensor Management
- Sensor configuration and setup
- Real-time data visualization
- Threshold monitoring
- Historical data analysis
- Sensor type management

### Crop Management
- Crop planting and tracking
- Growth stage monitoring
- Harvest planning
- Crop variety management
- Yield tracking

## Deployment

### Docker Deployment

1. Create a Dockerfile:
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/smart-farm-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Build and run:
```bash
docker build -t smart-farm-frontend .
docker run -p 80:80 smart-farm-frontend
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### Version 1.0.0
- Initial release
- Complete authentication system
- Dashboard with real-time data
- Farm, device, and sensor management
- Crop tracking and management
- User profile management
- Responsive design
- Production-ready configuration