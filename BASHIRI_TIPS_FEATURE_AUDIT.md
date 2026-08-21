# BASHIRI APP ARCHITECTURE AUDIT — USER TIPS/PREDICTIONS FEATURE

## EXECUTIVE SUMMARY

This audit provides a comprehensive analysis of the Bashiri app codebase to understand the current architecture before implementing a new "User Tips/Predictions" feature. The app currently has a solid foundation with AI predictions, match data, and user authentication, but lacks user-generated content features for tips sharing and performance tracking.

**Current State**: Well-structured Django + Next.js app with AI predictions, real-time match data, user authentication, and basic social features (Mic videos, match rooms).

**Key Gaps**: No user tips/predictions models, no tip performance tracking, no public tip marketplace, no tip ranking system.

**Implementation Complexity**: Medium - requires new models, API endpoints, frontend components, but can leverage existing infrastructure.

---

## 1. BACKEND (Django) ANALYSIS

### 1.1 Current Database Models

#### Existing Models (`backend/predictions/models.py`)

**Core Models:**
- `League` - Football leagues with poisson_key for ML model
- `Team` - Teams with external_id from football-data.org
- `Match` - Match data with status, scores, kickoff time
- `SavedMatch` - User's saved matches (bookmarking)
- `SavedMarket` - User's saved prediction markets
- `ActiveDerby` - Special derby configuration
- `AIPerformance` - AI model accuracy tracking
- `AITrackRecordSnapshot` - Daily AI performance snapshots
- `OddsBookmaker` - Live odds from bookmakers
- `OddsUpdate` - Historical odds changes
- `TeamStanding` - Current league standings
- `HeadToHead` - H2H statistics between teams

#### User Model (`backend/accounts/models.py`)

**Current User Fields:**
```python
class User(AbstractBaseUser, PermissionsMixin):
    phone_number = models.CharField(unique=True)
    username = models.CharField(unique=True, null=True)
    date_of_birth = models.DateField(null=True)
    avatar_url = models.URLField(blank=True)
    preferred_language = models.CharField(default="sw")
    favorite_teams = models.ManyToManyField("predictions.Team")
    favorite_leagues = models.ManyToManyField("predictions.League")
    
    # Subscription & Performance tracking
    is_subscriber = models.BooleanField(default=False)
    subscription_expires_at = models.DateTimeField(null=True)
    current_streak = models.PositiveIntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)
    total_predictions = models.PositiveIntegerField(default=0)
    correct_predictions = models.PositiveIntegerField(default=0)
```

**Relevant Properties:**
- `accuracy_percentage` - Calculated from total/correct predictions
- `is_subscription_active` - Checks subscription validity
- `profile_complete` - Checks if username and DOB are set

### 1.2 Current API Endpoints

#### Predictions API (`backend/predictions/urls.py`)

**Existing Endpoints:**
- `/predictions/fixtures/` - Get scheduled matches
- `/predictions/live/` - Get live matches
- `/predictions/search/` - Search matches
- `/predictions/matches/{id}/overview/` - Match overview with H2H
- `/predictions/matches/{id}/dashboard/` - AI prediction dashboard
- `/predictions/matches/{id}/analysis/` - Post-match analysis
- `/predictions/save/` - Save/unsave matches
- `/predictions/saved/` - Get saved matches
- `/predictions/save-market/` - Save/unsave markets
- `/predictions/saved-markets/` - Get saved markets
- `/predictions/ai-track-record/` - AI performance stats
- `/predictions/ai-performance/` - AI performance metrics
- `/predictions/leagues/` - League list
- `/predictions/teams/` - Team list
- `/predictions/standings/` - Team standings
- `/predictions/h2h/` - Head-to-head data

#### Authentication API (`backend/accounts/urls.py`)

**Existing Endpoints:**
- `/auth/register/` - User registration
- `/auth/login/` - User login
- `/auth/logout/` - User logout
- `/auth/me/` - Current user profile
- `/auth/complete-profile/` - Complete user profile
- `/auth/onboarding/` - Save favorites
- `/auth/profile/{username}/` - Public profile view
- `/auth/delete-account/` - Delete account

### 1.3 Celery Tasks

#### Current Tasks (`backend/predictions/tasks.py`)

**Active Tasks:**
1. `sync_daily_task` - Daily incremental sync (scheduled via Celery Beat)
2. `sync_historical_task` - Historical data sync (run once)
3. `generate_daily_picks` - Generate AI pick cards for feed
4. `sync_live_and_upcoming_matches` - Quick sync for live/upcoming matches (every 1 minute)
5. `sync_recently_finished_matches` - Sync recently finished matches (every 30 minutes)
6. `fetch_team_standings_task` - Fetch team standings (every 5 minutes)

**Caching Strategy:**
- Live matches cached for 60 seconds
- Fixtures cached for 2-5 minutes depending on filters
- Public profiles cached for 5 minutes
- Uses Redis with django-redis

### 1.4 Real-time Features

#### WebSocket Setup (`backend/matchroom/consumers.py`)

**Current Implementation:**
- Django Channels with Redis backend
- `MatchRoomConsumer` for live match chat
- Route: `ws/match/{match_id}/room/`
- Features: Real-time messaging, presence updates, rate limiting (3 seconds), content moderation
- Authentication required via JWT tokens

**Configuration:**
```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": ["redis://redis:6379/1"],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}
```

### 1.5 Data Sources

#### Current Data Sources
- **Football Data Org** - Primary match/league/team data
  - Rate limit: 10 requests/minute
  - Free tier: Limited historical data
  - Sync window: 7 days back, 21 days forward (configurable)
- **Odds API** - Bookmaker odds (configured but implementation unclear)
- **No Live Odds API** - No real-time odds streaming currently

---

## 2. FRONTEND (Next.js + TypeScript) ANALYSIS

### 2.1 Current Pages Structure

#### Main App Pages (`frontend/app/(main)/`)

**Existing Pages:**
- `/home` - Main feed page
- `/matches` - Match listings
- `/create/{matchId}` - Prediction creation flow
- `/match/{matchId}/overview` - Match overview
- `/match/{matchId}/room` - Match room with chat
- `/profile/{username}` - Public user profiles
- `/profile` - User profile management
- `/saved-markets` - Saved markets management
- `/ai` - AI chat interface
- `/mic` - Mic video reactions
- `/derby` - Derby special mode
- `/track-record` - AI track record
- `/live-odds` - Live odds display

### 2.2 Current Components

#### Prediction Components (`frontend/components/predictions/`)

**Existing Components:**
- `MarketRow` - Individual market display
- `PremiumMarketCard` - Premium market cards
- `TopPickCard` - Top pick recommendation
- `ConfidenceEducation` - Confidence explanation
- `PredictionTutorial` - User onboarding
- `SubscriptionSheet` - Subscription prompt

#### Profile Components (`frontend/components/profile/`)

**Existing Components:**
- `AccuracySphere` - Accuracy visualization
- `MarketMasteryHeatmap` - Market performance heatmap
- `PredictionDNA` - User prediction patterns
- `ShareProfileModal` - Profile sharing

### 2.3 State Management

#### Zustand Stores (`frontend/stores/`)

**Current Stores:**
- `auth.store.ts` - User authentication state
  - JWT tokens (access/refresh)
  - User profile data
  - Subscription status
  - Prediction stats (total, correct, accuracy)
  - Favorites (teams, leagues)

**No dedicated tips/predictions store exists.**

### 2.4 API Integration

#### API Client (`frontend/lib/api/client.ts`)

**Current Implementation:**
- Custom fetch wrapper with JWT handling
- Auto-refresh on 401 errors
- Error handling with user-friendly messages
- Support for blob responses (PDFs)
- Skip auth option for public endpoints

#### Predictions API (`frontend/lib/api/predictions.ts`)

**Current Functions:**
- Match data fetching (fixtures, live, finished)
- Prediction dashboard retrieval
- Market saving/unsaving
- AI performance stats
- Team/league details

**No user tips/predictions API functions exist.**

### 2.5 Forms & Validation

#### Current Setup
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **@hookform/resolvers** - Integration

**Usage Pattern:**
```typescript
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
})
```

### 2.6 Internationalization

#### Current Status
- **No i18n framework detected** - No next-intl or similar
- Manual string handling in components
- Swahili/English strings hardcoded
- `preferred_language` field exists in User model but not fully utilized

---

## 3. DATABASE (PostgreSQL) ANALYSIS

### 3.1 Current Schema

#### Existing Tables

**Predictions Tables:**
- `predictions_league` - League data
- `predictions_team` - Team data
- `predictions_match` - Match data
- `predictions_savedmatch` - User saved matches
- `predictions_savedmarket` - User saved markets
- `predictions_activederby` - Derby configurations
- `predictions_aiperformance` - AI performance tracking
- `predictions_aitrackrecordsnapshot` - AI performance snapshots
- `predictions_oddsbookmaker` - Bookmaker odds
- `predictions_oddsupdate` - Odds history
- `predictions_teamstanding` - Team standings
- `predictions_headtohead` - H2H statistics

**Accounts Tables:**
- `accounts_user` - User accounts
- `accounts_otpcode` - OTP codes (unused)

**Feed Tables:**
- `feed_card` - Feed cards
- `feed_pollvote` - Poll votes

**Match Room Tables:**
- `matchroom_matchroommessage` - Chat messages

### 3.2 Current Indexes

#### Existing Indexes
- `predictions_match.kickoff_at` (db_index=True)
- `predictions_aiperformance.date` (unique, db_index=True)
- `predictions_aitrackrecordsnapshot.generated_at` (db_index=True)
- `predictions_oddsbookmaker.match` + `market_type`
- `predictions_oddsbookmaker.bookmaker_name`
- `predictions_oddsbookmaker.-last_updated`

**No indexes specifically for user content or tips.**

### 3.3 Caching Strategy

#### Current Implementation
- **Redis** via django-redis
- Default timeout: 1 hour
- Key prefix: "bashiri"
- Connection pooling: max 10 connections
- Specific cache timeouts:
  - Live matches: 60 seconds
  - Fixtures: 2-5 minutes
  - Public profiles: 5 minutes

---

## 4. GAPS & MISSING PIECES FOR TIPS FEATURE

### 4.1 Database Gaps

**Missing Models:**
1. **UserTip** - Core model for user predictions/tips
2. **TipPerformance** - Track tip accuracy over time
3. **TipComment** - Comments on tips
4. **TipVote** - Upvotes/downvotes on tips
5. **TipCategory** - Categories for organizing tips
6. **UserTipStats** - Aggregate user tip statistics

**Missing Fields in User Model:**
- `tip_count` - Total tips posted
- `tip_accuracy` - Overall tip accuracy
- `followers_count` - Social proof
- `verified_tipster` - Badge for reliable tipsters

### 4.2 API Gaps

**Missing Endpoints:**
1. `POST /tips/` - Create new tip
2. `GET /tips/` - List public tips (filtered)
3. `GET /tips/{id}/` - Get specific tip
4. `PUT /tips/{id}/` - Update tip (before match)
5. `DELETE /tips/{id}/` - Delete tip
6. `POST /tips/{id}/vote/` - Vote on tip
7. `GET /tips/{id}/comments/` - Get tip comments
8. `POST /tips/{id}/comments/` - Add comment
9. `GET /users/{id}/tips/` - Get user's tips
10. `GET /tips/leaderboard/` - Tipster rankings
11. `POST /tips/{id}/verify/` - Verify tip result

### 4.3 Frontend Gaps

**Missing Pages:**
1. `/tips` - Public tips marketplace
2. `/tips/{id}` - Individual tip detail
3. `/tips/create` - Tip creation form
4. `/tips/my` - User's own tips
5. `/leaderboard` - Tipster rankings

**Missing Components:**
1. `TipCard` - Display tip in feed/list
2. `TipForm` - Create/edit tip form
3. `TipStats` - Tip performance display
4. `TipComments` - Comment system
5. `TipLeaderboard` - Rankings display
6. `TipFilter` - Filter tips by league/market

**Missing State Management:**
1. `tips.store.ts` - Tips state management
2. Tip filtering/sorting logic
3. Real-time tip updates

### 4.4 Real-time Gaps

**Missing WebSocket Features:**
1. Real-time tip updates
2. Live tip verification
3. Tip comment notifications
4. Leaderboard updates

---

## 5. RECOMMENDED DATABASE CHANGES

### 5.1 New Models

#### UserTip Model
```python
class UserTip(models.Model):
    """User-generated football prediction tips"""
    STATUS_CHOICES = [
        ("PENDING", "Pending"),  # Match not yet played
        ("CORRECT", "Correct"),  # Prediction was right
        ("INCORRECT", "Incorrect"),  # Prediction was wrong
        ("VOID", "Void"),  # Match postponed/cancelled
    ]
    
    VISIBILITY_CHOICES = [
        ("PUBLIC", "Public"),  # Visible to all users
        ("FOLLOWERS", "Followers Only"),  # Followers only
        ("PRIVATE", "Private"),  # Only tipster
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tips")
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="tips")
    market_key = models.CharField(max_length=50)  # e.g., "1X2", "OVER_UNDER_2_5"
    selection = models.CharField(max_length=50)  # e.g., "home_win", "over_2.5"
    confidence = models.PositiveSmallIntegerField(default=50, help_text="Confidence 0-100")
    reasoning = models.TextField(blank=True, help_text="User's analysis/reasoning")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="PENDING")
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default="PUBLIC")
    
    # Engagement metrics
    views_count = models.PositiveIntegerField(default=0)
    upvotes_count = models.PositiveIntegerField(default=0)
    downvotes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "tips_usertip"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["match", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["visibility", "-created_at"]),
            models.Index(fields=["market_key", "-created_at"]),
        ]
```

#### TipPerformance Model
```python
class TipPerformance(models.Model):
    """Track tip accuracy statistics over time"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tip_performance")
    
    # Overall stats
    total_tips = models.PositiveIntegerField(default=0)
    correct_tips = models.PositiveIntegerField(default=0)
    incorrect_tips = models.PositiveIntegerField(default=0)
    void_tips = models.PositiveIntegerField(default=0)
    accuracy_percentage = models.FloatField(default=0.0)
    
    # Market-specific stats
    tips_1x2 = models.PositiveIntegerField(default=0)
    correct_1x2 = models.PositiveIntegerField(default=0)
    accuracy_1x2 = models.FloatField(default=0.0)
    
    tips_btts = models.PositiveIntegerField(default=0)
    correct_btts = models.PositiveIntegerField(default=0)
    accuracy_btts = models.FloatField(default=0.0)
    
    tips_over_under = models.PositiveIntegerField(default=0)
    correct_over_under = models.PositiveIntegerField(default=0)
    accuracy_over_under = models.FloatField(default=0.0)
    
    # Streak tracking
    current_streak = models.PositiveSmallIntegerField(default=0)
    best_streak = models.PositiveSmallIntegerField(default=0)
    
    # Social proof
    followers_count = models.PositiveIntegerField(default=0)
    total_upvotes_received = models.PositiveIntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "tips_tipperformance"
    
    def calculate_accuracy(self):
        """Recalculate accuracy percentages"""
        if self.total_tips > 0:
            self.accuracy_percentage = round((self.correct_tips / self.total_tips) * 100, 1)
        
        if self.tips_1x2 > 0:
            self.accuracy_1x2 = round((self.correct_1x2 / self.tips_1x2) * 100, 1)
        if self.tips_btts > 0:
            self.accuracy_btts = round((self.correct_btts / self.tips_btts) * 100, 1)
        if self.tips_over_under > 0:
            self.accuracy_over_under = round((self.correct_over_under / self.tips_over_under) * 100, 1)
        
        self.save(update_fields=["accuracy_percentage", "accuracy_1x2", "accuracy_btts", "accuracy_over_under"])
```

#### TipComment Model
```python
class TipComment(models.Model):
    """Comments on user tips"""
    tip = models.ForeignKey(UserTip, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tip_comments")
    content = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name="replies")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "tips_tipcomment"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tip", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
        ]
```

#### TipVote Model
```python
class TipVote(models.Model):
    """Upvotes/downvotes on tips"""
    VOTE_CHOICES = [
        ("UP", "Upvote"),
        ("DOWN", "Downvote"),
    ]
    
    tip = models.ForeignKey(UserTip, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tip_votes")
    vote = models.CharField(max_length=4, choices=VOTE_CHOICES)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "tips_tipvote"
        unique_together = ["tip", "user"]
        indexes = [
            models.Index(fields=["tip", "-created_at"]),
        ]
```

### 5.2 User Model Extensions

#### Add to User Model
```python
# Add to accounts/models.py
class User(AbstractBaseUser, PermissionsMixin):
    # ... existing fields ...
    
    # Tip-specific fields
    tip_count = models.PositiveIntegerField(default=0)
    tip_accuracy = models.FloatField(default=0.0)
    verified_tipster = models.BooleanField(default=False)
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
```

---

## 6. RECOMMENDED API CHANGES

### 6.1 New Serializers

#### Tip Serializers (`backend/tips/serializers.py`)
```python
class UserTipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    match = MatchListSerializer(read_only=True)
    market_label = serializers.CharField(source="get_market_label", read_only=True)
    selection_label = serializers.CharField(source="get_selection_label", read_only=True)
    
    class Meta:
        model = UserTip
        fields = [
            'id', 'user', 'match', 'market_key', 'market_label',
            'selection', 'selection_label', 'confidence', 'reasoning',
            'status', 'visibility', 'views_count', 'upvotes_count',
            'downvotes_count', 'comments_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'status', 'views_count', 'upvotes_count', 'downvotes_count', 'comments_count']

class CreateTipSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserTip
        fields = ['match', 'market_key', 'selection', 'confidence', 'reasoning', 'visibility']
    
    def validate_match(self, value):
        if value.status != "SCHEDULED":
            raise serializers.ValidationError("Tips can only be created for scheduled matches")
        if value.kickoff_at < timezone.now():
            raise serializers.ValidationError("Cannot create tips for past matches")
        return value
```

### 6.2 New Views

#### Tip Views (`backend/tips/views.py`)
```python
class TipListView(APIView):
    """GET /tips/ - List public tips with filtering"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        tips = UserTip.objects.filter(visibility="PUBLIC", status="PENDING")
        
        # Filters
        league = request.query_params.get('league')
        market = request.query_params.get('market')
        user = request.query_params.get('user')
        sort = request.query_params.get('sort', '-created_at')
        
        if league:
            tips = tips.filter(match__league__code=league)
        if market:
            tips = tips.filter(market_key=market)
        if user:
            tips = tips.filter(user__username=user)
        
        # Sorting
        tips = tips.order_by(sort)
        
        # Pagination
        paginator = LimitOffsetPagination()
        result = paginator.paginate_queryset(tips, request)
        serializer = UserTipSerializer(result, many=True)
        return paginator.get_paginated_response(serializer.data)

class CreateTipView(APIView):
    """POST /tips/ - Create new tip"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CreateTipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tip = UserTip.objects.create(
            user=request.user,
            **serializer.validated_data
        )
        
        # Update user stats
        request.user.tip_count += 1
        request.user.save(update_fields=['tip_count'])
        
        return Response(UserTipSerializer(tip).data, status=status.HTTP_201_CREATED)

class TipDetailView(APIView):
    """GET /tips/{id}/ - Get specific tip details"""
    permission_classes = [AllowAny]
    
    def get(self, request, tip_id):
        tip = get_object_or_404(UserTip, pk=tip_id)
        
        # Increment view count
        tip.views_count += 1
        tip.save(update_fields=['views_count'])
        
        return Response(UserTipSerializer(tip).data)

class TipVoteView(APIView):
    """POST /tips/{id}/vote/ - Vote on tip"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, tip_id):
        tip = get_object_or_404(UserTip, pk=tip_id)
        vote_type = request.data.get('vote')  # 'UP' or 'DOWN'
        
        if vote_type not in ['UP', 'DOWN']:
            return Response({'detail': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)
        
        vote, created = TipVote.objects.get_or_create(
            tip=tip, user=request.user,
            defaults={'vote': vote_type}
        )
        
        if not created:
            vote.vote = vote_type
            vote.save()
        
        # Update tip counts
        tip.upvotes_count = tip.votes.filter(vote='UP').count()
        tip.downvotes_count = tip.votes.filter(vote='DOWN').count()
        tip.save(update_fields=['upvotes_count', 'downvotes_count'])
        
        return Response(UserTipSerializer(tip).data)

class TipLeaderboardView(APIView):
    """GET /tips/leaderboard/ - Get tipster rankings"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Get top tipsters by accuracy and volume
        leaderboard = TipPerformance.objects.filter(
            total_tips__gte=10  # Minimum tips requirement
        ).order_by('-accuracy_percentage', '-total_tips')[:50]
        
        serializer = TipPerformanceSerializer(leaderboard, many=True)
        return Response(serializer.data)
```

### 6.3 New Celery Task

#### Tip Verification Task
```python
@shared_task
def verify_tips_task():
    """
    Verify pending tips when matches finish.
    Runs every 5 minutes via Celery Beat.
    """
    from .models import UserTip
    from .services import is_prediction_correct
    
    # Get pending tips for finished matches
    pending_tips = UserTip.objects.filter(
        status="PENDING",
        match__status="FINISHED"
    ).select_related("match", "user")
    
    verified_count = 0
    for tip in pending_tips:
        try:
            home_score = tip.match.home_score
            away_score = tip.match.away_score
            
            is_correct = is_prediction_correct(
                tip.market_key, tip.selection, home_score, away_score
            )
            
            tip.status = "CORRECT" if is_correct else "INCORRECT"
            tip.verified_at = timezone.now()
            tip.save(update_fields=["status", "verified_at"])
            
            # Update user performance stats
            performance, _ = TipPerformance.objects.get_or_create(user=tip.user)
            performance.total_tips += 1
            if is_correct:
                performance.correct_tips += 1
                performance.current_streak += 1
                if performance.current_streak > performance.best_streak:
                    performance.best_streak = performance.current_streak
            else:
                performance.incorrect_tips += 1
                performance.current_streak = 0
            
            # Update market-specific stats
            if tip.market_key == "1X2":
                performance.tips_1x2 += 1
                if is_correct:
                    performance.correct_1x2 += 1
            elif tip.market_key == "BTTS":
                performance.tips_btts += 1
                if is_correct:
                    performance.correct_btts += 1
            elif tip.market_key.startswith("OVER_UNDER"):
                performance.tips_over_under += 1
                if is_correct:
                    performance.correct_over_under += 1
            
            performance.calculate_accuracy()
            verified_count += 1
            
        except Exception as e:
            logger.error(f"Error verifying tip {tip.id}: {e}")
    
    logger.info(f"verify_tips_task: verified {verified_count} tips")
    return f"Verified {verified_count} tips"
```

---

## 7. RECOMMENDED FRONTEND CHANGES

### 7.1 New API Functions

#### Tips API (`frontend/lib/api/tips.ts`)
```typescript
export interface UserTip {
  id: number;
  user: BashiriUser;
  match: Match;
  market_key: string;
  market_label: string;
  selection: string;
  selection_label: string;
  confidence: number;
  reasoning: string;
  status: "PENDING" | "CORRECT" | "INCORRECT" | "VOID";
  visibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
  views_count: number;
  upvotes_count: number;
  downvotes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export function getTips(params?: {
  league?: string;
  market?: string;
  user?: string;
  sort?: string;
}) {
  const query = new URLSearchParams();
  if (params?.league) query.append("league", params.league);
  if (params?.market) query.append("market", params.market);
  if (params?.user) query.append("user", params.user);
  if (params?.sort) query.append("sort", params.sort);
  
  return apiClient<{ count: number; results: UserTip[] }>(
    `/tips/${query ? '?' + query : ''}`,
    { skipAuth: true }
  );
}

export function createTip(data: {
  match: number;
  market_key: string;
  selection: string;
  confidence: number;
  reasoning: string;
  visibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
}) {
  return apiClient<UserTip>("/tips/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getTip(tipId: number) {
  return apiClient<UserTip>(`/tips/${tipId}/`, { skipAuth: true });
}

export function voteTip(tipId: number, vote: "UP" | "DOWN") {
  return apiClient<UserTip>(`/tips/${tipId}/vote/`, {
    method: "POST",
    body: JSON.stringify({ vote }),
  });
}

export function getTipLeaderboard() {
  return apiClient<TipPerformance[]>("/tips/leaderboard/", { skipAuth: true });
}
```

### 7.2 New Zustand Store

#### Tips Store (`frontend/stores/tips.store.ts`)
```typescript
"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TipsState {
  tips: UserTip[];
  selectedTip: UserTip | null;
  filters: {
    league: string | null;
    market: string | null;
    user: string | null;
    sort: string;
  };
  setTips: (tips: UserTip[]) => void;
  setSelectedTip: (tip: UserTip | null) => void;
  setFilters: (filters: Partial<TipsState['filters']>) => void;
  addTip: (tip: UserTip) => void;
  updateTip: (tipId: number, updates: Partial<UserTip>) => void;
}

export const useTipsStore = create<TipsState>()(
  persist(
    (set) => ({
      tips: [],
      selectedTip: null,
      filters: {
        league: null,
        market: null,
        user: null,
        sort: "-created_at",
      },
      setTips: (tips) => set({ tips }),
      setSelectedTip: (tip) => set({ selectedTip: tip }),
      setFilters: (filters) => set((state) => ({ 
        filters: { ...state.filters, ...filters } 
      })),
      addTip: (tip) => set((state) => ({ 
        tips: [tip, ...state.tips] 
      })),
      updateTip: (tipId, updates) => set((state) => ({
        tips: state.tips.map(tip => 
          tip.id === tipId ? { ...tip, ...updates } : tip
        ),
        selectedTip: state.selectedTip?.id === tipId 
          ? { ...state.selectedTip, ...updates }
          : state.selectedTip,
      })),
    }),
    {
      name: "bashiri-tips",
    }
  )
);
```

### 7.3 New Components

#### TipCard Component
```typescript
// components/tips/TipCard.tsx
"use client";
import { UserTip } from "@/lib/api/tips";
import { motion } from "framer-motion";
import { TrendingUp, Eye, ThumbsUp, MessageCircle } from "lucide-react";

interface TipCardProps {
  tip: UserTip;
  onClick?: () => void;
}

export function TipCard({ tip, onClick }: TipCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 border border-white/10 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center">
            <span className="text-xs font-bold text-black">
              {tip.user.username[0]?.toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-bold text-white">@{tip.user.username}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
          tip.status === "CORRECT" ? "bg-green-500/20 text-green-400" :
          tip.status === "INCORRECT" ? "bg-red-500/20 text-red-400" :
          "bg-yellow-500/20 text-yellow-400"
        }`}>
          {tip.status}
        </span>
      </div>
      
      <div className="mb-3">
        <p className="text-sm text-white/70 mb-1">
          {tip.match.home_team} vs {tip.match.away_team}
        </p>
        <p className="text-lg font-bold text-white">
          {tip.selection_label} on {tip.market_label}
        </p>
      </div>
      
      {tip.reasoning && (
        <p className="text-sm text-white/50 mb-3 line-clamp-2">
          {tip.reasoning}
        </p>
      )}
      
      <div className="flex items-center gap-4 text-xs text-white/50">
        <div className="flex items-center gap-1">
          <TrendingUp size={14} />
          <span>{tip.confidence}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye size={14} />
          <span>{tip.views_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbsUp size={14} />
          <span>{tip.upvotes_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle size={14} />
          <span>{tip.comments_count}</span>
        </div>
      </div>
    </motion.div>
  );
}
```

#### TipForm Component
```typescript
// components/tips/TipForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Match } from "@/lib/api/predictions";
import { createTip } from "@/lib/api/tips";
import { useAuthStore } from "@/stores/auth.store";

const tipSchema = z.object({
  market_key: z.string().min(1, "Market is required"),
  selection: z.string().min(1, "Selection is required"),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().optional(),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]),
});

interface TipFormProps {
  match: Match;
  onSuccess?: () => void;
}

export function TipForm({ match, onSuccess }: TipFormProps) {
  const { user } = useAuthStore();
  const form = useForm<z.infer<typeof tipSchema>>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      market_key: "1X2",
      selection: "home_win",
      confidence: 50,
      visibility: "PUBLIC",
    },
  });

  const onSubmit = async (data: z.infer<typeof tipSchema>) => {
    if (!user) return;
    
    try {
      await createTip({
        match: match.id,
        ...data,
      });
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create tip:", error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Form fields implementation */}
    </form>
  );
}
```

### 7.4 New Pages

#### Tips Marketplace Page
```typescript
// app/(main)/tips/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useTipsStore } from "@/stores/tips.store";
import { getTips } from "@/lib/api/tips";
import { TipCard } from "@/components/tips/TipCard";
import { TipFilter } from "@/components/tips/TipFilter";

export default function TipsPage() {
  const { tips, setTips, filters } = useTipsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTips();
  }, [filters]);

  const loadTips = async () => {
    try {
      setLoading(true);
      const data = await getTips(filters);
      setTips(data.results);
    } catch (error) {
      console.error("Failed to load tips:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh px-5 pt-safe pt-10 pb-24">
      <h1 className="text-2xl font-bold text-white mb-4">Tips Marketplace</h1>
      <TipFilter />
      {loading ? (
        <div className="text-center text-white/50">Loading tips...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 8. SECURITY & PERMISSIONS ANALYSIS

### 8.1 Current Security Setup

#### Authentication
- JWT-based authentication with SimpleJWT
- Access token lifetime: 7 days
- Refresh token lifetime: 90 days
- Token blacklisting on logout
- Auto-refresh on 401 errors

#### Permissions
- Admin-only endpoints use `IsBashiriAdmin` custom permission
- Most endpoints use `AllowAny` with client-side checks
- Subscription checks in views (not permissions)

#### Rate Limiting
- Anonymous: 100/hour
- Authenticated: 1000/hour
- Auth endpoints: 10/minute (login), 5/hour (register)
- Feed endpoint: 10000/hour

### 8.2 Security Considerations for Tips Feature

#### Required Security Measures

1. **Tip Ownership Validation**
   - Users can only edit/delete their own tips
   - Admin override capability

2. **Visibility Enforcement**
   - Server-side filtering for followers-only tips
   - Private tips visible only to tipster

3. **Spam Prevention**
   - Rate limiting for tip creation
   - Minimum confidence requirements
   - Daily tip limits per user

4. **Content Moderation**
   - Tip reasoning content filtering
   - Comment moderation
   - Report system for inappropriate tips

5. **Manipulation Prevention**
   - One vote per user per tip
   - View count manipulation prevention
   - Timestamp validation

#### Recommended Permission Classes

```python
class IsTipOwnerOrReadOnly(BasePermission):
    """Allow tip owner to edit, others read-only"""
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user

class CanViewTip(BasePermission):
    """Check if user can view tip based on visibility"""
    def has_object_permission(self, request, view, obj):
        if obj.visibility == "PUBLIC":
            return True
        if obj.visibility == "PRIVATE":
            return obj.user == request.user
        if obj.visibility == "FOLLOWERS":
            return obj.user.followers.filter(id=request.user.id).exists()
        return False
```

---

## 9. CACHING STRATEGY RECOMMENDATIONS

### 9.1 Current Caching Issues

**Problems:**
- No caching for user-generated content
- No cache invalidation strategy for real-time updates
- Potential stale data in leaderboards

### 9.2 Recommended Caching Strategy

#### Cache Keys & Timeouts
```python
# Tips caching
TIPS_LIST_CACHE_TIMEOUT = 60  # 1 minute for public tips
TIP_DETAIL_CACHE_TIMEOUT = 300  # 5 minutes for individual tips
LEADERBOARD_CACHE_TIMEOUT = 300  # 5 minutes for rankings
USER_TIPS_CACHE_TIMEOUT = 120  # 2 minutes for user's tips

# Cache key patterns
tips_list_key = f"tips:list:{filters_hash}"
tip_detail_key = f"tip:detail:{tip_id}"
leaderboard_key = "tips:leaderboard"
user_tips_key = f"tips:user:{user_id}"
```

#### Cache Invalidation Strategy
```python
def invalidate_tip_cache(tip_id):
    """Invalidate all caches related to a tip"""
    cache.delete_pattern(f"tips:list:*")
    cache.delete(f"tip:detail:{tip_id}")
    cache.delete("tips:leaderboard")
    
    # Invalidate user-specific cache
    tip = UserTip.objects.get(id=tip_id)
    cache.delete(f"tips:user:{tip.user_id}")

def invalidate_leaderboard_cache():
    """Invalidate leaderboard cache"""
    cache.delete("tips:leaderboard")
    cache.delete_pattern(f"tips:list:*")  # Re-sort lists
```

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)
1. **Database Setup**
   - Create new Django app `tips`
   - Create models: UserTip, TipPerformance, TipComment, TipVote
   - Add fields to User model
   - Create and run migrations
   - Add database indexes

2. **Backend API**
   - Create serializers
   - Create basic views (CRUD operations)
   - Add URL routes
   - Implement permission classes
   - Add rate limiting

3. **Celery Task**
   - Implement `verify_tips_task`
   - Add to Celery Beat schedule
   - Test tip verification logic

### Phase 2: Frontend Foundation (Week 3)
1. **API Integration**
   - Create tips API functions
   - Add TypeScript interfaces
   - Implement error handling

2. **State Management**
   - Create tips Zustand store
   - Implement filtering logic
   - Add real-time updates

3. **Core Components**
   - Build TipCard component
   - Build TipForm component
   - Build TipFilter component

### Phase 3: Pages & Features (Week 4)
1. **Pages**
   - Create tips marketplace page
   - Create tip detail page
   - Create tip creation page
   - Create user tips page
   - Create leaderboard page

2. **Social Features**
   - Implement voting system
   - Implement comments system
   - Add tip sharing

### Phase 4: Real-time & Polish (Week 5)
1. **Real-time Updates**
   - Add WebSocket for live tip updates
   - Implement real-time verification
   - Add leaderboard updates

2. **Performance**
   - Implement caching strategy
   - Add cache invalidation
   - Optimize database queries

3. **Security**
   - Implement content moderation
   - Add spam prevention
   - Implement rate limiting

### Phase 5: Testing & Launch (Week 6)
1. **Testing**
   - Unit tests for models
   - Integration tests for API
   - E2E tests for critical flows

2. **Monitoring**
   - Add logging for tip verification
   - Monitor cache hit rates
   - Track API performance

3. **Launch**
   - Feature flags for gradual rollout
   - User onboarding for tips feature
   - Documentation and support

---

## 11. FILE STRUCTURE ADDITIONS

### Backend Structure
```
backend/
├── tips/                          # New Django app
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── migrations/
│   ├── models.py                  # UserTip, TipPerformance, etc.
│   ├── serializers.py             # Tip serializers
│   ├── views.py                   # Tip API views
│   ├── urls.py                    # Tip URL routes
│   ├── permissions.py             # Tip-specific permissions
│   └── services.py                # Tip business logic
├── predictions/
│   └── tasks.py                   # Add verify_tips_task
└── accounts/
    └── models.py                  # Add tip-related fields
```

### Frontend Structure
```
frontend/
├── app/
│   └── (main)/
│       ├── tips/
│       │   ├── page.tsx           # Tips marketplace
│       │   ├── [id]/
│       │   │   └── page.tsx       # Tip detail
│       │   ├── create/
│       │   │   └── page.tsx       # Create tip
│       │   ├── my/
│       │   │   └── page.tsx       # My tips
│       │   └── leaderboard/
│       │       └── page.tsx       # Rankings
├── components/
│   └── tips/
│       ├── TipCard.tsx
│       ├── TipForm.tsx
│       ├── TipFilter.tsx
│       ├── TipStats.tsx
│       ├── TipComments.tsx
│       └── TipLeaderboard.tsx
├── stores/
│   └── tips.store.ts              # New tips store
└── lib/
    └── api/
        └── tips.ts                # Tips API functions
```

---

## 12. SUMMARY & RECOMMENDATIONS

### Current Strengths
- Solid Django + Next.js architecture
- Existing user authentication and profiles
- Real-time infrastructure (Channels/WebSocket)
- Comprehensive match data and AI predictions
- Redis caching infrastructure
- Celery task scheduling

### Key Challenges
- No existing user-generated content framework
- Need new database models and migrations
- Requires significant frontend development
- Real-time updates complexity
- Content moderation requirements

### Critical Success Factors
1. **Data Integrity**: Ensure tip verification is accurate and timely
2. **Performance**: Implement effective caching for high-traffic pages
3. **User Experience**: Simple tip creation process with clear feedback
4. **Social Dynamics**: Balance competition with community building
5. **Moderation**: Prevent spam and maintain content quality

### Risk Mitigation
- Start with MVP (basic tips + verification)
- Gradual feature rollout with monitoring
- Rate limiting to prevent abuse
- Content moderation tools from day one
- Comprehensive testing of verification logic

### Estimated Timeline
- **Week 1-2**: Backend foundation (models, API, tasks)
- **Week 3**: Frontend foundation (API, store, components)
- **Week 4**: Pages and core features
- **Week 5**: Real-time features and optimization
- **Week 6**: Testing and launch

**Total Estimated Time: 6 weeks for full implementation**

---

## APPENDIX: CODE REFERENCES

### Key Files Referenced

**Backend:**
- `backend/predictions/models.py` - Existing prediction models
- `backend/accounts/models.py` - User model structure
- `backend/predictions/views.py` - API view patterns
- `backend/predictions/tasks.py` - Celery task patterns
- `backend/matchroom/consumers.py` - WebSocket patterns
- `backend/config/settings.py` - Configuration and caching

**Frontend:**
- `frontend/stores/auth.store.ts` - Zustand store pattern
- `frontend/lib/api/client.ts` - API client pattern
- `frontend/lib/api/predictions.ts` - API integration pattern
- `frontend/components/predictions/` - Component patterns
- `frontend/app/(main)/profile/[username]/page.tsx` - Page patterns

### External Dependencies

**Backend:**
- Django REST Framework
- Django Channels
- Celery + Redis
- SimpleJWT
- django-redis

**Frontend:**
- Next.js 16
- React 19
- Zustand
- React Hook Form + Zod
- Framer Motion
- Lucide React

---

*Audit completed on 2026-08-21*
*Comprehensive analysis of Bashiri app architecture for User Tips/Predictions feature implementation*