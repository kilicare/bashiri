from chat.tools import tool_predict_fixture, tool_team_form, tool_head_to_head, tool_search_matches

# Test chat bot tools with fuzzy matching
print('Testing Chat Bot Tools with Fuzzy Matching:')
print('=' * 60)

# Test predict_fixture with fuzzy names
print('1. Testing predict_fixture with fuzzy names:')
result = tool_predict_fixture('EPL', 'Livrpool', 'Chelse')
print('Result:', result)

# Test team_form with fuzzy name
print('\n2. Testing team_form with fuzzy name:')
result = tool_team_form('Man City')
print('Result:', result)

# Test head_to_head with fuzzy names
print('\n3. Testing head_to_head with fuzzy names:')
result = tool_head_to_head('Spurs', 'Arsnall')
print('Result:', result)

# Test search_matches with fuzzy name
print('\n4. Testing search_matches with fuzzy name:')
result = tool_search_matches('totenham')
print('Result:', result)

print('\nAll chat bot fuzzy matching tests completed!')