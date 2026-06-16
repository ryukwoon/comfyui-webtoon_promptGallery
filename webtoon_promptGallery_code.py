import os
import json
import re
import urllib.request
import urllib.parse
from server import PromptServer
from aiohttp import web

WEB_DIRECTORY = "web"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

_cached_index = None

# ─────────────────────────────────────────
# 스캔 및 긍정/부정 자동 분류 로직
# ─────────────────────────────────────────
def perform_scan(base_dir):
    global _cached_index
    index_file = os.path.join(base_dir, "index.json")
    prompts_dir = os.path.join(base_dir, "prompts")
    result = []

    if os.path.exists(prompts_dir):
        for root, dirs, files in os.walk(prompts_dir):
            dirs.sort()
            for file in sorted(files):
                if not file.endswith(".txt"):
                    continue
                name = os.path.splitext(file)[0]

                rel = os.path.relpath(root, prompts_dir)
                category = rel.replace("\\", "/")
                if category == ".":
                    category = ""

                txt_path = os.path.join(root, file)
                pos_text = ""
                neg_text = ""

                try:
                    with open(txt_path, "r", encoding="utf-8") as f:
                        raw_text = f.read().strip()
                    
                    lower_raw = raw_text.lower()
                    if "[negative]" in lower_raw:
                        parts = re.split(r'(?i)\[negative\]', raw_text)
                        pos_text = parts[0].strip()
                        neg_text = parts[1].strip() if len(parts) > 1 else ""
                    elif "negative:" in lower_raw:
                        parts = re.split(r'(?i)negative:', raw_text)
                        pos_text = parts[0].strip()
                        neg_text = parts[1].strip() if len(parts) > 1 else ""
                    else:
                        pos_text = raw_text
                except Exception:
                    pos_text = ""
                    neg_text = ""

                if category:
                    card_path = f"{category}/{name}.preview.png"
                    file_path = f"{category}/{name}.txt"
                else:
                    card_path = f"{name}.preview.png"
                    file_path = f"{name}.txt"

                result.append({
                    "category": category,
                    "name": name,
                    "file": file_path,
                    "card": card_path,
                    "prompt": pos_text,
                    "negative_prompt": neg_text
                })

    try:
        with open(index_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[WebtoonPromptGallery] 파일 저장 실패: {e}")

    _cached_index = result
    print(f"[WebtoonPromptGallery] 스캔 및 분류 완료: {len(result)}개 항목")
    return result


def load_index(base_dir):
    global _cached_index
    if _cached_index is not None:
        return _cached_index

    index_file = os.path.join(base_dir, "index.json")
    if not os.path.exists(index_file):
        return perform_scan(base_dir)
    try:
        with open(index_file, "r", encoding="utf-8") as f:
            _cached_index = json.load(f)
            return _cached_index
    except Exception:
        return perform_scan(base_dir)


class Webtoon_Prompt_Gallery:
    CATEGORY = "WebtoonPromptGallery"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "positive_text": ("STRING", {"default": "", "multiline": True}),
                "negative_text": ("STRING", {"default": "", "multiline": True}),
            },
            "optional": {
                "selected_file": ("STRING", {"default": ""}),
            }
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("positive", "negative")
    FUNCTION = "run"
    OUTPUT_NODE = False

    def run(self, positive_text="", negative_text="", selected_file=""):
        return (positive_text, negative_text)


NODE_CLASS_MAPPINGS = {
    "Webtoon_Prompt_Gallery": Webtoon_Prompt_Gallery,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "Webtoon_Prompt_Gallery": "🖼 Webtoon Prompt Gallery (Accumulator)",
}

# ─────────────────────────────────────────
# API 서버 라우팅 정의
# ─────────────────────────────────────────
routes = PromptServer.instance.routes

@routes.post("/webtoon_prompt_gallery/rescan")
async def rescan_handler(request):
    try:
        result = perform_scan(BASE_DIR)
        return web.json_response({"status": "success", "count": len(result)})
    except Exception as e:
        return web.json_response({"status": "error", "message": str(e)}, status=500)


@routes.get("/webtoon_prompt_gallery/index")
async def get_index(request):
    try:
        data = load_index(BASE_DIR)
        return web.json_response(data)
    except Exception as e:
        return web.json_response([], status=500)


@routes.get("/webtoon_prompt_gallery/card/{filepath:.*}")
async def serve_card(request):
    filepath = request.match_info["filepath"]
    safe_path = os.path.normpath(os.path.join(BASE_DIR, "cards", filepath))
    
    if not safe_path.startswith(os.path.normpath(os.path.join(BASE_DIR, "cards"))):
        return web.Response(status=403)
        
    if not os.path.exists(safe_path) or os.path.isdir(safe_path):
        fallback_path = os.path.join(BASE_DIR, "web", "image", "null-preview.png")
        if os.path.exists(fallback_path):
            return web.FileResponse(fallback_path)
        return web.Response(status=404)
        
    return web.FileResponse(safe_path)


# [추가] 실시간 무료 번역을 처리하는 백엔드 라우트 (한글 ➔ 영어)
@routes.get("/webtoon_prompt_gallery/translate")
async def translate_handler(request):
    text = request.query.get("text", "")
    if not text:
        return web.json_response({"translated": ""})
    try:
        encoded_text = urllib.parse.quote(text)
        # MyMemory Translation API 사용 (한글 -> 영어 번역페어 지정)
        url = f"https://api.mymemory.translated.net/get?q={encoded_text}&langpair=ko|en"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            translated = data.get("responseData", {}).get("translatedText", "")
            return web.json_response({"translated": translated})
    except Exception as e:
        return web.json_response({"translated": "", "error": str(e)})