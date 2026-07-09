# Thrif Me Up — Boutique Thrift Fashion E-Commerce

## Setup Instructions (VS Code + MongoDB Atlas)

### 1. Install dependencies
```bash
npm install
```

### 2. Create your `.env` file
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Then open `.env` and fill in your real MongoDB Atlas connection string and a random JWT secret.

### 3. Get a MongoDB Atlas connection string (free)
1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free "M0" cluster.
3. Under Database Access, create a database user (username + password).
4. Under Network Access, add IP `0.0.0.0/0` (allow from anywhere — fine for a student project).
5. Click "Connect" -> "Drivers" -> copy the connection string.
6. Paste it into `.env` as `MONGO_URI`, replacing `<username>`, `<password>`, and cluster info.

### 4. Run the server
```bash
npm run dev
```
Then open http://localhost:5000/api/health in your browser — you should see a success JSON message.

## Project Structure
```
thrif-me-up/
├── config/         # DB connection, app config
├── models/         # Mongoose schemas (User, Product, Order, etc.)
├── controllers/     # Business logic for each route
├── routes/          # Express route definitions
├── middleware/       # Auth checks, error handling
├── public/           # Frontend: HTML, CSS, JS, images
├── utils/            # Helper functions
├── server.js          # App entry point
└── .env               # Your secrets (never commit this)
```

## Status
- [x] Phase 1: Design system & planning
- [x] Phase 2: Project scaffold
- [ ] Phase 3: Core frontend pages
- [ ] Phase 4: Backend models + auth
- [ ] Phase 5: Core APIs
- [ ] Phase 6: Remaining pages
- [ ] Phase 7: Admin dashboard
- [ ] Phase 8: Polish
