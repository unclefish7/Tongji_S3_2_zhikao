import json
import sys
import os
import shutil
import tempfile
from docx import Document
from docx.shared import Inches, Pt
from docx.oxml.ns import qn
import matplotlib.pyplot as plt
from bs4 import BeautifulSoup, NavigableString
from bs4.element import Tag
from matplotlib import rcParams
from collections import defaultdict
import base64
import subprocess

# 设置中文字体支持
rcParams['font.sans-serif'] = ['SimHei']
rcParams['axes.unicode_minus'] = False

DEFAULT_FONT_NAME = '宋体'
ENGLISH_FONT_NAME = 'Times New Roman'
DEFAULT_FORMULA_HEIGHT_PT = 14

def generate_latex_image(latex_content, image_path):
    try:
        if not latex_content.strip():
            return None
        latex_content = latex_content.replace('\\pix', r'\pi x')
        fig, ax = plt.subplots()
        ax.axis('off')
        text = ax.text(0.5, 0.5, f'${latex_content}$', fontsize=DEFAULT_FORMULA_HEIGHT_PT,
                       ha='center', va='center')
        fig.canvas.draw()
        renderer = fig.canvas.get_renderer()
        bbox = text.get_window_extent(renderer=renderer)
        width_inch = bbox.width / fig.dpi
        height_inch = bbox.height / fig.dpi
        fig.set_size_inches(max(width_inch, 0.5), max(height_inch, 0.3))

        os.makedirs(image_path, exist_ok=True)
        image_file_path = os.path.join(image_path, f'latex_{abs(hash(latex_content))}.png')
        plt.savefig(image_file_path, dpi=300, bbox_inches='tight', pad_inches=0.05)
        plt.close(fig)
        return image_file_path
    except Exception as e:
        print(f"❌ 生成公式图片失败: {e}")
        return None

def set_font(run, is_title=False):
    run.font.name = DEFAULT_FONT_NAME
    run._element.rPr.rFonts.set(qn('w:eastAsia'), DEFAULT_FONT_NAME)
    run._element.rPr.rFonts.set(qn('w:ascii'), ENGLISH_FONT_NAME)
    run._element.rPr.rFonts.set(qn('w:hAnsi'), ENGLISH_FONT_NAME)
    run.font.size = Pt(16 if is_title else 12)
    run.bold = is_title

def insert_table(doc, html):
    soup = BeautifulSoup(html, 'html.parser')
    table_tag = soup.find('table')
    if not table_tag:
        return
    rows = table_tag.find_all('tr')
    table = doc.add_table(rows=0, cols=len(rows[0].find_all(['td', 'th'])))
    for row in rows:
        cells = row.find_all(['td', 'th'])
        row_cells = table.add_row().cells
        for i, cell in enumerate(cells):
            row_cells[i].text = cell.get_text(strip=True)
            para = row_cells[i].paragraphs[0]
            if para.runs:
                set_font(para.runs[0])

def process_rich_text(doc, content, image_dir):
    soup = BeautifulSoup(content, 'html.parser')
    for block in soup.find_all(['p', 'table', 'br']):
        if block.name == 'p':
            p = doc.add_paragraph()
            for child in block.children:
                if isinstance(child, NavigableString):
                    if child.strip():
                        run = p.add_run(str(child))
                        set_font(run)
                elif isinstance(child, Tag):
                    if child.name == 'span' and child.get('data-w-e-type') == 'formula':
                        latex_code = child.get('data-value', '')
                        img_path = generate_latex_image(latex_code, image_dir)
                        if img_path:
                            p.add_run().add_picture(img_path, height=Inches(0.2))
                    elif child.name == 'span':
                        run = p.add_run(child.get_text())
                        set_font(run)
        elif block.name == 'table':
            doc.add_paragraph()
            insert_table(doc, str(block))
            doc.add_paragraph()
        elif block.name == 'br':
            doc.add_paragraph()

def generate_docx(questions, output_path):
    doc = Document()
    type_order = ['选择题', '判断题', '填空题', '主观题']
    type_map = defaultdict(list)
    for q in questions:
        type_map[q['type']].append(q)

    image_dir = tempfile.mkdtemp(prefix='latex_images_')

    try:
        for qtype in type_order:
            qlist = type_map[qtype]
            if not qlist:
                continue
            total = sum(q.get('score', 0) for q in qlist)
            avg = total / len(qlist) if qlist else 0
            title = f"{qtype}（共{len(qlist)}题，合计{total}分，每题{avg:.1f}分）"
            run = doc.add_paragraph().add_run(title)
            set_font(run, is_title=True)

            for q in qlist:
                process_rich_text(doc, q.get('richTextContent', ''), image_dir)
                if qtype == '主观题':
                    for _ in range(3):
                        doc.add_paragraph()

        doc.save(output_path)
        print(f"✅ Word 试卷已生成：{output_path}")
    finally:
        shutil.rmtree(image_dir, ignore_errors=True)

def generate_docx_to_pdf_base64(questions: list, soffice_path: str) -> str:
    """
    生成 Word 文档并转换为 base64 编码的 PDF 字节串，用于前端内嵌预览。
    - questions: 题目列表
    - soffice_path: LibreOffice 可执行路径（soffice.exe）
    - 返回: base64 编码字符串，可用于 src="data:application/pdf;base64,..."
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        docx_path = os.path.join(tmpdir, "temp.docx")
        pdf_path = os.path.join(tmpdir, "temp.pdf")

        # ✅ 生成 Word 文档
        generate_docx(questions, docx_path)

        # ✅ 使用 LibreOffice 转换成 PDF
        result = subprocess.run([
            soffice_path,
            "--headless", "--convert-to", "pdf",
            "--outdir", tmpdir,
            docx_path
        ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            print(f"❌ LibreOffice 转换失败: {result.stderr.decode()}")
            sys.exit(1)

        # ✅ 读取 PDF 内容并转 base64
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        return base64.b64encode(pdf_bytes).decode('utf-8')
    
def get_soffice_path():
    if getattr(sys, 'frozen', False):  # PyInstaller 打包后运行
        base_dir = os.path.dirname(sys.executable)
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))

    # ➕ 回到项目根目录，然后拼接 LibreOfficePortable 路径
    root_dir = os.path.abspath(os.path.join(base_dir, "..", ".."))
    return os.path.join(root_dir, "LibreOfficePortable", "App", "libreoffice", "program", "soffice.exe")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("用法：")
        print("  👉 生成 Word：python export_exam.py questions.json output.docx")
        print("  👉 生成预览：python export_exam.py questions.json preview [base64_output.txt]")
        sys.exit(1)

    input_json = sys.argv[1]
    mode_or_output = sys.argv[2]

    with open(input_json, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    if mode_or_output == 'preview':
        # ✔️ 进入预览模式
        base64_output_path = sys.argv[3] if len(sys.argv) >= 4 else None
        soffice_path = get_soffice_path()
        if not os.path.exists(soffice_path):
            print(f"❌ LibreOffice 可执行文件未找到: {soffice_path}")
            sys.exit(1)

        base64_pdf = generate_docx_to_pdf_base64(questions, soffice_path)

        if base64_output_path:
            with open(base64_output_path, "w", encoding="utf-8") as f:
                f.write(base64_pdf)
            print(f"✅ PDF 预览 base64 已写入: {base64_output_path}")
        else:
            print("data:application/pdf;base64," + base64_pdf)
    else:
        # ✔️ 正常导出 Word
        output_docx = mode_or_output
        generate_docx(questions, output_docx)



