"""chat/utils.py — Groq function-calling: LLM inaita tools, si kubuni jibu."""
import json

from django.conf import settings
from groq import Groq

from .tools import (
    tool_predict_fixture,
    tool_team_form,
    tool_head_to_head,
    tool_ai_track_record,
    tool_active_derby,
    tool_search_matches,
)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "predict_fixture",
            "description": "Tumia hii tool wakati mtu anauliza kuhusu PREDICTION ya mechi fulani au anataka kujua nani atashinda mechi. Inahitaji jina la timu ya nyumbani, timu ya ugenini, na kodi ya ligi. Mfano: 'Man City vs Arsenal' au 'Nani atashinda Chelsea vs Liverpool?'",
            "parameters": {
                "type": "object",
                "properties": {
                    "league_code": {
                        "description": "Kodi ya ligi (EPL kwa Premier League, LaLiga kwa La Liga, Bundesliga, Ligue1)",
                        "type": "string"
                    },
                    "home_team": {
                        "description": "Jina la timu ya nyumbani (mfano: Manchester City, Chelsea, Man City, Liverpool). System inatambua abbreviations na spelling errors.",
                        "type": "string"
                    },
                    "away_team": {
                        "description": "Jina la timu ya ugenini (mfano: Arsenal, Liverpool, Spurs, Man Utd). System inatambua abbreviations na spelling errors.",
                        "type": "string"
                    }
                },
                "required": ["league_code", "home_team", "away_team"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "team_form",
            "description": "Tumia hii tool wakati mtu anauliza kuhusu FORM ya timu moja tu, matokeo ya mwisho, au utendaji wa timu fulani pekee. Inahitaji jina la timu moja tu. Mfano: 'Form ya Man City', 'Arsenal wamekuwaje', 'Simba form yake'",
            "parameters": {
                "type": "object",
                "properties": {
                    "team_name": {
                        "description": "Jina la timu moja tu (mfano: Manchester City, Simba, Arsenal, Man City, Liverpool). System inatambua abbreviations na spelling errors.",
                        "type": "string"
                    }
                },
                "required": ["team_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "head_to_head",
            "description": "Tumia hii tool wakati mtu anauliza kuhusu HISTORIA ya mechi kati ya timu mbili, mechi za awali, au head-to-head. Inahitaji majina ya timu mbili. Mfano: 'Head to head Man City vs Liverpool', 'Mechi za awali Chelsea vs Arsenal'",
            "parameters": {
                "type": "object",
                "properties": {
                    "team1_name": {
                        "description": "Jina la timu ya kwanza (mfano: Manchester City, Man City, Liverpool). System inatambua abbreviations na spelling errors.",
                        "type": "string"
                    },
                    "team2_name": {
                        "description": "Jina la timu ya pili (mfano: Arsenal, Spurs, Chelsea). System inatambua abbreviations na spelling errors.",
                        "type": "string"
                    }
                },
                "required": ["team1_name", "team2_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "ai_track_record",
            "description": "Tumia hii tool wakati mtu anauliza kuhusu TRACK RECORD ya AI, accuracy ya predictions, au utendaji wa AI. Mfano: 'AI track record', 'Accuracy ya AI', 'AI imeshinda ngapi'",
            "parameters": {
                "type": "object",
                "properties": {
                    "league_code": {
                        "description": "Kodi ya ligi (optional - kama haipatikani, rudisha overall accuracy)",
                        "type": "string"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "active_derby",
            "description": "Tumia hii tool wakati mtu anauliza kuhusu DERBY zinazoendelea sasa au mechi kubwa za rivalry. Mfano: 'Kuna derby leo?', 'Derby zinazoendelea'",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_matches",
            "description": "Tumia hii tool wakati mtu anataka kutafuta mechi kwa jina la timu, au anataka kuona mechi zote za timu fulani. Mfano: 'Mechi za Man City', 'Tafuta Arsenal', 'Simba mechi zake'",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "description": "Jina la timu au sehemu ya jina la timu unayotaka kutafuta mechi zake",
                        "type": "string"
                    },
                    "status": {
                        "description": "Status ya mechi (optional: SCHEDULED, LIVE, FINISHED)",
                        "type": "string"
                    }
                },
                "required": ["query"]
            }
        }
    }
]

SYSTEM_PROMPT = (
    "Wewe ni Bashiri AI, msaidizi wa uchambuzi wa mpira wa miguu. "
    "Jibu kwa Kiswahili, kwa ufupi na uwazi. "
    "Muhimu sana: UNA tools 6 zinazopatikana: predict_fixture, team_form, head_to_head, ai_track_record, active_derby, search_matches. "
    "KILA mara mtu anauliza kuhusu prediction, form, head-to-head, track record, derby, au kutafuta mechi, "
    "LAZIMA uitie tool inayofaa. "
    "KATIKA hali yoyote - USIBUNI data yoyote. USIBUNI asilimia. USIBUNI matokeo. "
    "Ikiwa hakuna tool inayofaa kwa swali, jibu kwa Kiswahili tu bila kubuni data. "
    "IMPORTANT: System inatambua fuzzy matching kwa majina ya timu - unaweza kutumia abbreviations (Man City, Spurs, Man Utd) "
    "na spelling errors (Livrpool, Chelse) zote zitatambuliwa vizuri."
)


def get_chat_response(user_message: str, history: list) -> tuple[str, str | None, dict | None]:
    """
    Rudisha tuple: (reply_text, tool_name, tool_data)
    - reply_text: Maandishi ya jibu la AI
    - tool_name: Jina la tool iliyoitwa (au None kama hakuna tool)
    - tool_data: Matokeo ya tool (au None kama hakuna tool)
    """
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    # Build conversation history for Groq
    messages = []
    for msg in history:
        if msg["role"] == "user":
            messages.append({"role": "user", "content": msg["content"]})
        elif msg["role"] == "assistant":
            messages.append({"role": "assistant", "content": msg["content"]})
    
    # Add system prompt
    messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})
    
    # Add current user message
    messages.append({"role": "user", "content": user_message})

    # Send message with tools
    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=messages,
        tools=TOOLS,
        tool_choice="auto"
    )

    # Check if function call was made
    if response.choices[0].message.tool_calls:
        tool_name = None
        tool_data = None

        for tool_call in response.choices[0].message.tool_calls:
            tool_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)

            # Dictionary mapping ya tool_name -> function
            tool_functions = {
                "predict_fixture": tool_predict_fixture,
                "team_form": tool_team_form,
                "head_to_head": tool_head_to_head,
                "ai_track_record": tool_ai_track_record,
                "active_derby": tool_active_derby,
                "search_matches": tool_search_matches,
            }

            tool_func = tool_functions.get(tool_name)
            if tool_func:
                try:
                    result = tool_func(**args)
                    tool_data = result
                except Exception as exc:
                    result = {"error": str(exc)}
                    tool_data = result
            else:
                result = {"error": f"Tool '{tool_name}' haipatikani"}
                tool_data = result

        # Return tool result directly without sending back to model
        return f"Data kutoka tool '{tool_name}': {json.dumps(result, indent=2)}", tool_name, tool_data

    return response.choices[0].message.content, None, None