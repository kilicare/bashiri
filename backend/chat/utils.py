"""chat/utils.py — Groq function-calling: LLM inaita predict_fixture(), si kubuni jibu."""
import json

from django.conf import settings
from groq import Groq

from predictions.ml.poisson_model import predict_fixture

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "predict_fixture",
            "description": "Pata AI prediction ya mechi kati ya timu mbili kwenye ligi fulani.",
            "parameters": {
                "type": "object",
                "properties": {
                    "league_code": {
                        "type": "string",
                        "enum": ["EPL", "LaLiga", "Bundesliga", "Ligue1"],
                        "description": "Kodi ya ligi",
                    },
                    "home_team": {"type": "string", "description": "Jina la timu ya nyumbani"},
                    "away_team": {"type": "string", "description": "Jina la timu ya ugenini"},
                },
                "required": ["league_code", "home_team", "away_team"],
            },
        },
    }
]

SYSTEM_PROMPT = (
    "Wewe ni Bashiri AI, msaidizi wa uchambuzi wa mpira wa miguu. "
    "Jibu kwa Kiswahili, kwa ufupi na uwazi. TUMIA function predict_fixture "
    "kupata takwimu halisi — USIBUNI namba zozote za asilimia peke yako."
)


def get_chat_response(user_message: str, history: list) -> str:
    client = Groq(api_key=settings.GROQ_API_KEY)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history + [
        {"role": "user", "content": user_message}
    ]

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        tools=TOOLS,
        tool_choice="auto",
    )

    message = response.choices[0].message

    if message.tool_calls:
        messages.append(message)
        for tool_call in message.tool_calls:
            args = json.loads(tool_call.function.arguments)
            try:
                result = predict_fixture(args["league_code"], args["home_team"], args["away_team"])
            except ValueError as exc:
                result = {"error": str(exc)}

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result),
            })

        second_response = client.chat.completions.create(
            model="llama-3.1-8b-instant", messages=messages,
        )
        return second_response.choices[0].message.content

    return message.content