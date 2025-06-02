const cors = require('cors');

const allowedOrigins = [
  'https://attendancepro-weld.vercel.app',
  'https://attendance-solution-frontend.vercel.app',
  'https://attendance-solution.vercel.app',
  'https://lively-kashata-d2eb26.netlify.app',
  'https://attendancea2zinsure.netlify.app',
  'http://localhost:5173',  // Add local development URL
  'http://localhost:3000'   // Add alternative local development URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware; 
