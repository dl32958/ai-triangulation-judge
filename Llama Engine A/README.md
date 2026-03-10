AI-Powered Invoice Field Extraction using LLaMA 3.2

What this project does
Extracts key fields from invoice images using OCR and a fine-tuned LLaMA model.
The model extracts 4 fields: company, date, address and total.

Workflow
1. Invoice image (.jpg) → Tesseract OCR → raw text (.txt)
2. Raw text → Fine-tuned LLaMA 3.2 1B → structured JSON output

Dataset
- SROIE2019 (Scanned Receipts OCR and Information Extraction)
- 626 real-world Malaysian receipts — 500 train, 126 test
- Source: https://www.kaggle.com/datasets/dl32958/sroie2019-ocr-rawtext

Model
- LLaMA 3.2 1B Instruct
- Fine-tuned using SFT + QLoRA (4-bit) via Unsloth
- 3 epochs, learning rate 2e-4

How to Run
1. Open the Kaggle notebook
2. Add SROIE2019 dataset
3. Enable T4 GPU
4. Run all cells

Results
- A zipped folder `test_results.zip` is included containing 347 `.txt` files
- Each `.txt` file corresponds to one test invoice and contains the predicted JSON output
- Example output inside each file:
```json
{
    "company": "OJC MARKETING SDN BHD",
    "date": "15/01/2019",
    "address": "NO 2 & 4, JALAN BAYU 4, BANDAR SERI ALAM, 81750 MASAI, JOHOR",
    "total": "193.00"
}
```
And Evaluation Summary is also added.
