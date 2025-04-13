from sentence_transformers import SentenceTransformer

model = SentenceTransformer("shibing624/text2vec-base-chinese")
# model.save('./model')  # 保存为本地路径

# # 将模型转换为 FP16（减少50%体积）
# model.half()

# 保存量化后的模型
model.save('./model')
