from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_mark_legacy_users_onboarded"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="tip_preferences",
            field=models.JSONField(blank=True, default=list),
        ),
    ]