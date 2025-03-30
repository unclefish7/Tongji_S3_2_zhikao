# Usage: python similarity_check.py --input checkinput.json --output checkoutput.json
# Description: 计算文本相似度，输入输出文件格式为 JSON
# 模型打包：模型保存后，在 python 目录下运行：pyinstaller --onefile --add-data "model;model" similarity_check.py
# 把生成的 disk 中的 exe 文件拖到 python 目录中即可在程序中调用 (具体见_utils.js的 compareQuestionsAI 方法)
import torch
import sys
import json
import os
import argparse
from sentence_transformers import SentenceTransformer, util

# print("Python 可执行路径:", sys.executable)
print("Torch 版本:", torch.__version__)
# print("Torch 是否内置 CUDA:", torch.version.cuda)
# print("CUDA 是否可用:", torch.cuda.is_available())
# if torch.cuda.is_available():
#     print("GPU 名称:", torch.cuda.get_device_name(0))
# else:
#     print("当前无法使用 CUDA，请检查是否为 GPU 版本 Torch，并正确安装驱动 & CUDA")



def get_resource_path(relative_path):
    """
    获取资源路径：
    - 打包后，从临时解包目录 `_MEIPASS` 查找；
    - 普通运行时，从脚本文件所在目录查找；
    """
    try:
        base_path = sys._MEIPASS
    except AttributeError:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)

# 命令行参数
parser = argparse.ArgumentParser(description="Similarity Checker")
parser.add_argument('--input', required=True, help='输入文件路径，例如 checkinput.json')
parser.add_argument('--output', required=True, help='输出文件路径，例如 checkoutput.json')
args = parser.parse_args()

# 读取输入文件
input_path = os.path.abspath(args.input)
output_path = os.path.abspath(args.output)

if not os.path.exists(input_path):
    print(f"❌ 输入文件不存在：{input_path}")
    sys.exit(1)

# 加载本地模型
model_path = get_resource_path("model")
# model_path = get_resource_path("model_small")  # 小模型

model = SentenceTransformer(model_path)

# 读取题目内容
with open(input_path, 'r', encoding='utf-8') as f:
    data = json.load(f)
sentences = data.get("sentences", [])

# 编码为向量
embeddings = model.encode(sentences, convert_to_tensor=True)

# 相似度矩阵计算
similarity_results = []
threshold = 0.65  # 相似度阈值

for i in range(len(sentences)):
    for j in range(i + 1, len(sentences)):
        score = util.cos_sim(embeddings[i], embeddings[j]).item()
        if score >= threshold:
            similarity_results.append({
                "textA": sentences[i],
                "textB": sentences[j],
                "score": round(score, 4)
            })

# 写入输出文件
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(similarity_results, f, ensure_ascii=False, indent=2)

print(f"相似度计算完成，输出结果保存在：{output_path}")
