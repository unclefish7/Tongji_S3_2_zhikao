# similarity_check.py

import json
import os
from sentence_transformers import SentenceTransformer, util

# 加载模型（首次运行需联网，之后可脱机）
# model = SentenceTransformer("shibing624/text2vec-base-chinese")
model = SentenceTransformer(os.path.join(os.path.dirname(__file__), 'model'))


# 路径设定
input_path = os.path.join(os.path.dirname(__file__), 'checkinput.json')
output_path = os.path.join(os.path.dirname(__file__), 'checkoutput.json')

# 读取题目内容
with open(input_path, 'r', encoding='utf-8') as f:
    data = json.load(f)
sentences = data.get("sentences", [])

# 编码为向量
embeddings = model.encode(sentences, convert_to_tensor=True)

# 相似度矩阵计算
similarity_results = []
threshold = 0.65  # 你可以根据需要调高或调低阈值

for i in range(len(sentences)):
    for j in range(i + 1, len(sentences)):
        score = util.cos_sim(embeddings[i], embeddings[j]).item()
        if score >= threshold:
            similarity_results.append({
                "textA": sentences[i],
                "textB": sentences[j],
                "score": round(score, 4)
            })

# 写入结果
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(similarity_results, f, ensure_ascii=False, indent=2)

print(f"处理完成，输出到 {output_path}")
