# Real-Time Observability and Log Analytics Platform

A production-inspired observability platform developed using React.js, Node.js, Express.js, PostgreSQL, and Docker.  
The platform provides centralized logging, real-time monitoring, analytics visualization, full-text search, and containerized deployment for distributed system observability workflows.

---

## Features

- Real-time observability dashboard
- Centralized log analytics platform
- GIN-indexed full-text search
- Dynamic charts and visualizations
- Service-level monitoring modules
- Advanced filtering and pagination
- CSV and JSON export functionality
- Real-time synthetic log generation
- Dockerized multi-container deployment

---

## Monitoring Modules

- Dashboard Overview
- Network Monitoring
- Database Monitoring
- Storage Monitoring
- Big Data Monitoring
- Log Analytics

---

## Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- Recharts

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL
- GIN Indexing
- Full-Text Search

### DevOps & Deployment
- Docker
- Docker Compose

---

## System Architecture

Frontend Dashboard → REST APIs → PostgreSQL Database → Analytics Engine

The system follows a modular three-layer architecture:
- Presentation Layer
- Business Logic Layer
- Data Layer

---

## Key Functionalities

### Real-Time Monitoring
The dashboard continuously visualizes:
- CPU usage
- Memory usage
- Request analytics
- Service health metrics
- Error statistics

### Centralized Log Analytics
The platform supports:
- log ingestion
- filtering
- pagination
- full-text search
- export APIs

### Full-Text Search using GIN Indexing
PostgreSQL GIN indexing is used to optimize search performance for large-scale log datasets.

### Containerized Deployment
Docker Compose orchestrates:
- frontend container
- backend API container
- PostgreSQL database container

---

## Project Structure

```bash
observability/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── api/
│   └── Dockerfile
│
├── backend/
│   ├── migrations/
│   ├── server.js
│   ├── db.js
│   ├── logGenerator.js
│   └── Dockerfile
│
├── docker-compose.yml
├── README.md
└── .gitignore
