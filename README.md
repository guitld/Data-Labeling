# Simple Login System

A simple login system with admin and user roles built with React (TypeScript) frontend and Rust (Actix-Web) backend.

## Features

- **Simple Authentication**: Basic username/password verification
- **Role-based Access**: Admin and User roles with different permissions
- **Protected Routes**: Backend endpoints accessible after login
- **Admin Panel**: Special admin-only area with sensitive data
- **Modern UI**: Clean, responsive design with gradient backgrounds
- **TypeScript**: Full TypeScript support for type safety

## Tech Stack

### Backend
- **Rust** with **Actix-Web** framework
- **Simple credential verification** (no JWT)
- **Serde** for JSON serialization
- **CORS** enabled for frontend communication

### Frontend
- **React 18** with **TypeScript**
- **Axios** for HTTP requests
- **CSS3** with modern styling
- **Responsive design**

## Project Structure

```
├── Cargo.toml              # Rust dependencies
├── src/
│   └── main.rs             # Rust backend server
├── frontend/
│   ├── package.json        # Node.js dependencies
│   ├── public/
│   │   └── index.html      # HTML template
│   └── src/
│       ├── index.tsx       # React entry point
│       ├── App.tsx         # Main React component
│       ├── index.css       # Global styles
│       └── tsconfig.json   # TypeScript config
└── README.md               # This file
```

## Setup Instructions

### Prerequisites

- **Rust** (latest stable version)
- **Node.js** (version 16 or higher)
- **npm** or **yarn**

### Backend Setup

1. Navigate to the project root directory
2. Install Rust dependencies:
   ```bash
   cargo build
   ```

3. Run the backend server:
   ```bash
   cargo run
   ```

The backend will start on `http://localhost:8081`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will start on `http://localhost:3000`

## Usage

### Test Accounts

The system comes with two pre-configured test accounts:

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Access: Full access including admin panel

**User Account:**
- Username: `user`
- Password: `user123`
- Access: Standard user access

### API Endpoints

- `POST /login` - Authenticate user with username/password
- `GET /protected` - Access protected data (available after login)
- `GET /admin` - Access admin-only data (available after admin login)

### Features

1. **Login Form**: Clean, responsive login interface
2. **Role-based Dashboard**: Different views for admin and user roles
3. **Simple Authentication**: Basic username/password verification
4. **Protected Routes**: Backend endpoints accessible after login
5. **Admin Panel**: Special area only accessible to administrators
6. **Error Handling**: User-friendly error messages
7. **Responsive Design**: Works on desktop and mobile devices

## Development

### Backend Development

The Rust backend uses Actix-Web for the web framework. Key features:

- Simple username/password verification
- CORS configuration for frontend communication
- Role-based access control
- In-memory user database (for demo purposes)

### Frontend Development

The React frontend is built with TypeScript for type safety:

- Functional components with hooks
- Axios for API communication
- Simple session management (no token storage)
- Responsive CSS with modern styling

## Security Notes

This is a demo application. For production use, consider:

- Using environment variables for secrets
- Implementing proper password hashing
- Using a real database instead of in-memory storage
- Adding rate limiting and input validation
- Implementing proper session management
- Adding HTTPS support

## License

This project is for educational purposes.
