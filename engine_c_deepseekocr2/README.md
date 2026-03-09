# Invoice Extraction — DeepSeek-OCR-2

Three-pass pipeline extracting structured invoice fields, reasoning, and pixel coordinates using **DeepSeek-OCR-2** only — no second model needed.

---

## How it works

| Pass | Prompt | Output |
|------|--------|--------|
| 1 | `Free OCR.` | Full raw text in **visual-causal reading order** |
| 2 | `<\|grounding\|> Extract invoice fields as JSON ...` | `value` + `evidence` + `reasoning` per field |
| 3 | `Locate <\|ref\|>{evidence}<\|/ref\|> in the image.` | Bounding box `{x1,y1,x2,y2}` normalised 0–1 |

Pass 1 is where DeepSeek-OCR-2's **DeepEncoder V2 / Visual Causal Flow** shows: it reads in human-like order (structure → columns → rows → cells) rather than a fixed raster scan.

---

## Setup

```bash
conda create -n deepseek-ocr2 python=3.12.9 -y
conda activate deepseek-ocr2

pip install torch==2.6.0 torchvision==0.21.0 --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
pip install flash-attn==2.7.3 --no-build-isolation
```

**VRAM:** ~10 GB (bfloat16). For ~6 GB use `unsloth/DeepSeek-OCR-2` (4-bit) — change MODEL_NAME at top of script.

---

## Dataset

```
https://www.kaggle.com/datasets/lonelvino/cord-1000
```
Expected structure after unzip:
```
cord-1000/
  train/image/*.png
  dev/image/*.png
  test/image/*.png
```

---

## Usage

```bash
# Single image
python invoice_extractor.py --image receipt.png --output ./results

# Full dataset
python invoice_extractor.py --dataset ./cord-1000 --output ./results --max 20

# Skip annotated image output
python invoice_extractor.py --image receipt.png --no-vis
```

---

## Output per image

```json
{
  "raw_ocr_text": "STARBUCKS #1234\nTel: 555-0101\n1 Latte  5.25\nTOTAL  $12.50",
  "fields": {
    "total": {
      "value": "12.50",
      "evidence": "TOTAL  $12.50",
      "reasoning": "The line TOTAL $12.50 appears after all items, indicating the final amount.",
      "bboxes": [{ "x1": 0.12, "y1": 0.87, "x2": 0.88, "y2": 0.91 }]
    }
  }
}
```

Additionally produces `{stem}_annotated.png` with coloured boxes drawn per field.
