from predictions.ml.poisson_model import predict_fixture

# Test prediction with various spellings and abbreviations
test_cases = [
    ('EPL', 'Liverpool FC', 'Chelsea FC'),
    ('EPL', 'Liverpool', 'Chelsea'),
    ('EPL', 'Livrpool', 'Chelse'),
    ('EPL', 'Arsenal FC', 'Manchester City FC'),
    ('EPL', 'Arsenal', 'Man City'),
    ('EPL', 'Arsenal', 'manchester city'),
    ('EPL', 'Man Utd', 'Liverpool'),
    ('EPL', 'manchester united', 'chelsea'),
    ('EPL', 'Spurs', 'Arsenal'),
    ('EPL', 'tottenham', 'liverpool'),
]

print('Testing AI prediction with fuzzy matching and abbreviations:')
print('=' * 60)
for league, home, away in test_cases:
    try:
        result = predict_fixture(league, home, away)
        print('✅', home, 'vs', away, ': SUCCESS')
        print('   Home Win:', result["match_result"]["home_win"], '% | Draw:', result["match_result"]["draw"], '% | Away Win:', result["match_result"]["away_win"], '%')
    except Exception as e:
        print('❌', home, 'vs', away, ': FAILED -', e)
    print()