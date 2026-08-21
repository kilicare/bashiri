# Docker Setup Guide for Tips Feature

## Overview
This guide provides step-by-step instructions for setting up the Tips feature in your Docker environment.

## Prerequisites
- Docker and Docker Compose installed
- Existing Bashiri Docker setup running
- Access to the backend container

## Step 1: Create Migrations in Docker

### Run these commands in your terminal:

```bash
# Navigate to the project directory
cd C:\Users\lastmateru\Desktop\bashiri

# Create migrations for the tips app
docker-compose exec web python manage.py makemigrations tips

# Create migrations for the accounts app (User model changes)
docker-compose exec web python manage.py makemigrations accounts

# Apply all migrations
docker-compose exec web python manage.py migrate
```

### Expected Output:

For tips migrations:
```
Migrations for 'tips':
  tips/migrations/0001_initial.py
    - Create model TipShare
    - Create model TipVote
    - Create model UserTip
    - Create model TipPerformance
    - Create model TipComment
```

For accounts migrations:
```
Migrations for 'accounts':
  accounts/migrations/0005_user_tip_fields.py
    - Add field tip_count to user
    - Add field tip_accuracy to user
    - Add field verified_tipster to user
    - Add field followers_count to user
    - Add field following_count to user
```

## Step 2: Restart Docker Services

```bash
# Restart all services to apply changes
docker-compose restart

# Or restart specific services
docker-compose restart web celery_worker celery_beat
```

## Step 3: Verify Setup

### Check if the tips app is properly installed:

```bash
# Check Django shell
docker-compose exec web python manage.py shell

# In the shell, run:
>>> from tips.models import UserTip, TipPerformance
>>> UserTip.objects.count()
0
>>> from accounts.models import User
>>> # Check if new fields exist
>>> User._meta.get_field('tip_count')
<django.db.models.fields.PositiveSmallIntegerField>
>>> exit()
```

### Check if API endpoints are accessible:

```bash
# Test the health check
curl http://localhost:8000/

# Test tips endpoint (should return empty list initially)
curl http://localhost:8000/api/tips/
```

## Step 4: Create Superuser (if needed)

```bash
docker-compose exec web python manage.py createsuperuser
```

## Step 5: Verify Celery Tasks

### Check if Celery tasks are registered:

```bash
# Check Celery worker logs
docker-compose logs celery_worker | grep -i tips

# You should see something like:
# [tasks]
#   . tips.tasks.verify_tips_task
#   . tips.tasks.update_leaderboard_task
#   . tips.tasks.clean_old_shares_task
```

### Check Celery Beat schedule:

```bash
# Check Celery beat logs
docker-compose logs celery_beat | grep -i schedule

# You should see the tips tasks in the schedule
```

## Step 6: Test the API

### 1. Create a test tip (requires authentication):

```bash
# First, get an auth token by logging in
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+255712345678",
    "password": "your_password"
  }'

# Save the access token from the response
# Then create a tip:
curl -X POST http://localhost:8000/api/tips/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "match": 1,
    "market_key": "1X2",
    "selection": "home_win",
    "confidence": 75,
    "reasoning": "Strong home team performance",
    "visibility": "PUBLIC"
  }'
```

### 2. List tips:

```bash
curl http://localhost:8000/api/tips/
```

### 3. Get leaderboard:

```bash
curl http://localhost:8000/api/tips/leaderboard/
```

## Troubleshooting

### Issue: "No module named 'tips'"
**Solution**: Make sure the tips app was created properly and is in INSTALLED_APPS.

### Issue: Migration conflicts
**Solution**: 
```bash
docker-compose exec web python manage.py makemigrations --empty tips
docker-compose exec web python manage.py migrate tips --fake-initial
```

### Issue: Celery tasks not running
**Solution**: Check that Celery Beat is properly configured:
```bash
docker-compose logs celery_beat
```

### Issue: Database connection errors
**Solution**: Ensure PostgreSQL container is running:
```bash
docker-compose ps db
```

## Verification Checklist

- [ ] Tips app created in backend/tips/
- [ ] All model files created (models.py, serializers.py, views.py, etc.)
- [ ] Tips app added to INSTALLED_APPS in settings.py
- [ ] Tips URLs added to main urls.py
- [ ] User model updated with tip-related fields
- [ ] Migrations created successfully
- [ ] Migrations applied successfully
- [ ] Docker services restarted
- [ ] API endpoints accessible
- [ ] Celery tasks registered
- [ ] Django admin shows tips models

## Next Steps

After successful setup:
1. Test the API endpoints thoroughly
2. Create some test tips via Django admin
3. Verify Celery tasks are running properly
4. Monitor the first tip verification cycle
5. Proceed to Phase 2 (Frontend implementation)

## Monitoring

### Check logs for tips-related activity:

```bash
# Web server logs
docker-compose logs -f web | grep tips

# Celery worker logs
docker-compose logs -f celery_worker | grep tips

# Celery beat logs
docker-compose logs -f celery_beat | grep tips
```

### Database verification:

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U bashiri_user -d bashiri

# Check if tips tables exist
\dt tips_*

# Check user table for new fields
\d accounts_user

# Exit
\q
```

## Rollback (if needed)

If you need to rollback the changes:

```bash
# Revert migrations
docker-compose exec web python manage.py migrate tips zero
docker-compose exec web python manage.py migrate accounts zero

# Remove tips app from settings.py
# Remove tips URLs from urls.py
# Remove tips app directory
# Restart services
docker-compose restart
```