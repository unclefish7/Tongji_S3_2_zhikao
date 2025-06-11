import os
import json
import secrets

# 加密配置 - 与Node.js保持一致
ENCRYPTION_KEY = b'zhikao-system-2024-secure-key-32b'  # 32字节密钥

def get_key():
    """获取标准化的密钥"""
    if len(ENCRYPTION_KEY) < 32:
        # 如果密钥长度不足32字节，用0填充
        return ENCRYPTION_KEY.ljust(32, b'\x00')
    elif len(ENCRYPTION_KEY) > 32:
        # 如果密钥长度超过32字节，截取前32字节
        return ENCRYPTION_KEY[:32]
    return ENCRYPTION_KEY

def encrypt_data(data_str):
    """加密数据 - 简单的XOR加密，与Node.js保持一致"""
    try:
        # 生成随机IV（16字节）
        iv = secrets.token_bytes(16)
        
        # 使用前16字节作为密钥
        key_bytes = get_key()[:16]
        text_bytes = data_str.encode('utf-8')
        encrypted = bytearray()
        
        for i, byte in enumerate(text_bytes):
            encrypted.append(byte ^ key_bytes[i % len(key_bytes)] ^ iv[i % len(iv)])
        
        # 返回 IV:加密数据 的格式
        return iv.hex() + ':' + bytes(encrypted).hex()
    except Exception as e:
        print(f"加密失败: {e}")
        return None

def decrypt_data(encrypted_data):
    """解密数据 - 用于验证"""
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

def is_encrypted_format(content):
    """检查内容是否是加密格式"""
    return (':' in content and 
            not content.strip().startswith('{') and 
            not content.strip().startswith('['))

def process_json_file(file_path):
    """处理单个JSON文件"""
    try:
        print(f"处理文件: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            
        # 检查文件是否已经是加密格式
        if is_encrypted_format(content):
            print(f"文件 {file_path} 已经是加密格式，跳过")
            return True
            
        # 尝试解析为JSON
        try:
            json_data = json.loads(content)
        except json.JSONDecodeError:
            print(f"文件 {file_path} 不是有效的JSON格式，跳过")
            return False
            
        # 将JSON转换为字符串并加密
        json_str = json.dumps(json_data, ensure_ascii=False, indent=2)
        encrypted_data = encrypt_data(json_str)
        
        if encrypted_data is None:
            print(f"文件 {file_path} 加密失败")
            return False
            
        # 备份原文件
        backup_path = file_path + '.backup'
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"原文件已备份到: {backup_path}")
        
        # 写入加密数据
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(encrypted_data)
        
        # 验证加密结果
        decrypted = decrypt_data(encrypted_data)
        if decrypted:
            try:
                json.loads(decrypted)
                print(f"文件 {file_path} 加密完成并验证成功")
                return True
            except json.JSONDecodeError:
                print(f"文件 {file_path} 加密验证失败")
                return False
        else:
            print(f"文件 {file_path} 解密验证失败")
            return False
        
    except Exception as e:
        print(f"处理文件 {file_path} 时出错: {e}")
        return False

def find_json_files(directory):
    """递归查找所有JSON文件"""
    json_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.json') and not file.endswith('.backup'):
                json_files.append(os.path.join(root, file))
    return json_files

def main():
    """主函数"""
    print("=== 智考系统数据加密转换脚本 ===")
    
    # 获取脚本所在目录的上级目录（data目录）
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '..')
    if not os.path.exists(data_dir):
        print(f"数据目录 {data_dir} 不存在，请检查路径")
        return
    
    print(f"数据目录: {data_dir}")
    
    # 需要加密的目录列表
    target_dirs = [
        os.path.join(data_dir, 'user'),
        os.path.join(data_dir, 'exam'),
        os.path.join(data_dir, 'paper'),
        os.path.join(data_dir, 'curriculum'),
        os.path.join(data_dir, 'paperDTO'),
        os.path.join(data_dir, 'export'),      # 导出目录也需要加密
        os.path.join(data_dir, 'transformer'), # transformer目录
    ]
    
    total_files = 0
    success_files = 0
    
    for target_dir in target_dirs:
        if not os.path.exists(target_dir):
            print(f"目录不存在，跳过: {target_dir}")
            continue
            
        print(f"\n处理目录: {target_dir}")
        json_files = find_json_files(target_dir)
        
        if not json_files:
            print(f"目录 {target_dir} 中没有找到JSON文件")
            continue
            
        for json_file in json_files:
            total_files += 1
            if process_json_file(json_file):
                success_files += 1
                
    print("\n=== 转换完成 ===")
    print(f"总文件数: {total_files}")
    print(f"成功转换: {success_files}")
    print(f"失败文件: {total_files - success_files}")
    
    if success_files > 0:
        print("\n重要提示:")
        print("1. 原文件已备份为 .backup 文件")
        print("2. 请确保Node.js应用程序已更新为加密版本")
        print("3. 如果遇到问题，可以使用备份文件恢复")
        print("4. 导出的试卷文件现在也使用加密格式")
        print("5. AI检查的输入输出文件也已加密")

if __name__ == "__main__":
    main()
