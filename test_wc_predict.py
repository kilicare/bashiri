#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from predictions.ml.poisson_model import predict_fixture

try:
    result = predict_fixture('WorldCup', 'Spain', 'Belgium')
    print('✅ PREDICTION SUCCESSFUL!')
    print(f'AI Pick: {result["ai_pick"]}')
    print(f'Expected Goals: {result["expected_goals"]}')
except ValueError as e:
    print(f'❌ ValueError: {e}')
except KeyError as e:
    print(f'❌ KeyError: {e}')
except Exception as e:
    print(f'❌ {type(e).__name__}: {e}')
