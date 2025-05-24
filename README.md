# Attendance Solution

A full-stack attendance management system built with MERN stack.

## Project Structure

```
attendance-solution/
├── backend/         # Node.js/Express backend
├── frontend/        # React frontend
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Render account (for backend deployment)
- Vercel account (for frontend deployment)

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### Frontend (.env.production)
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

## Deployment Instructions

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment Variables:
     - NODE_ENV=production
     - MONGO_URI=your_mongodb_uri
     - JWT_SECRET=your_jwt_secret

### Frontend (Vercel)

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Configure the following:
   - Framework Preset: Vite
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Environment Variables:
     - VITE_API_URL=https://your-backend-url.onrender.com/api

## Development

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features

- User authentication and authorization
- Attendance tracking with location
- Leave management
- Admin dashboard
- Real-time notifications
- Mobile responsive design

## API Documentation

The API documentation is available at `/api-docs` when running the backend server.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 