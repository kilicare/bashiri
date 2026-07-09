import sys
import os
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from feed.models import Card

card = Card.objects.filter(type='DEBATE').order_by('-created_at').first()
if card:
    if 'voting_closed' not in card.data:
        card.data['voting_closed'] = False
        card.save(update_fields=['data'])
        print(f'Updated debate #{card.id} with voting_closed=False')
        print('Updated data:', card.data)
    else:
        print(f'Debate #{card.id} already has voting_closed field')
else:
    print('No debate found')
