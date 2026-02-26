import streamlit as st
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import re

MODEL_PATH = "/home/prerana/Documents/Project Sakshi/hf_cache/hub/models--Salesforce--codegen-350M-mono/snapshots/d9107f71cca463240db1143f4a75a927a27fcb27"

st.set_page_config(page_title="Django AI Code Reviewer", layout="wide")
st.title(" Django AI Code Reviewer (Local CodeGen-350M)")

@st.cache_resource
def load_model():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, local_files_only=True)
    model = AutoModelForCausalLM.from_pretrained(MODEL_PATH, local_files_only=True)
    model.eval()
    return tokenizer, model

tokenizer, model = load_model()


# ─── Rule-based Django analyzer ─────────────────────────────────────────────

def rule_based_review(code: str) -> dict:
    is_django = any(kw in code for kw in [
        "django", "models.Model", "HttpResponse", "JsonResponse",
        "render", "request", "urls", "settings", "from django"
    ])
    if not is_django:
        return {"not_django": True}

    bugs, security, orm, best_practice = [], [], [], []
    lines = code.splitlines()

    for i, line in enumerate(lines, 1):
        # Bugs
        if re.search(r'\.objects\.get\(', line):
            bugs.append(f"Line {i}: `.objects.get()` raises `DoesNotExist` if not found. Use try/except or `.filter().first()`.")
        if "except:" in line:
            bugs.append(f"Line {i}: Bare `except:` catches all exceptions. Use specific types like `except MyModel.DoesNotExist:`.")

        # Security
        if re.search(r'request\.(GET|POST)\[', line):
            security.append(f"Line {i}: `request.GET['key']` raises KeyError. Use `.get('key')` with a default.")
        if re.search(r'email|password|token|secret', line, re.IGNORECASE) and "JsonResponse" in line:
            security.append(f"Line {i}: Sensitive field may be exposed in JsonResponse. Audit serialized fields.")
        if "DEBUG" in line and "True" in line:
            security.append(f"Line {i}: `DEBUG = True` must NOT be used in production.")
        if re.search(r'\.raw\(|\.execute\(', line):
            security.append(f"Line {i}: Raw SQL detected — ensure inputs are parameterized to prevent SQL injection.")
        if "@csrf_exempt" in line:
            security.append(f"Line {i}: `@csrf_exempt` disables CSRF protection. Use only if absolutely necessary.")

        # ORM
        if re.search(r'for .+ in .+\.objects\.all\(\)', line):
            orm.append(f"Line {i}: Iterating `.objects.all()` loads everything. Add filters, `.values()`, or pagination.")
        if re.search(r'\.filter\(.*\)\.count\(\)', line):
            orm.append(f"Line {i}: Use `.exists()` instead of `.count()` when you only need a boolean check.")

        # Best practices
        if re.search(r'def (get|post)\(self, request', line):
            if "@login_required" not in code and "LoginRequiredMixin" not in code:
                best_practice.append(f"Line {i}: No auth check found. Consider `@login_required` or `LoginRequiredMixin`.")
        if re.search(r'print\(', line):
            best_practice.append(f"Line {i}: Use Python `logging` module instead of `print()` in production.")
        if re.search(r'import \*', line):
            best_practice.append(f"Line {i}: Wildcard `import *` pollutes namespace. Import explicitly.")

    if "JsonResponse" in code and "Paginator" not in code and "objects.all" in code:
        best_practice.append("No pagination for list endpoint. Large querysets will hurt performance.")
    if "JsonResponse" in code and "Serializer" not in code:
        best_practice.append("Consider DRF serializers instead of manual JsonResponse dicts for validation & consistency.")

    return {"not_django": False, "bugs": bugs, "security": security, "orm": orm, "best_practice": best_practice}


# ─── Model: code completion (what CodeGen is actually good at) ───────────────

def generate_safe_pattern(code: str) -> str:
    """
    CodeGen is a completion model — ask it to complete code, not review prose.
    We give it a partial safe implementation and let it finish.
    """
    prompt = """# Django view with safe error handling and authentication check:

from django.http import JsonResponse
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import User

class SafeUserView(LoginRequiredMixin, View):
    def get(self, request):
        user_id = request.GET.get('id')
        if not user_id:
            return JsonResponse({'error': 'id is required'}, status=400)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
"""
    inputs = tokenizer(prompt, return_tensors="pt")
    input_length = inputs["input_ids"].shape[1]

    with torch.no_grad():
        outputs = model.generate(
            input_ids=inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_new_tokens=120,
            temperature=0.2,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )

    # ✅ KEY FIX: only decode newly generated tokens, not the entire prompt
    new_tokens = outputs[0][input_length:]
    generated = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
    return prompt + generated


# ─── UI ─────────────────────────────────────────────────────────────────────

code_input = st.text_area("Paste your Django code here:", height=300)
col1, col2 = st.columns(2)
run_review  = col1.button("🔍 Review Code")
run_suggest = col2.button("💡 Generate Safe Code Suggestion")

if run_review:
    if not code_input.strip():
        st.warning("Please paste some Django code.")
    else:
        with st.spinner("Analyzing..."):
            review = rule_based_review(code_input)

        if review.get("not_django"):
            st.error("This is not Django code.")
        else:
            st.subheader("🔍 Review Result")

            def show_section(title, items):
                st.markdown(f"**{title}**")
                if items:
                    for item in items:
                        st.markdown(f"- {item}")
                else:
                    st.markdown("<span style='color:green'>✅ None found</span>", unsafe_allow_html=True)

            show_section("🐛 Bugs", review["bugs"])
            show_section("🔒 Security Issues", review["security"])
            show_section("🗃️ ORM Improvements", review["orm"])
            show_section("📋 Best Practice Violations", review["best_practice"])

if run_suggest:
    if not code_input.strip():
        st.warning("Please paste some Django code.")
    else:
        with st.spinner("Generating from local model..."):
            suggestion = generate_safe_pattern(code_input)
        st.subheader("💡 Model-Generated Safe Code Pattern")
        st.info("ℹ️ CodeGen-350M completes code patterns — it does not follow review instructions like a chat model would.")
        st.code(suggestion, language="python")