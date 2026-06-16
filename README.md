## 🖼 ComfyUI Webtoon Prompt Gallery (Accumulator)

A powerful, native-feeling prompt builder and accumulator extension for ComfyUI. Build and manage your stylized prompt library efficiently without cluttering your canvas.

▒▒▒▒▒ **Necessity and Features of WebtoonPromptGallery Nodes** ▒▒▒▒▒
WebtoonPromptGallery was developed to enhance convenience when creating prompts for **SDXL (Illustrious)** models. It allows users to build prompts for each category (especially Danbooru tags) as text files, providing thumbnails that automatically load the corresponding prompts into the input field when clicked.

## Installation
1. Navigate to your ComfyUI custom nodes directory: 
`ComfyUI/custom_nodes/`
2. Clone this repository:
```bash
git clone https://github.com/ryukwoon/comfyui-webtoon_promptGallery.git
```

## Directory Structure
```text
comfyui-webtoon_promptGallery/  (Custom node root folder)
├── cards/                      (User card .preview.png image folder)
├── prompts/                    (User prompt .txt folder)
├── web/
│   ├── image/
│   │   ├── RyuKwoon_Toon.ico   (Official title icon)
│   │   └── null-preview.png    (Default placeholder thumbnail)
│   └── webtoon_promptGallery_UI.js  (Core frontend UI code)
├── __init__.py                      (ComfyUI loader module)
├── index.json                       (Automatically generated index file)
└── webtoon_promptGallery_code.py     (Core backend Python code)
```

## Node Location
Nodes -> Extensions -> **WebtoonPromptGallery**

## Key Features
- Zero-Lag Right-Side Drawer: A sliding sidebar on the right side of the screen containing your category tree and card grid. Completely avoids overlapping with ComfyUI's native left menus.

- Visual Prompt Accumulator: Append prompts dynamically to positive and negative fields inside the node with comma separators just by clicking thumbnails.

- Dynamic weight control (`+` / `-`) for individual tags in the sidebar editor.

- One-click tag deletion (`✕`).

- Automatic Korean-to-English translation input bar.

## Thumbnail Resizing
Adjust the thumbnail size freely from 80px to 300px using the slider at the bottom of the gallery window.

## Prompt Preview
Hover your mouse cursor over a thumbnail to preview the associated prompt text.

## Negative Prompt Loading
To load negative prompts, simply click the negative text box, then click the desired thumbnails. (If a prompt is added by mistake, it can be manually removed from the text box.)

## Background Settings
Customize the gallery background color via the settings menu at the top. Three themes are currently provided: `White`, `Dark`, and `Default ComfyUI`.

## Data Refresh (Rescan)
If you add new prompt files, click the "`Rescan`" button at the bottom of the gallery window to refresh the data without restarting ComfyUI.

## Automatic Thumbnail Placeholder
If a prompt file exists without a corresponding thumbnail, a default placeholder image is automatically assigned, while the prompt functionality remains fully operational.

## Automatic Prompt Accumulation
When loading prompts via thumbnail clicks, the system automatically appends a comma, ensuring the field is ready for the next entry. Continuously clicking different thumbnails will keep appending prompts.


---

## Q/A
**※ Why did you create this?**

I wanted a way to apply prompts while visualizing them beforehand, but couldn't find an existing node for this purpose. There are very few extensions specifically for webtoon-related tasks or similar to WebUI Forge's gallery extensions.


**※ Are you an AI programmer?**

I am a webtoon artist. Coding is one of my hobbies. I was able to create this with the help of AI, while brushing up on commands I hadn't used in a long time.
