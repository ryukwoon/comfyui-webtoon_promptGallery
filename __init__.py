import os
from .webtoon_promptGallery_code import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# ComfyUI 0.24.0+ 정식 규격 웹 디렉토리 정의
WEB_DIRECTORY = os.path.join(os.path.dirname(__file__), "web")

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]