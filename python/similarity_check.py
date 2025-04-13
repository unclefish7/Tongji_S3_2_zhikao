# Usage: python similarity_check.py --input checkinput.json --output checkoutput.json
# Description: 计算文本相似度，输入输出文件格式为 JSON
# 模型打包：模型保存后，在 python 目录下运行：pyinstaller --onefile --add-data "model;model" similarity_check.py
# 把生成的 disk 中的 exe 文件拖到 python 目录中即可在程序中调用 (具体见_utils.js的 compareQuestionsAI 方法)

import json
import os
import sys
import argparse
import numpy as np
from onnxruntime import InferenceSession
from transformers import AutoTokenizer
from scipy.spatial.distance import cosine

def get_resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except AttributeError:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)

# 命令行参数解析
parser = argparse.ArgumentParser(description="Similarity Checker")
parser.add_argument('--input', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args()

# 加载ONNX模型和tokenizer
model_dir = get_resource_path("onnx_model")
tokenizer = AutoTokenizer.from_pretrained(model_dir)
session = InferenceSession(
    os.path.join(model_dir, "text2vec.onnx"),
    providers=["CPUExecutionProvider"]  # 强制使用CPU提高兼容性
)

# 编码函数（模仿sentence-transformers的encode行为）
def encode(texts):
    inputs = tokenizer(
        texts,
        padding=True,
        truncation=True,
        return_tensors="np",
        max_length=128  # 限制最大长度
    )
    outputs = session.run(
        None,
        {
            "input_ids": inputs["input_ids"],
            "attention_mask": inputs["attention_mask"]
        }
    )
    # 取CLS向量作为句向量
    embeddings = outputs[0][:, 0]
    return embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)  # 归一化

# 主逻辑
with open(args.input, 'r', encoding='utf-8') as f:
    data = json.load(f)
sentences = data.get("sentences", [])

embeddings = encode(sentences)
similarity_results = []
threshold = 0.65

for i in range(len(sentences)):
    for j in range(i+1, len(sentences)):
        score = 1 - cosine(embeddings[i], embeddings[j])
        if score >= threshold:
            similarity_results.append({
                "textA": sentences[i],
                "textB": sentences[j],
                "score": round(float(score), 4)
            })

with open(args.output, 'w', encoding='utf-8') as f:
    json.dump(similarity_results, f, ensure_ascii=False, indent=2)

print(f"结果已保存至 {args.output}")