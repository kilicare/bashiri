"""
JSON Schema Validator for BASHIRI ML Model

This script validates that bashiri_prediction_models.json contains all required
parameters for every league and team. It FAILS if any required parameters are missing.
"""

import json
import sys
import os

def validate_json_schema():
    """Validate JSON schema and report missing parameters"""
    
    json_path = os.path.join(
        os.path.dirname(__file__),
        'predictions',
        'ml',
        'data',
        'bashiri_prediction_models.json'
    )
    
    if not os.path.exists(json_path):
        print(f"❌ JSON file not found: {json_path}")
        return False
    
    print("=" * 80)
    print("BASHIRI ML JSON SCHEMA VALIDATION")
    print("=" * 80)
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    errors = []
    warnings = []
    
    # Validate top-level structure
    required_top_level = ['schema_version', 'model_info', 'elo', 'leagues']
    for key in required_top_level:
        if key not in data:
            errors.append(f"Missing top-level key: {key}")
    
    # Validate ELO structure
    if 'elo' in data:
        elo = data['elo']
        required_elo = ['initial_rating', 'k_factor', 'home_advantage_points', 'scale', 'ratings']
        for key in required_elo:
            if key not in elo:
                errors.append(f"Missing ELO key: elo.{key}")
        
        if 'ratings' in elo and not isinstance(elo['ratings'], dict):
            errors.append("elo.ratings must be a dictionary")
    
    # Validate leagues structure
    if 'leagues' not in data:
        errors.append("Missing top-level key: leagues")
    else:
        leagues = data['leagues']
        if not isinstance(leagues, dict):
            errors.append("leagues must be a dictionary")
        else:
            for league_name, league_data in leagues.items():
                if not isinstance(league_data, dict):
                    errors.append(f"League '{league_name}' must be a dictionary")
                    continue
                
                # Validate league structure
                required_league_keys = ['elo_coefficient', 'baseline', 'teams']
                for key in required_league_keys:
                    if key not in league_data:
                        errors.append(f"League '{league_name}' missing key: {key}")
                
                # Validate baseline
                if 'baseline' in league_data:
                    baseline = league_data['baseline']
                    required_baseline = ['avg_goals', 'home_advantage']
                    for key in required_baseline:
                        if key not in baseline:
                            errors.append(f"League '{league_name}' baseline missing: {key}")
                
                # Validate teams
                if 'teams' in league_data:
                    teams = league_data['teams']
                    if not isinstance(teams, dict):
                        errors.append(f"League '{league_name}' teams must be a dictionary")
                    else:
                        for team_name, team_params in teams.items():
                            if not isinstance(team_params, dict):
                                errors.append(f"League '{league_name}' team '{team_name}' must be a dictionary")
                                continue
                            
                            required_team_keys = ['attack', 'defense']
                            for key in required_team_keys:
                                if key not in team_params:
                                    errors.append(f"League '{league_name}' team '{team_name}' missing: {key}")
                            
                            # Validate parameter types
                            if 'attack' in team_params:
                                try:
                                    float(team_params['attack'])
                                except (ValueError, TypeError):
                                    errors.append(f"League '{league_name}' team '{team_name}' attack is not a number")
                            
                            if 'defense' in team_params:
                                try:
                                    float(team_params['defense'])
                                except (ValueError, TypeError):
                                    errors.append(f"League '{league_name}' team '{team_name}' defense is not a number")
    
    # Print validation report
    print(f"\n📊 Total Leagues: {len(data.get('leagues', {}))}")
    print(f"📊 Total Teams with ELO: {len(data.get('elo', {}).get('ratings', {}))}")
    
    if errors:
        print(f"\n❌ VALIDATION FAILED - {len(errors)} ERROR(S) FOUND:")
        for i, error in enumerate(errors, 1):
            print(f"  {i}. {error}")
        return False
    else:
        print("\n✅ VALIDATION PASSED - JSON schema is complete")
        
        # Print detailed league report
        print("\n📋 LEAGUE REPORT:")
        print("-" * 80)
        for league_name, league_data in data.get('leagues', {}).items():
            teams = league_data.get('teams', {})
            print(f"\n{league_name}:")
            print(f"  Teams: {len(teams)}")
            print(f"  ELO Coefficient: {league_data.get('elo_coefficient', 'N/A')}")
            print(f"  Average Goals: {league_data.get('baseline', {}).get('avg_goals', 'N/A')}")
            print(f"  Home Advantage: {league_data.get('baseline', {}).get('home_advantage', 'N/A')}")
            
            # Check if teams have ELO ratings
            elo_ratings = data.get('elo', {}).get('ratings', {})
            teams_with_elo = sum(1 for team in teams.keys() if team in elo_ratings)
            print(f"  Teams with ELO: {teams_with_elo}/{len(teams)}")
        
        return True

if __name__ == "__main__":
    success = validate_json_schema()
    sys.exit(0 if success else 1)