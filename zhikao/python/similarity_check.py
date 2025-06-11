# Usage: python similarity_check.py --input checkinput.json --output checkoutput.json
# Description: 计算文本相似度，输入输出文件格式为 JSON
# 模型打包：模型保存后，在 python 目录下运行：pyinstaller --onefile --add-data "model;model" similarity_check.py
# 把生成的 disk 中的 exe 文件拖到 python 目录中即可在程序中调用 (具体见_utils.js的 compareQuestionsAI 方法)
import torch
import sys
import json
import os
import argparse
import secrets
from sentence_transformers import SentenceTransformer, util

# 加密配置 - 与Node.js保持一致
ENCRYPTION_KEY = b'zhikao-system-2024-secure-key-32b'

def get_key():
    """获取标准化的密钥"""
    if len(ENCRYPTION_KEY) < 32:
        return ENCRYPTION_KEY.ljust(32, b'\x00')
    elif len(ENCRYPTION_KEY) > 32:
        return ENCRYPTION_KEY[:32]
    return ENCRYPTION_KEY

def decrypt_data(encrypted_data):
    """解密数据 - 与Node.js保持一致"""
    try:
        parts = encrypted_data.split(':')
        if len(parts) != 2:
            return None
            
        iv = bytes.fromhex(parts[0])
        encrypted_bytes = bytes.fromhex(parts[1])
        
        key_bytes = get_key()[:16]
        decrypted = bytearray()
        
        for i, byte in enumerate(encrypted_bytes):
            decrypted.append(byte ^ key_bytes[i % len(key_bytes)] ^ iv[i % len(iv)])
        
        return decrypted.decode('utf-8')
    except Exception as e:
        print(f"解密失败: {e}")
        return None

def encrypt_data(data_str):
    """加密数据 - 与Node.js保持一致"""
    try:
        iv = secrets.token_bytes(16)
        key_bytes = get_key()[:16]
        text_bytes = data_str.encode('utf-8')
        encrypted = bytearray()
        
        for i, byte in enumerate(text_bytes):
            encrypted.append(byte ^ key_bytes[i % len(key_bytes)] ^ iv[i % len(iv)])
        
        return iv.hex() + ':' + bytes(encrypted).hex()
    except Exception as e:
        print(f"加密失败: {e}")
        return None

def is_encrypted_format(content):
    """检查内容是否是加密格式"""
    return (':' in content and 
            not content.strip().startswith('{') and 
            not content.strip().startswith('['))

def read_encrypted_file(file_path):
    """读取并解密文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        
        if is_encrypted_format(content):
            decrypted_content = decrypt_data(content)
            if decrypted_content:
                return json.loads(decrypted_content)
            else:
                raise Exception("解密失败")
        else:
            # 向后兼容：如果不是加密格式，直接解析JSON
            return json.loads(content)
    except Exception as e:
        print(f"读取加密文件失败: {e}")
        raise

def write_encrypted_file(file_path, data):
    """加密并写入文件"""
    try:
        json_str = json.dumps(data, ensure_ascii=False, indent=2)
        encrypted_content = encrypt_data(json_str)
        
        if encrypted_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(encrypted_content)
        else:
            raise Exception("加密失败")
    except Exception as e:
        print(f"写入加密文件失败: {e}")
        raise

print("Torch 版本:", torch.__version__)
print("CUDA 是否可用:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("GPU 名称:", torch.cuda.get_device_name(0))
else:
    print("当前无法使用 CUDA，请检查是否为 GPU 版本 Torch，并正确安装驱动 & CUDA")

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
model = SentenceTransformer(model_path)

# 读取加密的题目内容
try:
    data = read_encrypted_file(input_path)
    sentences = data.get("sentences", [])
    print(f"成功读取 {len(sentences)} 个句子")
except Exception as e:
    print(f"❌ 读取输入文件失败：{e}")
    sys.exit(1)

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

# 写入加密的输出文件
try:
    write_encrypted_file(output_path, similarity_results)
    print(f"相似度计算完成，找到 {len(similarity_results)} 对相似文本")
    print(f"加密输出结果保存在：{output_path}")
except Exception as e:
    print(f"❌ 写入输出文件失败：{e}")
    sys.exit(1)