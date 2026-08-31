from predictions.models import Match
from predictions.services import build_match_analysis

# Get the match
m = Match.objects.filter(home_team__name='Stade Rennais FC 1901', away_team__name='Le Mans FC').first()
if m:
    print(f'Match: {m.home_team.name} {m.home_score} - {m.away_score} {m.away_team.name}')
    print(f'Status: {m.status}')
    
    # Build analysis
    analysis = build_match_analysis(m, viewer_is_subscriber=True)
    
    print(f'\nCorrect count: {analysis["correct_count"]}')
    print(f'Total markets: {len(analysis["markets"])}')
    
    # Check each market
    for market in analysis["markets"]:
        print(f'\n{market["label"]}:')
        print(f'  AI Pick: {market["ai_pick"]}')
        print(f'  AI Correct: {market["ai_was_correct"]}')
        if market["ai_pick"] and market["ai_was_correct"]:
            print(f'  ✅ CORRECT')
        elif market["ai_pick"]:
            print(f'  ❌ INCORRECT')
else:
    print('Match not found')
