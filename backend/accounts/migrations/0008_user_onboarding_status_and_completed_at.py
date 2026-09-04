from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_userfollow_user_following"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="onboarding_status",
            field=models.CharField(
                choices=[
                    ("not_started", "Not Started"),
                    ("completed", "Completed"),
                    ("skipped", "Skipped"),
                ],
                default="not_started",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="onboarding_completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]