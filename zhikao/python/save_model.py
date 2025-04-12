from sentence_transformers import SentenceTransformer

model = SentenceTransformer("shibing624/text2vec-base-chinese")
model.save('./model')  # 保存为本地路径