import json
import sys
import os
from docx import Document
from docx.shared import Inches
import matplotlib.pyplot as plt
import numpy as np
import matplotlib
from bs4 import BeautifulSoup, NavigableString
from matplotlib import rcParams
import re

# 设置支持中文的字体
rcParams['font.sans-serif'] = ['SimHei']  # 设置为黑体
rcParams['axes.unicode_minus'] = False    # 解决负号显示问题

# 用于处理 LaTeX 的图像生成
def generate_latex_image(latex_content, image_path):
    try:
        # 使用 matplotlib 来渲染 LaTeX
        latex_content = latex_content.replace('\\pix', '\\pi x')
        latex_content = latex_content.replace('\\pix', r'\pi x')
        fig, ax = plt.subplots()
        ax.axis('off')
        text = ax.text(0.5, 0.5, f'${latex_content}$', fontsize=20, ha='center', va='center')
        fig.canvas.draw()
        bbox = text.get_window_extent(renderer=fig.canvas.get_renderer())
        # 转换像素到英寸，DPI=300
        width_inch = bbox.width / fig.dpi
        height_inch = bbox.height / fig.dpi
        fig.set_size_inches(width_inch, height_inch)
        image_file_path = os.path.join(image_path, 'latex_image.png')
        plt.savefig(image_file_path, dpi=300, bbox_inches='tight', pad_inches=0.05)
        plt.close(fig)

        return image_file_path
    except Exception as e:
        print(f"Error generating LaTeX image: {e}")
        return None

def insert_local_image(doc, img_path):
    # 如果图片是本地文件路径，直接插入
    with open(img_path, 'rb') as f:
        doc.add_paragraph().add_picture(f)  

# 处理表格插入
def insert_table_from_html(doc, table_html):
    soup = BeautifulSoup(table_html, "html.parser")
    table_tag = soup.find('table')
    if not table_tag:
        print("No table found in HTML.")
        return
    rows = table_tag.find_all('tr')
    if not rows:
        print("No rows found in table.")
        return
    first_row_cells = rows[0].find_all(['th', 'td'])
    num_cols = len(first_row_cells)
    table = doc.add_table(rows=0, cols=num_cols)
    table.autofit = True
    for row in rows:
        cells = row.find_all(['th', 'td'])
        row_cells = table.add_row().cells
        for i in range(min(len(cells), num_cols)):
            row_cells[i].text = cells[i].get_text(strip=True)

# 新增：按顺序处理 richTextContent 中的内容
def process_rich_text_content(doc, content):
    soup = BeautifulSoup(content, 'html.parser')
    current_directory = os.getcwd()
    latex_image_path = os.path.join(current_directory, 'images')
    os.makedirs(latex_image_path, exist_ok=True)

    for elem in soup.children:
        if isinstance(elem, NavigableString):
            continue  # 跳过纯文本

        # 段落处理
        if elem.name == 'p':
            if elem.find('span', attrs={"data-w-e-type": "formula"}):
                span = elem.find('span', attrs={"data-w-e-type": "formula"})
                latex_code = span.get('data-value', '')
                if latex_code:
                    image_path = generate_latex_image(latex_code, latex_image_path)
                    if image_path:
                        doc.add_picture(image_path)
            elif elem.find('img'):
                img_tag = elem.find('img')
                img_url = img_tag.get('src')
                if img_url and img_url.startswith("file://"):
                    img_path = img_url.replace("file://", ".")
                    insert_local_image(doc, img_path)
            else:
                text = elem.get_text().strip()
                if text:
                    doc.add_paragraph(text)

        # 表格处理
        elif elem.name == 'table':
            insert_table_from_html(doc, str(elem))
        

def generate_exam_paper(questions, output_file):
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

    # 插入各类题目
    sections = [
        ('选择题', choice_questions),
        ('判断题', judgment_questions),
        ('填空题', fill_in_questions),
        ('主观题', subjective_questions)
    ]

    for section_title, questions in sections:
        if questions:
            doc.add_paragraph(section_title)
            for idx, question in enumerate(questions, 1):
                
                if 'richTextContent' in question:
                    process_rich_text_content(doc, question['richTextContent'])
                if question['type'] == '主观题':
                    doc.add_paragraph('\n' * 4)  # 插入空白行用于作答

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
