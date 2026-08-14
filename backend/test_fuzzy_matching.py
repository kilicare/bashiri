from predictions.ml.poisson_model import find_best_team_match, predict_fixture

# Test fuzzy matching
teams = ['Liverpool FC', 'Chelsea FC', 'Arsenal FC', 'Manchester City FC', 'Manchester United FC']

# Test cases
test_cases = [
    'Liverpool',
    'Chelsea', 
    'Arsenal',
    'Man City',
    'Man Utd',
    'Livrpool',  # Misspelled
    'Chelse',     # Misspelled
    'Arsnall',    # Misspelled
]

print('Testing fuzzy team name matching:')
print('=' * 60)
for test in test_cases:
    match, score = find_best_team_match(test, teams)
    match_str = match if match else 'None'
    print(f'{test:15} -> {match_str:25} (score: {score:.2f})')

print()
print('Testing prediction with exact team names:')
print('=' * 60)
try:
    result = predict_fixture('EPL', 'Liverpool FC', 'Chelsea FC')
    print('Exact names: SUCCESS')
    print('Home Win:', result["match_result"]["home_win"], '%')
    print('Draw:', result["match_result"]["draw"], '%')
    print('Away Win:', result["match_result"]["away_win"], '%')
except Exception as e:
    print('Exact names: FAILED -', e)

print()
print('Testing prediction with misspelled team names:')
print('=' * 60)
try:
    result = predict_fixture('EPL', 'Livrpool', 'Chelse')
    print('Misspelled names: SUCCESS')
    print('Home Win:', result["match_result"]["home_win"], '%')
    print('Draw:', result["match_result"]["draw"], '%')
    print('Away Win:', result["match_result"]["away_win"], '%')
except Exception as e:
    print('Misspelled names: FAILED -', e)