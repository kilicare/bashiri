from herocarousel.models import CustomSlide
from django.utils import timezone
from datetime import timedelta

for i in range(3, 8):
    CustomSlide.objects.create(
        title=f'Test Slide {i}',
        subtitle=f'Slide {i}',
        image_url=f'https://test.com/img{i}.jpg',
        cta_label='Test',
        route='/test',
        accent_color='#00FF87',
        is_active=True,
        order=i
    )
print('Created slides 3-7')
print('Total custom slides:', CustomSlide.objects.filter(is_active=True).count())
