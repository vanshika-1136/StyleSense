# 👗 StyleSense

### Intelligent Fashion Recommendation & Search Platform

StyleSense is a full-stack fashion discovery platform that combines product search, filtering, personalization, and recommendation ranking to help users discover relevant products.

## ✨ Features

- 🔍 Intelligent product search
- 🎯 Personalized recommendations
- ❤️ Wishlist management
- 🛒 Cart management
- 👤 User authentication
- 📊 Interaction-based personalization
- 📱 Responsive interface

## 🧠 Recommendation System

StyleSense learns from user interactions such as:

**View → Click → Wishlist → Cart**

Different interaction types contribute different weights to the personalization score.

The recommendation pipeline combines:

- Search relevance
- User preferences
- Interaction history
- Product popularity
- Product rating

## 🏗️ Tech Stack

### Frontend
React.js • Vite • Tailwind CSS

### Backend
Node.js • Express.js

### Database
PostgreSQL • Neon

### Recommendation Engine
Python • Pandas

### Deployment
Vercel • Render • Neon • Docker • Docker Compose

## 🔄 System Flow

```text
User
  ↓
Search / Browse
  ↓
Product Filtering
  ↓
Recommendation Engine
  ↓
Personalized Ranking
  ↓
Product Interaction
  ↓
User Preference Update
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/vanshika-1136/StyleSense.git
cd StyleSense
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create the required `.env` files with your database credentials, API configuration, and other required environment variables.

Refer to the backend configuration for the required variables.

### 5. Run the application

Start the backend and frontend development servers in separate terminals using their respective development commands.

---

## 🐳 Docker Deployment

StyleSense can also be run locally using Docker Compose. Docker automatically starts the frontend, backend, and PostgreSQL database.

### Docker Hub Images

- **Frontend:** [vanshika550/stylesense-client](https://hub.docker.com/r/vanshika550/stylesense-client)
- **Backend:** [vanshika550/stylesense-server](https://hub.docker.com/r/vanshika550/stylesense-server)
- **Database:** [PostgreSQL Official Image](https://hub.docker.com/_/postgres)

### Prerequisites

- Docker Desktop
- Docker Compose (included with Docker Desktop)

### 1. Configure environment variables

From the project root, copy the example environment file:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**

```bash
cp .env.example .env
```

Update `.env` with your own strong database password and JWT secret. Never commit this file to GitHub.

### 2. Pull Docker images

```bash
docker compose pull
```

### 3. Start the application

```bash
docker compose up -d
```

### 4. Check running containers

```bash
docker compose ps
```

### 5. Access the application

| Service | URL | Port |
|---|---|---:|
| Frontend | http://localhost:3000 | 3000 |
| Backend | http://localhost:5000 | 5000 |
| PostgreSQL | Internal Docker network | 5432 |

### Database Initialization

- PostgreSQL runs using the official `postgres:16` image.
- Database name: `stylesense`
- Database initialization script: `database/init/01-init.sql`
- The initialization script creates the required tables and loads sample product catalogue data.
- The database uses a Docker named volume (`stylesense-db-data`) for persistent storage.

**Note:** Initialization scripts execute automatically only when PostgreSQL initializes a new, empty data volume. Restarting containers does not re-import the data.

### Troubleshooting

**Check container logs:**

```bash
docker compose logs
```

**Check backend logs:**

```bash
docker compose logs server
```

**Restart services:**

```bash
docker compose restart
```

**Stop the application:**

```bash
docker compose down
```

The named database volume is retained when you stop the application this way.

**Check product count:**

```bash
docker compose exec db psql -U postgres -d stylesense -c "SELECT COUNT(*) FROM products;"
```

---

## 👩‍💻 Author

**Vanshika**

B.E. Computer Science & Engineering  
UIET, Panjab University

[GitHub](https://github.com/vanshika-1136)
