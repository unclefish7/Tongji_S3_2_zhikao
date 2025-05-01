import json
import sys
import os
from docx import Document
from docx.shared import Inches
import matplotlib.pyplot as plt
import numpy as np
import matplotlib
from bs4 import BeautifulSoup
from matplotlib import rcParams
import re

# 设置支持中文的字体
rcParams['font.sans-serif'] = ['SimHei']  # 设置为黑体
rcParams['axes.unicode_minus'] = False    # 解决负号显示问题

# 用于处理 LaTeX 的图像生成
def generate_latex_image(latex_content, image_path):
    try:
        # 使用 matplotlib 来渲染 LaTeX
        fig, ax = plt.subplots()
        ax.text(0.5, 0.5, f'${latex_content}$', fontsize=20, ha='center', va='center')
        ax.axis('off')
        image_file_path = os.path.join(image_path, 'latex_image.png')
        plt.savefig(image_file_path, dpi=300, bbox_inches='tight')
        plt.close(fig)
        return image_file_path
    except Exception as e:
        print(f"Error generating LaTeX image: {e}")
        return None

def insert_local_image(doc, img_path):
    # 如果图片是本地文件路径，直接插入
    with open(img_path, 'rb') as f:
        doc.add_paragraph().add_run('图：').add_picture(f, width=Inches(3.0))  # 你可以调整宽度

# 处理表格插入
def insert_table_from_html(doc, table_html):
    # 使用 BeautifulSoup 解析表格 HTML
    soup = BeautifulSoup(table_html, "html.parser")
    
    # 获取表头，处理表头数据
    headers = soup.find_all('th')
    rows = soup.find_all('tr')
    
    # 获取表格的列数
    num_cols = len(headers) if headers else len(rows[0].find_all('td'))
    
    # 创建表格，设置初始行数为 0，列数为表头的列数
    table = doc.add_table(rows=0, cols=num_cols)

    # 如果有表头，添加表头
    if headers:
        header_row = table.add_row().cells
        for i, header in enumerate(headers):
            header_row[i].text = header.get_text().strip()
    
    # 遍历数据行，跳过表头行
    for row in rows:
        # 如果是表头行，跳过
        if row.find_all('th'):
            continue
        
        cols = row.find_all('td')
        row_cells = table.add_row().cells
        
        for i, col in enumerate(cols):
            if i < len(row_cells):  # 确保索引不超出范围
                row_cells[i].text = col.get_text().strip()
            else:
                # 如果列数不足，填充空单元格
                row_cells.append(row_cells[-1].clone())
                row_cells[i].text = col.get_text().strip()
# 从 richTextContent 中提取 LaTeX 公式
def extract_latex_from_html(content):
    # 使用正则表达式提取 LaTeX 公式
    match = re.search(r'data-value="([^"]+)"', content)
    if match:
        return match.group(1)
    return ""

# 解析题目并生成 docx 文档
def generate_exam_paper(questions,output_file):
    doc = Document()

    # 添加试卷信息
    doc.add_paragraph('计算机科学与技术学院-研究生招生考试')
    doc.add_paragraph('准考证考号：_______________  姓名：_______________')
    doc.add_paragraph('总分数：_______________')
    doc.add_paragraph('考试类型： 平时测试____  期中测试____  期末测试____  缺考____')
    doc.add_paragraph('--------------------------------------------')

    # 题目分类
    choice_questions = []
    judgment_questions = []
    fill_in_questions = []
    subjective_questions = []

    for question in questions:
        if question['type'] == '选择题':
            choice_questions.append(question)
        elif question['type'] == '判断题':
            judgment_questions.append(question)
        elif question['type'] == '填空题':
            fill_in_questions.append(question)
        elif question['type'] == '主观题':
            subjective_questions.append(question)

    # 将题目插入文档
    sections = [
        ('选择题', choice_questions),
        ('判断题', judgment_questions),
        ('填空题', fill_in_questions),
        ('主观题', subjective_questions)
    ]
    
    for section_title, questions in sections:
        if len(questions) > 0:
            doc.add_paragraph(section_title)
            for question in questions:
                # 处理题目内容和 LaTeX
                if 'richTextContent' in question:
                    latex_content = question['richTextContent']
                    cleaned_latex = extract_latex_from_html(latex_content)  # 提取 LaTeX 内容
                    # 提取 LaTeX 公式和其他文本
                    other_text = re.sub(r'<[^>]+>', '', latex_content)  # 去除所有 HTML 标签，保留纯文本
                    other_text = other_text.replace('\n', '')  # 去除换行符
                    if other_text.strip():  # 仅当文本不为空时插入
                        doc.add_paragraph(other_text)  # 插入纯文本部分
                    
                    if 'table' in latex_content:
                        table_html = re.search(r'<table[^>]*>.*?</table>', latex_content, re.DOTALL)
                        if table_html:
                            insert_table_from_html(doc, table_html.group(0))
                            
                    # 渲染 LaTeX 公式并插入图像
                    if cleaned_latex:  # 如果提取到 LaTeX 公式
                        current_directory = os.getcwd()
                        latex_image_path = os.path.join(current_directory, 'images')
                        if not os.path.exists(latex_image_path):
                            os.makedirs(latex_image_path)  # 确保图片文件夹存在
                        image_path = generate_latex_image(cleaned_latex, latex_image_path)
                        if image_path:
                            doc.add_paragraph().add_run('图：').add_picture(image_path, width=Inches(2))
                    if 'img' in latex_content:
                        img_url = re.search(r'src="([^"]+)"', latex_content)
                        if img_url:
                            img_url = img_url.group(1)
                            if img_url.startswith("file://"):  # 处理本地图片路径
                                img_path = img_url.replace("file://", ".")
                                insert_local_image(doc, img_path)
                    

                    
                    
                # 对于主观题，插入空行
                if question['type'] == '主观题':
                    doc.add_paragraph('\n' * 4)  # 插入4行空白

    # 保存为 docx 文件
    
    doc.save(output_file)
    return output_file

if __name__ == "__main__":
   
    json_file_path=sys.argv[1]
    docx_path=sys.argv[2]
    
    with open(json_file_path,'r',encoding='utf-8') as f:
        data=json.load(f)
    
    # 生成考试试卷并保存
    exam_paper_path = generate_exam_paper(data,docx_path)
    print(f"Exam paper generated at {docx_path}")
