from django.db import migrations


def mark_legacy_users_onboarded(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(onboarding_status="not_started").update(
        onboarding_status="completed",
        onboarding_completed_at=None,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0008_user_onboarding_status_and_completed_at"),
    ]

    operations = [
        migrations.RunPython(mark_legacy_users_onboarded, migrations.RunPython.noop),
    ]