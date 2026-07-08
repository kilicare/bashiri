# Bashiri — Sports AI Prediction Platform

Prediction intelligence tool ya Tanzania, inayotumia Dixon-Coles Poisson
Regression kutoa uchambuzi wa mechi za EPL, La Liga, Bundesliga, na Ligue 1.

## Muundo
- `backend/` — Django 5 + DRF + Celery
- `frontend/` — Next.js 15 + TypeScript

## Kuanzisha (Development)
1. `docker compose up --build` 
2. `docker compose exec web python manage.py migrate` 
3. `docker compose exec web python manage.py createsuperuser` 
4. Fungua http://localhost:3000 (frontend) na http://localhost:8000/api/health/ (backend)
