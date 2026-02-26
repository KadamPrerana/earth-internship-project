from transformers import AutoTokenizer, AutoModelForCausalLM

model_name = "Salesforce/codegen-350M-mono" # Use 'multi' for multiple languages or 'nl' for natural language

# This command triggers the download
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

print("Model downloaded and loaded successfully!")