"""
matchroom/moderation.py

Wordlist filter ya msingi ya Match Room chat. Hii SI moderation kamili
(mfumo mkubwa zaidi ni kazi ya baadaye), ni "first line of defense"
inayozuia matusi ya wazi kabla hayajachapishwa.
"""
import re

BANNED_WORDS = {
    # Kiswahili — msingi (orodha itaongezwa na admin baadaye kupitia Django Admin)
    "mjinga", "pumbavu", "shenzi", "malaya", "kahaba", "punda",
    # English — msingi
    "fuck", "shit", "bitch", "asshole", "nigger", "cunt",
}

_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(w) for w in BANNED_WORDS) + r")\b",
    re.IGNORECASE,
)


def contains_banned_words(text: str) -> bool:
    return bool(_PATTERN.search(text))