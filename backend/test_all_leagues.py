"""
Test script to verify predictions work for all 12 leagues in bashiri_prediction_models.json

This script should be run inside the Docker container:
docker-compose exec backend python test_all_leagues.py

Or if using Docker directly:
docker exec -it <container_name> python test_all_leagues.py
"""
import sys
import os
import json

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from predictions.ml.poisson_model import load_models, get_league_params, predict_fixture, get_available_leagues, sanitize_parameter
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("This script needs to be run inside the Docker container where dependencies are installed.")
    print("Try: docker-compose exec backend python test_all_leagues.py")
    sys.exit(1)

def test_all_leagues():
    """Test that predictions work for all 12 leagues"""
    print("Testing BASHIRI prediction model for all 12 leagues...")
    print("=" * 60)
    
    # Load models and get available leagues
    models = load_models()
    available_leagues = get_available_leagues()
    
    print(f"Found {len(available_leagues)} leagues in ML model:")
    for league in available_leagues:
        print(f"  - {league}")
    
    print("\n" + "=" * 60)
    print("Testing predictions for each league...")
    print("=" * 60)
    
    success_count = 0
    failure_count = 0
    
    for league_code in available_leagues:
        try:
            # Get league parameters
            teams, home_advantage, league_avg_goals = get_league_params(league_code)
            
            # Get first team as home and second team as away for testing
            team_names = list(teams.keys())
            if len(team_names) < 2:
                print(f"❌ {league_code}: Not enough teams for testing")
                failure_count += 1
                continue
                
            home_team = team_names[0]
            away_team = team_names[1]
            
            # Test prediction
            prediction = predict_fixture(league_code, home_team, away_team)
            
            # Validate prediction structure
            required_keys = ['expected_goals', 'match_result', 'double_chance', 'over_under', 'btts', 'ai_pick']
            missing_keys = [key for key in required_keys if key not in prediction]
            
            if missing_keys:
                print(f"❌ {league_code}: Missing keys in prediction: {missing_keys}")
                failure_count += 1
                continue
                
            # Validate xG values are within safe bounds
            home_xg = prediction['expected_goals']['home_xg']
            away_xg = prediction['expected_goals']['away_xg']
            
            if not (0.05 <= home_xg <= 6.0) or not (0.05 <= away_xg <= 6.0):
                print(f"❌ {league_code}: xG values out of bounds - home: {home_xg}, away: {away_xg}")
                failure_count += 1
                continue
                
            # Validate probabilities sum to approximately 100%
            match_result = prediction['match_result']
            total_prob = match_result['home_win'] + match_result['draw'] + match_result['away_win']
            
            if not (95 <= total_prob <= 105):  # Allow small rounding errors
                print(f"❌ {league_code}: Probabilities don't sum to 100%: {total_prob}")
                failure_count += 1
                continue
                
            print(f"✅ {league_code}: Prediction successful")
            print(f"   Teams: {home_team} vs {away_team}")
            print(f"   xG: home={home_xg:.2f}, away={away_xg:.2f}")
            print(f"   AI Pick: {prediction['ai_pick']['selection']} ({prediction['ai_pick']['confidence']}%)")
            success_count += 1
            
        except Exception as e:
            print(f"❌ {league_code}: Error - {str(e)}")
            failure_count += 1
    
    print("\n" + "=" * 60)
    print(f"Test Results: {success_count} successful, {failure_count} failed")
    print("=" * 60)
    
    if failure_count == 0:
        print("🎉 All leagues passed! Predictions work for all 12 leagues.")
        return True
    else:
        print(f"⚠️  {failure_count} leagues failed. Please check the errors above.")
        return False

def test_sanitize_parameter():
    """Test the sanitize_parameter function"""
    print("\n" + "=" * 60)
    print("Testing sanitize_parameter function...")
    print("=" * 60)
    
    # Test normal values
    assert sanitize_parameter(1.5) == 1.5, "Normal value should pass through"
    print("✅ Normal value test passed")
    
    # Test values below minimum
    assert sanitize_parameter(0.01) == 0.05, "Value below min should be clamped to min"
    print("✅ Below minimum test passed")
    
    # Test values above maximum
    assert sanitize_parameter(10.0) == 6.0, "Value above max should be clamped to max"
    print("✅ Above maximum test passed")
    
    # Test extreme values (like Eredivisie)
    extreme_value = 2592238797.6573  # Extreme value from Eredivisie data
    sanitized = sanitize_parameter(extreme_value)
    assert sanitized == 6.0, f"Extreme value {extreme_value} should be clamped to 6.0, got {sanitized}"
    print(f"✅ Extreme value test passed (sanitized {extreme_value} to {sanitized})")
    
    print("✅ All sanitize_parameter tests passed")
    return True

if __name__ == "__main__":
    try:
        # Test sanitize_parameter first
        test_sanitize_parameter()
        
        # Test all leagues
        all_passed = test_all_leagues()
        
        sys.exit(0 if all_passed else 1)
    except Exception as e:
        print(f"❌ Test script failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)