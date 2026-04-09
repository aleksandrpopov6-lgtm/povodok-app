#!/usr/bin/env python3
"""
ПоводОК — счёт на оплату.
Чистый белый бланк, российский стандарт.
Только лапка-лого вверху слева, без заливок.
"""
import sys, json, math
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Table, TableStyle, Paragraph
from reportlab.lib.styles import ParagraphStyle

CORAL  = HexColor("#F0485C")
PINK   = HexColor("#EE5FA2")
TEXT   = HexColor("#1A1A1F")
MUTED  = HexColor("#888888")
BORDER = HexColor("#AAAAAA")

FONT_REG  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
pdfmetrics.registerFont(TTFont("Reg",  FONT_REG))
pdfmetrics.registerFont(TTFont("Bold", FONT_BOLD))

W, H = A4
ML = 20*mm
MR = 20*mm
CW = W - ML - MR


def draw_paw_logo(c, cx, cy, r):
    """
    Лапка кота в двух слоях:
    - розовый фоновый кружок
    - коралловая лапка поверх
    """
    # Фоновый кружок
    c.setFillColor(PINK)
    c.setFillAlpha(0.15)
    c.circle(cx, cy, r * 1.45, fill=1, stroke=0)
    c.setFillAlpha(1.0)

    # Три пальчиковые подушечки
    pads = [
        (-r * 0.38, r * 0.52, r * 0.22, r * 0.28),
        ( 0,         r * 0.66, r * 0.20, r * 0.26),
        ( r * 0.38, r * 0.52, r * 0.22, r * 0.28),
    ]
    c.setFillColor(CORAL)
    for dx, dy, rx, ry in pads:
        c.saveState()
        c.translate(cx + dx, cy + dy)
        c.scale(1.0, ry / rx)
        c.circle(0, 0, rx, fill=1, stroke=0)
        c.restoreState()

    # Большая центральная подушечка
    c.saveState()
    c.translate(cx, cy - r * 0.08)
    c.scale(1.0, 1.15)
    c.circle(0, 0, r * 0.52, fill=1, stroke=0)
    c.restoreState()


def amount_words(n):
    ones = ["", "один", "два", "три", "четыре", "пять",
            "шесть", "семь", "восемь", "девять"]
    tens_ = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят",
             "шестьдесят", "семьдесят", "восемьдесят", "девяносто"]
    hundreds_ = ["", "сто", "двести", "триста", "четыреста", "пятьсот",
                 "шестьсот", "семьсот", "восемьсот", "девятьсот"]
    teens = ["десять", "одиннадцать", "двенадцать", "тринадцать",
             "четырнадцать", "пятнадцать", "шестнадцать",
             "семнадцать", "восемнадцать", "девятнадцать"]
    if n <= 0:
        return "Ноль рублей 00 копеек"
    h = (n // 100) % 10
    t = (n // 10) % 10
    u = n % 10
    parts = []
    if h: parts.append(hundreds_[h])
    if t == 1:
        parts.append(teens[u])
    else:
        if t > 1: parts.append(tens_[t])
        if u: parts.append(ones[u])
    result = " ".join(parts).strip() or "ноль"
    if 11 <= n % 100 <= 19 or u in [5, 6, 7, 8, 9, 0]:
        rub = "рублей"
    elif u == 1:
        rub = "рубль"
    else:
        rub = "рубля"
    return result.capitalize() + " " + rub + " 00 копеек."


def generate(data: dict, out_path: str):
    buyer_name  = data.get("buyerName",  "")
    buyer_inn   = data.get("buyerInn",   "")
    buyer_email = data.get("buyerEmail", "")
    amount      = int(data.get("amount", 0))

    import random, datetime
    inv_num = data.get("invoiceNumber", random.randint(1000, 9999))
    today   = datetime.date.today()
    due     = today + datetime.timedelta(days=5)
    fmt     = lambda d: d.strftime("%d.%m.%Y")

    c = canvas.Canvas(out_path, pagesize=A4)
    c.setTitle(f"Счёт № {inv_num} от {fmt(today)} — ПоводОК")
    c.setAuthor("Perplexity Computer")

    # Белый фон
    c.setFillColor(white)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    y = H - 15*mm  # Начинаем сверху

    # ════════════════════════════════════════════════════════════
    # 1. ЛОГОТИП + НАЗВАНИЕ
    # ════════════════════════════════════════════════════════════
    paw_r  = 6*mm
    paw_cx = ML + paw_r + 1*mm
    paw_cy = y - paw_r
    draw_paw_logo(c, paw_cx, paw_cy, paw_r)

    # «ПоводОК» рядом
    tx = paw_cx + paw_r + 3*mm
    ty = paw_cy + 2*mm
    c.setFont("Bold", 14)
    c.setFillColor(TEXT)
    c.drawString(tx, ty, "Повод")
    pw = c.stringWidth("Повод", "Bold", 14)
    c.setFillColor(CORAL)
    c.drawString(tx + pw, ty, "ОК")
    c.setFont("Reg", 7.5)
    c.setFillColor(MUTED)
    c.drawString(tx, ty - 5*mm, "Платформа помощи бездомным животным")

    y -= paw_r * 2 + 6*mm

    # ════════════════════════════════════════════════════════════
    # 2. БАНКОВСКИЙ БЛОК (рамка)
    # ════════════════════════════════════════════════════════════
    bk_h = 18*mm
    bk_y = y - bk_h
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.7)
    c.rect(ML, bk_y, CW, bk_h, stroke=1, fill=0)

    # Горизонтальная линия посередине
    mid = bk_y + bk_h / 2
    c.line(ML, mid, ML + CW, mid)

    # Вертикальная линия
    vx = ML + 95*mm
    c.line(vx, bk_y, vx, bk_y + bk_h)

    # Левая часть
    c.setFont("Reg", 7); c.setFillColor(MUTED)
    c.drawString(ML + 2*mm, bk_y + bk_h - 4*mm, "Получатель")
    c.setFont("Bold", 8); c.setFillColor(TEXT)
    c.drawString(ML + 2*mm, bk_y + bk_h / 2 + 1*mm,
                 "ООО «ПоводОК»  ИНН 1234567890  КПП 123401001")
    c.setFont("Reg", 7.5); c.setFillColor(TEXT)
    c.drawString(ML + 2*mm, bk_y + 2.5*mm,
                 "Р/С 40702810000000000001")

    # Правая часть
    c.setFont("Reg", 7); c.setFillColor(MUTED)
    c.drawString(vx + 2*mm, bk_y + bk_h - 4*mm, "Банк получателя")
    c.setFont("Bold", 8); c.setFillColor(TEXT)
    c.drawString(vx + 2*mm, bk_y + bk_h / 2 + 1*mm, "АО «Тинькофф Банк»")
    c.setFont("Reg", 7.5); c.setFillColor(TEXT)
    c.drawString(vx + 2*mm, bk_y + 2.5*mm,
                 "БИК 044525974  К/С 30101810145250000974")

    y = bk_y - 8*mm

    # ════════════════════════════════════════════════════════════
    # 3. ЗАГОЛОВОК СЧЁТА
    # ════════════════════════════════════════════════════════════
    c.setFont("Bold", 13)
    c.setFillColor(TEXT)
    c.drawString(ML, y, f"Счёт на оплату № {inv_num} от {fmt(today)}")

    y -= 4*mm
    c.setStrokeColor(TEXT); c.setLineWidth(2)
    c.line(ML, y, W - MR, y)
    c.setLineWidth(0.5)
    c.line(ML, y - 1.5*mm, W - MR, y - 1.5*mm)
    c.setLineWidth(0.7)

    y -= 8*mm

    # ════════════════════════════════════════════════════════════
    # 4. ПОСТАВЩИК / ПЛАТЕЛЬЩИК
    # ════════════════════════════════════════════════════════════
    label_w = 27*mm

    def info_row(label, text, yy):
        c.setFont("Reg", 8.5); c.setFillColor(MUTED)
        c.drawString(ML, yy, label)
        c.setFont("Bold", 8.5); c.setFillColor(TEXT)
        c.drawString(ML + label_w, yy, text)

    info_row("Поставщик:",
             "ООО «ПоводОК», ИНН 1234567890, КПП 123401001, г. Москва",
             y)
    y -= 7*mm
    info_row("Плательщик:",
             f"{buyer_name}, ИНН {buyer_inn}",
             y)
    y -= 5.5*mm
    c.setFont("Reg", 8); c.setFillColor(MUTED)
    c.drawString(ML + label_w, y, f"Email: {buyer_email}")

    y -= 4*mm
    c.setStrokeColor(TEXT); c.setLineWidth(2)
    c.line(ML, y, W - MR, y)
    c.setLineWidth(0.5)
    c.line(ML, y - 1.5*mm, W - MR, y - 1.5*mm)
    c.setLineWidth(0.7)

    y -= 8*mm

    # ════════════════════════════════════════════════════════════
    # 5. ТАБЛИЦА
    # ════════════════════════════════════════════════════════════
    s_hdr = ParagraphStyle("h", fontName="Bold", fontSize=7.5,
                            textColor=TEXT, alignment=1, leading=10)
    s_cel = ParagraphStyle("c", fontName="Reg",  fontSize=8.5,
                            textColor=TEXT, alignment=0, leading=12,
                            spaceAfter=2, spaceBefore=2)
    s_num = ParagraphStyle("n", fontName="Reg",  fontSize=8.5,
                            textColor=TEXT, alignment=1, leading=12)

    desc = (
        "Подписка на платформу «ПоводОК» — приоритетное размещение "
        "в каталоге ловцов, ветеринарных клиник и передержек. "
        "Расширенный профиль организации. Поддержка волонтёрской "
        "деятельности по защите бездомных животных. Период: 1 месяц."
    )

    col_w = [9*mm, 97*mm, 14*mm, 12*mm, 23*mm, 22*mm]

    rows = [
        [Paragraph("№", s_hdr),
         Paragraph("Наименование товаров, работ, услуг", s_hdr),
         Paragraph("Кол-во", s_hdr),
         Paragraph("Ед.изм.", s_hdr),
         Paragraph("Цена, руб.", s_hdr),
         Paragraph("Сумма, руб.", s_hdr)],
        [Paragraph("1", s_num),
         Paragraph(desc, s_cel),
         Paragraph("1", s_num),
         Paragraph("мес.", s_num),
         Paragraph(f"{amount:,}".replace(",", "\u00a0"), s_num),
         Paragraph(f"{amount:,}".replace(",", "\u00a0"), s_num)],
    ]

    tbl = Table(rows, colWidths=col_w)
    tbl.setStyle(TableStyle([
        ("FONTNAME",      (0,0), (-1,0),  "Bold"),
        ("FONTSIZE",      (0,0), (-1,0),  7.5),
        ("FONTNAME",      (0,1), (-1,1),  "Reg"),
        ("FONTSIZE",      (0,1), (-1,1),  8.5),
        ("BACKGROUND",    (0,0), (-1,0),  HexColor("#F0F0F0")),
        ("TEXTCOLOR",     (0,0), (-1,0),  TEXT),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("ALIGN",         (0,0), (-1,0),  "CENTER"),
        ("ALIGN",         (2,1), (-1,1),  "CENTER"),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 3),
        ("RIGHTPADDING",  (0,0), (-1,-1), 3),
        ("BOX",           (0,0), (-1,-1), 0.7, BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, BORDER),
    ]))

    tbl.wrapOn(c, CW, 200*mm)
    tbl_h = tbl._height
    tbl.drawOn(c, ML, y - tbl_h)
    y -= tbl_h

    # ════════════════════════════════════════════════════════════
    # 6. ИТОГО
    # ════════════════════════════════════════════════════════════
    y -= 5*mm
    right_x = W - MR

    def tot(label, value, yy, bold=False, coral=False):
        fn = "Bold" if bold else "Reg"
        fs = 9.5 if bold else 8.5
        c.setFont(fn, fs)
        c.setFillColor(TEXT)
        lw = c.stringWidth(label, fn, fs)
        c.drawString(right_x - 62*mm, yy, label)
        c.setFillColor(CORAL if coral else TEXT)
        c.setFont("Bold", fs)
        c.drawRightString(right_x, yy, value)

    v = f"{amount:,} руб.".replace(",", "\u00a0")
    tot("Итого:",         v, y)
    y -= 6*mm
    tot("В т.ч. НДС:",    "Без НДС", y)
    y -= 7*mm
    tot("Всего к оплате:", v, y, bold=True, coral=True)

    # Рамка вокруг итого
    c.setStrokeColor(BORDER); c.setLineWidth(0.6)
    c.rect(right_x - 65*mm, y - 2*mm, 65*mm, 22*mm, stroke=1, fill=0)

    # ════════════════════════════════════════════════════════════
    # 7. СУММА ПРОПИСЬЮ
    # ════════════════════════════════════════════════════════════
    y -= 10*mm
    c.setFont("Reg", 8.5); c.setFillColor(MUTED)
    c.drawString(ML, y, "Всего наименований 1, на сумму")
    c.setFont("Bold", 8.5); c.setFillColor(TEXT)
    c.drawString(ML + 53*mm, y, v)

    y -= 5.5*mm
    c.setFont("Bold", 9); c.setFillColor(TEXT)
    c.drawString(ML, y, amount_words(amount))

    y -= 5*mm
    c.setStrokeColor(TEXT); c.setLineWidth(2)
    c.line(ML, y, W - MR, y)
    c.setLineWidth(0.5)
    c.line(ML, y - 1.5*mm, W - MR, y - 1.5*mm)
    c.setLineWidth(0.7)

    # ════════════════════════════════════════════════════════════
    # 8. НАЗНАЧЕНИЕ ПЛАТЕЖА
    # ════════════════════════════════════════════════════════════
    y -= 7*mm
    c.setFont("Bold", 8.5); c.setFillColor(TEXT)
    c.drawString(ML, y, "Назначение платежа:")
    y -= 5.5*mm
    c.setFont("Reg", 8.5); c.setFillColor(TEXT)
    purpose = (
        "Благотворительное пожертвование на поддержку бездомных животных "
        "и развитие волонтёрской платформы «ПоводОК». Подписка на сервис. Без НДС."
    )
    words = purpose.split(); line = ""; out_lines = []
    for w in words:
        test = (line + " " + w).strip()
        if c.stringWidth(test, "Reg", 8.5) < CW:
            line = test
        else:
            out_lines.append(line); line = w
    if line: out_lines.append(line)
    for ln in out_lines:
        c.drawString(ML, y, ln); y -= 5*mm

    y -= 2*mm
    c.setFont("Bold", 8.5)
    c.drawString(ML, y, f"Счёт действителен до: {fmt(due)}")

    # ════════════════════════════════════════════════════════════
    # 9. ПОДПИСИ
    # ════════════════════════════════════════════════════════════
    y -= 15*mm

    for col_x, role, fio in [
        (ML,         "Руководитель:", "Воробьёва В.И."),
        (ML + 90*mm, "Бухгалтер:",    "Воробьёва В.И."),
    ]:
        c.setFont("Bold", 8.5); c.setFillColor(TEXT)
        c.drawString(col_x, y, role)
        c.setStrokeColor(BORDER); c.setLineWidth(0.8)
        c.line(col_x, y - 8*mm, col_x + 65*mm, y - 8*mm)
        c.setFont("Reg", 8.5); c.setFillColor(TEXT)
        c.drawString(col_x, y - 12*mm, fio)

    c.setFont("Bold", 8.5); c.setFillColor(TEXT)
    c.drawString(ML + 170*mm, y, "М. П.")

    # ════════════════════════════════════════════════════════════
    # 10. НИЖНЯЯ ТОНКАЯ ПОЛОСКА И КОНТАКТЫ
    # ════════════════════════════════════════════════════════════
    foot_y = 10*mm
    c.setStrokeColor(CORAL); c.setLineWidth(1.5)
    c.line(ML, foot_y + 5*mm, W - MR, foot_y + 5*mm)
    c.setLineWidth(0.7)

    c.setFont("Reg", 7); c.setFillColor(MUTED)
    c.drawCentredString(
        W / 2, foot_y,
        "ООО «ПоводОК»  |  ИНН 1234567890  |  info@povodok.ru  |  Платформа помощи бездомным животным"
    )

    c.save()
    return out_path


if __name__ == "__main__":
    data = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {
        "buyerName":  'ООО "Ветклиника Здоровый Питомец"',
        "buyerInn":   "7701234567",
        "buyerEmail": "buh@vet.ru",
        "amount":     500,
    }
    out = sys.argv[2] if len(sys.argv) > 2 else "/tmp/invoice_povodok.pdf"
    generate(data, out)
    print(f"OK:{out}")
