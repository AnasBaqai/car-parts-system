# Car Parts Management System

A comprehensive system for managing car parts inventory, orders, and sales.

## Features

- **User Authentication**: Secure login and registration with admin approval
- **Inventory Management**: Track parts, categories, and stock levels
- **Order Processing**: Create and manage customer orders
- **Sales Reporting**: Generate reports on sales and inventory
- **Admin Dashboard**: Manage users and system settings
- **Barcode Scanning**: Scan barcodes for quick part lookup
- **Receipt Printing**: Generate and print receipts for orders

## Architecture

The system consists of two main components:

1. **Backend**: Node.js with Express and MongoDB
2. **Frontend**: React with Material-UI

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

### Installation

#### Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a .env file (use .env.example as a template)
cp .env.example .env

# Edit the .env file with your configuration
nano .env

# Build the application
npm run build

# Create the first admin user
npm run create-admin

# Start the server
npm start
```

#### Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create a .env file (use .env.example as a template)
cp .env.example .env

# Edit the .env file with your configuration
nano .env

# Start the development server
npm start
```

### Running as a Desktop Application

The system can also be run as a desktop application using Electron:

```bash
# Navigate to the frontend directory
cd frontend

# Start the Electron app in development mode
npm run electron-dev

# Build the Electron app for production
npm run electron-pack
```

## Admin Functionality

The system includes an admin panel for managing users and system settings. See [Admin Functionality Guide](backend/README-ADMIN.md) for details.

## Multi-Tenant Support

The system supports multiple users with data isolation. See [Multi-Tenant Migration Guide](backend/README-MULTI-TENANT.md) for details.

## License

This project is licensed under the ISC License.
