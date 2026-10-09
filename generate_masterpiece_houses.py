# -*- coding: utf-8 -*-
"""
generate_masterpiece_houses.py
아기돼지 삼형제의 동화 속 아기자기하고 예쁜 집 3종 스프라이트 생성기
- 배경 화면(동화 버섯 숲)과 완벽하게 어우러지는 아기자기한 동화 일러스트 스타일
- 2x 슈퍼샘플링(1024x1360) 후 Lanczos 고품질 리샘플링(512x680)
- 투명 배경 RGBA PNG
"""

import math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

SW, SH = 1024, 1360
FW, FH = 512, 680

INK = (58, 32, 16, 255)         # 따스한 동화풍 다크브라운 윤곽선
INK_SOFT = (90, 50, 25, 200)    # 내부 보조선

def add_glow(img, cx, cy, rx, ry, col1=(254, 240, 138, 90), col2=(253, 224, 71, 140)):
    glow = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([cx - rx - 40, cy - ry - 40, cx + rx + 40, cy + ry + 40], fill=col1)
    gdraw.ellipse([cx - rx - 15, cy - ry - 15, cx + rx + 15, cy + ry + 15], fill=col2)
    glow = glow.filter(ImageFilter.GaussianBlur(32))
    img.alpha_composite(glow)

def draw_fairytale_mushroom(draw, cx, cy, cap_w, cap_h, is_blue=False):
    """배경의 버섯과 100% 일치하는 아기자기한 점박이 버섯"""
    sw = cap_w * 0.38
    sh = cap_h * 1.15
    draw.rounded_rectangle([cx - sw/2, cy - sh + cap_h*0.3, cx + sw/2, cy], radius=int(sw/2), fill=(255, 250, 240, 255), outline=INK, width=3)
    draw.ellipse([cx - sw/2, cy - 6, cx + sw/2, cy + 2], fill=(210, 195, 175, 255))
    
    c_base = (56, 189, 248, 255) if is_blue else (239, 68, 68, 255)
    c_shade = (2, 132, 199, 255) if is_blue else (185, 28, 28, 255)
    c_hi = (186, 230, 253, 255) if is_blue else (252, 165, 165, 255)
    
    cap_box = [cx - cap_w/2, cy - sh - cap_h*0.35, cx + cap_w/2, cy - sh + cap_h*0.75]
    draw.chord(cap_box, start=180, end=360, fill=c_base, outline=INK, width=4)
    draw.ellipse([cx - cap_w/2, cy - sh + cap_h*0.05, cx + cap_w/2, cy - sh + cap_h*0.4], fill=c_shade, outline=INK, width=3)
    draw.ellipse([cx - cap_w*0.3, cy - sh - cap_h*0.25, cx + cap_w*0.05, cy - sh], fill=c_hi)
    
    dots = [
        (cx - cap_w*0.25, cy - sh - cap_h*0.05, cap_w*0.13),
        (cx + cap_w*0.22, cy - sh, cap_w*0.11),
        (cx - cap_w*0.05, cy - sh - cap_h*0.18, cap_w*0.09),
        (cx + cap_w*0.05, cy - sh + cap_h*0.12, cap_w*0.08)
    ]
    for dx, dy, dr in dots:
        draw.ellipse([dx - dr, dy - dr*0.8, dx + dr, dy + dr*0.8], fill=(255, 255, 255, 255), outline=(220, 220, 220, 255), width=1)

def draw_flower_box(draw, x1, y, x2, h=32):
    """창문 아래 피어난 알록달록 동화 꽃 화분"""
    draw.rounded_rectangle([x1, y, x2, y + h], radius=6, fill=(146, 64, 14, 255), outline=INK, width=4)
    draw.line([(x1 + 4, y + 6), (x2 - 4, y + 6)], fill=(180, 83, 9, 255), width=3)
    colors = [(244, 63, 94, 255), (251, 113, 133, 255), (255, 255, 255, 255), (250, 204, 21, 255), (192, 132, 252, 255)]
    w_box = x2 - x1
    num_f = int(w_box // 22)
    for i in range(num_f):
        fx = x1 + 14 + i * 22
        fy = y - 6 + (i % 2) * 6
        draw.ellipse([fx - 10, fy + 4, fx + 10, fy + 16], fill=(34, 197, 94, 255), outline=(20, 83, 45, 255), width=2)
        col = colors[i % len(colors)]
        draw.ellipse([fx - 8, fy - 8, fx + 8, fy + 8], fill=col, outline=INK, width=2)
        draw.ellipse([fx - 3, fy - 3, fx + 3, fy + 3], fill=(253, 224, 71, 255))

def draw_stone_foundation(draw, x1, y1, x2, y2):
    """자연스러운 둥글둥글 호박돌 기초석 + 이끼"""
    draw.rounded_rectangle([x1 - 10, y1, x2 + 10, y2], radius=24, fill=(80, 70, 60, 255))
    stone_cols = [
        (168, 162, 158, 255), (140, 134, 130, 255), (120, 113, 108, 255),
        (190, 185, 180, 255), (150, 145, 140, 255)
    ]
    np.random.seed(42)
    for row in range(3):
        ry = y1 + 8 + row * 40
        num_s = 7
        sw = (x2 - x1) / num_s
        for col in range(num_s + 1):
            rx = x1 - 12 + col * sw + (row % 2) * (sw * 0.45)
            rw = sw * 1.12
            rh = 44
            scol = stone_cols[(row * 3 + col) % len(stone_cols)]
            draw.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=16, fill=scol, outline=INK, width=4)
            draw.arc([rx + 6, ry + 4, rx + rw - 6, ry + rh - 4], start=180, end=300, fill=(240, 238, 235, 210), width=4)

    moss_cols = [(101, 163, 13, 255), (77, 124, 15, 255), (132, 204, 22, 255)]
    for m in range(16):
        mx = x1 + m * 55 + (m % 3) * 8
        my = y2 - 8
        mr = 28 + (m % 3) * 8
        draw.ellipse([mx - mr, my - mr*0.55, mx + mr, my + mr*0.55], fill=moss_cols[m % len(moss_cols)])

def draw_ivy(draw, start_x, start_y, points):
    """벽면을 타고 오르는 싱그러운 동화 담쟁이덩굴"""
    curr = (start_x, start_y)
    for p in points:
        draw.line([curr, p], fill=(20, 83, 45, 255), width=4)
        # 잎사귀 2개
        for off_x, off_y in [(-8, -4), (8, 4)]:
            draw.ellipse([p[0] + off_x - 7, p[1] + off_y - 7, p[0] + off_x + 7, p[1] + off_y + 7], fill=(34, 197, 94, 255), outline=(20, 83, 45, 255), width=2)
        curr = p

def draw_hanging_lantern(draw, x, y):
    """벽에 걸린 따스한 호롱불 등불"""
    draw.line([(x, y - 25), (x + 20, y - 25), (x + 20, y - 10)], fill=(30, 41, 59, 255), width=5)
    # 랜턴 몸체
    draw.polygon([(x + 8, y - 10), (x + 32, y - 10), (x + 26, y + 25), (x + 14, y + 25)], fill=(254, 240, 138, 255), outline=INK, width=3)
    draw.line([(x + 20, y - 10), (x + 20, y + 25)], fill=INK, width=2)
    # 하부 림
    draw.rounded_rectangle([x + 10, y + 23, x + 30, y + 30], radius=3, fill=(50, 40, 35, 255))


# ==============================================================================
# [1] 짚으로 만든 집 (Straw Thatched Fairytale Cottage)
# ==============================================================================
def create_masterpiece_straw_house():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 굴뚝 & 몽실몽실 연기
    cdraw = ImageDraw.Draw(img)
    smokes = [(740, 95, 36, 210), (775, 60, 48, 170), (820, 25, 60, 130), (880, -2, 75, 80)]
    for sx, sy, sr, sa in smokes:
        cdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, sa))
    cdraw.rounded_rectangle([680, 140, 770, 360], radius=10, fill=(185, 90, 50, 255), outline=INK, width=5)
    cdraw.rounded_rectangle([665, 125, 785, 165], radius=8, fill=(140, 65, 35, 255), outline=INK, width=5)
    for cy in range(185, 350, 35):
        cdraw.line([(680, cy), (770, cy)], fill=INK, width=3)
        for cx in [710, 740]:
            cdraw.line([(cx, cy), (cx, cy + 35)], fill=INK, width=2)

    # 2. 기초 호박돌 & 이끼 & 버섯
    fdraw = ImageDraw.Draw(img)
    draw_stone_foundation(fdraw, 90, 1140, 934, 1285)
    draw_fairytale_mushroom(fdraw, 75, 1275, 58, 44, is_blue=False)
    draw_fairytale_mushroom(fdraw, 125, 1290, 40, 30, is_blue=True)
    draw_fairytale_mushroom(fdraw, 945, 1280, 56, 42, is_blue=False)
    draw_fairytale_mushroom(fdraw, 895, 1295, 38, 28, is_blue=False)

    # 3. 1층 툇마루 / 베란다 원목 데크
    deck_draw = ImageDraw.Draw(img)
    dy1, dy2 = 880, 1150
    dx1, dx2 = 110, 914
    deck_draw.rounded_rectangle([dx1 + 10, dy1 + 35, dx2 - 10, dy2], radius=14, fill=(90, 35, 10, 255), outline=INK, width=5)
    for px in [150, 330, 512, 694, 874]:
        deck_draw.rounded_rectangle([px - 18, dy1 + 30, px + 18, dy2 - 5], radius=10, fill=(146, 64, 14, 255), outline=INK, width=4)
        deck_draw.line([(px - 4, dy1 + 45), (px - 4, dy2 - 15)], fill=(180, 83, 9, 255), width=3)
    deck_draw.rounded_rectangle([dx1 - 20, dy1, dx2 + 20, dy1 + 60], radius=16, fill=(217, 119, 6, 255), outline=INK, width=6)
    deck_draw.line([(dx1 - 10, dy1 + 10), (dx2 + 10, dy1 + 10)], fill=(251, 191, 36, 240), width=6)
    for sx in range(dx1 + 10, dx2 + 10, 75):
        deck_draw.line([(sx, dy1 + 8), (sx, dy1 + 52)], fill=INK, width=3)

    # 4. 방 벽체
    wall_draw = ImageDraw.Draw(img)
    wy1, wy2 = 430, dy1 + 15
    wx1, wx2 = 160, 864
    wall_pts = [(195, wy1), (829, wy1), (wx2, wy2), (wx1, wy2)]
    wall_draw.polygon(wall_pts, fill=(254, 243, 199, 255), outline=INK)
    wall_draw.line([(195, wy1), (wx1, wy2)], fill=INK, width=6)
    wall_draw.line([(829, wy1), (wx2, wy2)], fill=INK, width=6)
    # 목재 기둥들
    wall_draw.rounded_rectangle([176, wy1, 204, wy2], radius=12, fill=(120, 53, 15, 255), outline=INK, width=4)
    wall_draw.rounded_rectangle([820, wy1, 848, wy2], radius=12, fill=(120, 53, 15, 255), outline=INK, width=4)
    wall_draw.rounded_rectangle([500, wy1, 524, wy2], radius=10, fill=(146, 64, 14, 255), outline=INK, width=4)

    # 5. 아치형 낭만 원목 문
    door_draw = ImageDraw.Draw(img)
    dor_x1, dor_x2 = 560, 800
    dor_y1, dor_y2 = 490, wy2
    door_draw.chord([dor_x1 - 10, dor_y1 - 60, dor_x2 + 10, dor_y1 + 120], start=180, end=360, fill=(90, 35, 10, 255), outline=INK, width=5)
    door_draw.rectangle([dor_x1 - 10, dor_y1 + 30, dor_x2 + 10, dor_y2], fill=(90, 35, 10, 255), outline=INK, width=5)
    door_draw.chord([dor_x1, dor_y1 - 50, dor_x2, dor_y1 + 110], start=180, end=360, fill=(180, 83, 9, 255))
    door_draw.rectangle([dor_x1, dor_y1 + 30, dor_x2, dor_y2 - 6], fill=(180, 83, 9, 255))
    for px in [620, 680, 740]:
        door_draw.line([(px, dor_y1), (px, dor_y2 - 6)], fill=(120, 53, 15, 255), width=4)
    door_draw.rounded_rectangle([dor_x1 - 5, dor_y1 + 75, dor_x1 + 65, dor_y1 + 100], radius=6, fill=(30, 41, 59, 255), outline=INK, width=2)
    door_draw.rounded_rectangle([dor_x1 - 5, dor_y1 + 250, dor_x1 + 65, dor_y1 + 275], radius=6, fill=(30, 41, 59, 255), outline=INK, width=2)
    door_draw.ellipse([735, dor_y1 + 165, 775, dor_y1 + 205], fill=(251, 191, 36, 255), outline=INK, width=4)
    door_draw.ellipse([747, dor_y1 + 177, 763, dor_y1 + 193], fill=(180, 83, 9, 255))
    # 문 옆 호롱불
    draw_hanging_lantern(door_draw, 520, 620)
    add_glow(img, 540, 630, 30, 30)

    # 6. 창문 + 촛불 조명 + 꽃 화분
    win_cx, win_cy = 340, 640
    add_glow(img, win_cx, win_cy, 60, 60)
    win_draw = ImageDraw.Draw(img)
    wx1, wy1, wx2, wy2 = 230, 520, 450, 760
    win_draw.rounded_rectangle([wx1 - 12, wy1 - 12, wx2 + 12, wy2 + 12], radius=32, fill=(120, 53, 15, 255), outline=INK, width=5)
    win_draw.rounded_rectangle([wx1, wy1, wx2, wy2], radius=24, fill=(254, 240, 138, 255))
    win_draw.line([(win_cx, wy1), (win_cx, wy2)], fill=(120, 53, 15, 255), width=8)
    win_draw.line([(wx1, win_cy), (wx2, win_cy)], fill=(120, 53, 15, 255), width=8)
    draw_flower_box(win_draw, wx1 - 16, wy2 + 8, wx2 + 16, h=36)
    # 담쟁이덩굴
    draw_ivy(win_draw, wx1 - 14, wy2 + 10, [(185, 760), (180, 710), (195, 650)])

    # 7. 황금 볏짚 지붕 (Fluffy Storybook Thatch Roof)
    roof_draw = ImageDraw.Draw(img)
    roof_draw.ellipse([100, 460, 924, 550], fill=(0, 0, 0, 70))
    roof_pts = []
    for t in np.linspace(0, 1, 25):
        x = (1-t)**2 * 512 + 2*(1-t)*t * 160 + t**2 * 50
        y = (1-t)**2 * 150 + 2*(1-t)*t * 220 + t**2 * 475
        roof_pts.append((x, y))
    num_scallops = 14
    for i in range(num_scallops):
        t0 = i / num_scallops
        t1 = (i + 1) / num_scallops
        x0 = 50 + t0 * 924
        x1 = 50 + t1 * 924
        mid_x = (x0 + x1) / 2
        roof_pts.append((mid_x, 505 + math.sin(i * 0.45) * 8))
        roof_pts.append((x1, 475))
    for t in np.linspace(1, 0, 25):
        x = (1-t)**2 * 512 + 2*(1-t)*t * 864 + t**2 * 974
        y = (1-t)**2 * 150 + 2*(1-t)*t * 220 + t**2 * 475
        roof_pts.append((x, y))

    roof_draw.polygon(roof_pts, fill=(245, 158, 11, 255), outline=INK)
    roof_draw.chord([150, 120, 874, 440], start=180, end=360, fill=(251, 191, 36, 255), outline=INK_SOFT, width=3)
    roof_draw.chord([250, 130, 774, 340], start=180, end=360, fill=(253, 224, 71, 255))

    for s in range(24):
        ang_ratio = s / 23.0
        bx = 100 + ang_ratio * 824
        tx = 350 + ang_ratio * 324
        x_min, x_max = min(bx - 40, tx + 40), max(bx - 40, tx + 40)
        roof_draw.arc([x_min, 220, x_max, 480], start=210, end=270, fill=(254, 240, 138, 240), width=4)
        x_min2, x_max2 = min(bx - 20, tx + 20), max(bx - 20, tx + 20)
        roof_draw.arc([x_min2, 250, x_max2, 495], start=200, end=260, fill=(180, 83, 9, 180), width=3)

    for i in range(num_scallops):
        t0 = i / num_scallops
        t1 = (i + 1) / num_scallops
        x0 = 50 + t0 * 924
        x1 = 50 + t1 * 924
        mid_x = (x0 + x1) / 2
        roof_draw.chord([x0, 440, x1, 515], start=0, end=180, fill=(251, 191, 36, 255), outline=INK, width=4)
        roof_draw.line([(mid_x - 6, 475), (mid_x - 3, 508)], fill=(254, 243, 199, 255), width=3)
        roof_draw.line([(mid_x + 6, 475), (mid_x + 8, 506)], fill=(180, 83, 9, 220), width=3)

    # 지붕 꼭대기 마루
    roof_draw.rounded_rectangle([280, 100, 744, 185], radius=35, fill=(217, 119, 6, 255), outline=INK, width=6)
    roof_draw.line([(310, 125), (714, 125)], fill=(254, 240, 138, 255), width=6)
    for bx in range(320, 710, 42):
        roof_draw.line([(bx, 95), (bx + 16, 190)], fill=(120, 53, 15, 255), width=5)
        roof_draw.line([(bx + 16, 95), (bx, 190)], fill=(120, 53, 15, 255), width=5)

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


# ==============================================================================
# [2] 나무로 만든 집 (Log Cabin / Fairytale Woodland Chalet)
# ==============================================================================
def create_masterpiece_wood_house():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 굴뚝 & 연기 (왼쪽 위)
    cdraw = ImageDraw.Draw(img)
    smokes = [(210, 95, 34, 210), (195, 60, 46, 170), (170, 25, 58, 130), (140, -2, 70, 80)]
    for sx, sy, sr, sa in smokes:
        cdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, sa))
    cdraw.rounded_rectangle([180, 130, 270, 360], radius=10, fill=(140, 130, 120, 255), outline=INK, width=5)
    cdraw.rounded_rectangle([165, 115, 285, 155], radius=8, fill=(100, 90, 85, 255), outline=INK, width=5)
    for cy in range(175, 350, 35):
        cdraw.line([(180, cy), (270, cy)], fill=INK, width=3)

    # 2. 기초 호박돌 & 이끼 & 버섯
    fdraw = ImageDraw.Draw(img)
    draw_stone_foundation(fdraw, 80, 1140, 944, 1285)
    draw_fairytale_mushroom(fdraw, 65, 1275, 58, 44, is_blue=False)
    draw_fairytale_mushroom(fdraw, 115, 1290, 40, 30, is_blue=True)
    draw_fairytale_mushroom(fdraw, 955, 1280, 56, 42, is_blue=False)
    draw_fairytale_mushroom(fdraw, 905, 1295, 38, 28, is_blue=True)

    # 3. 1층 통나무 벽체 (Y: 740 ~ 1150)
    wdraw = ImageDraw.Draw(img)
    num_logs = 8
    lh = 52
    for l in range(num_logs):
        ly = 740 + l * lh
        # 통나무 둥근 몸체
        wdraw.rounded_rectangle([90, ly, 934, ly + lh + 4], radius=24, fill=(161, 98, 7, 255), outline=INK, width=4)
        wdraw.line([(120, ly + 10), (904, ly + 10)], fill=(202, 138, 4, 220), width=4)
        # 통나무 양끝 마구리 나이테
        for ex in [112, 912]:
            wdraw.ellipse([ex - 22, ly + 4, ex + 22, ly + lh], fill=(217, 119, 6, 255), outline=INK, width=3)
            wdraw.ellipse([ex - 12, ly + 12, ex + 12, ly + lh - 8], fill=(180, 83, 9, 255))
            wdraw.ellipse([ex - 4, ly + 20, ex + 4, ly + lh - 16], fill=(120, 53, 15, 255))

    # 4. 1층 현관문 (오른쪽) & 랜턴
    dor_x1, dor_x2 = 560, 810
    dor_y1, dor_y2 = 780, 1150
    wdraw.rounded_rectangle([dor_x1 - 10, dor_y1 - 10, dor_x2 + 10, dor_y2], radius=16, fill=(120, 53, 15, 255), outline=INK, width=5)
    wdraw.rounded_rectangle([dor_x1, dor_y1, dor_x2, dor_y2 - 6], radius=12, fill=(180, 83, 9, 255))
    for px in [620, 685, 750]:
        wdraw.line([(px, dor_y1 + 10), (px, dor_y2 - 6)], fill=INK, width=4)
    # 문 경첩 & 황금 손잡이
    wdraw.rounded_rectangle([dor_x1 - 5, dor_y1 + 80, dor_x1 + 65, dor_y1 + 105], radius=6, fill=(30, 41, 59, 255), outline=INK, width=2)
    wdraw.rounded_rectangle([dor_x1 - 5, dor_y1 + 250, dor_x1 + 65, dor_y1 + 275], radius=6, fill=(30, 41, 59, 255), outline=INK, width=2)
    wdraw.ellipse([745, dor_y1 + 175, 785, dor_y1 + 215], fill=(251, 191, 36, 255), outline=INK, width=4)
    draw_hanging_lantern(wdraw, 830, 910)
    add_glow(img, 850, 920, 30, 30)

    # 5. 1층 따스한 창문 (왼쪽) + 화분
    win_cx, win_cy = 330, 920
    add_glow(img, win_cx, win_cy, 60, 60)
    wx1, wy1, wx2, wy2 = 220, 820, 440, 1020
    wdraw.rounded_rectangle([wx1 - 12, wy1 - 12, wx2 + 12, wy2 + 12], radius=24, fill=(90, 35, 10, 255), outline=INK, width=5)
    wdraw.rounded_rectangle([wx1, wy1, wx2, wy2], radius=16, fill=(254, 240, 138, 255))
    wdraw.line([(win_cx, wy1), (win_cx, wy2)], fill=(90, 35, 10, 255), width=8)
    wdraw.line([(wx1, win_cy), (wx2, win_cy)], fill=(90, 35, 10, 255), width=8)
    draw_flower_box(wdraw, wx1 - 16, wy2 + 6, wx2 + 16, h=34)

    # 6. 2층 통나무 벽체 & 발코니 테라스 (Y: 420 ~ 750)
    # 2층 통나무
    for l2 in range(7):
        ly2 = 420 + l2 * 48
        wdraw.rounded_rectangle([130, ly2, 894, ly2 + 48], radius=20, fill=(180, 83, 9, 255), outline=INK, width=4)
        wdraw.line([(160, ly2 + 8), (864, ly2 + 8)], fill=(217, 119, 6, 200), width=3)

    # 2층 중앙 창문 + 덧문(셔터)
    w2_cx, w2_cy = 512, 540
    add_glow(img, w2_cx, w2_cy, 55, 55)
    w2x1, w2y1, w2x2, w2y2 = 420, 450, 604, 630
    wdraw.rounded_rectangle([w2x1 - 10, w2y1 - 10, w2x2 + 10, w2y2 + 10], radius=18, fill=(90, 35, 10, 255), outline=INK, width=4)
    wdraw.rounded_rectangle([w2x1, w2y1, w2x2, w2y2], radius=12, fill=(254, 240, 138, 255))
    wdraw.line([(w2_cx, w2y1), (w2_cx, w2y2)], fill=(90, 35, 10, 255), width=6)
    wdraw.line([(w2x1, w2_cy), (w2x2, w2_cy)], fill=(90, 35, 10, 255), width=6)
    # 열린 원목 덧문(셔터)
    for sx1, sx2 in [(350, 410), (614, 674)]:
        wdraw.rounded_rectangle([sx1, w2y1 - 6, sx2, w2y2 + 6], radius=8, fill=(146, 64, 14, 255), outline=INK, width=3)
        # 하트 모양 창문 컷아웃
        sh_cx = (sx1 + sx2) / 2
        wdraw.ellipse([sh_cx - 8, w2_cy - 12, sh_cx, w2_cy - 4], fill=(254, 240, 138, 255))
        wdraw.ellipse([sh_cx, w2_cy - 12, sh_cx + 8, w2_cy - 4], fill=(254, 240, 138, 255))
        wdraw.polygon([(sh_cx - 8, w2_cy - 8), (sh_cx + 8, w2_cy - 8), (sh_cx, w2_cy + 2)], fill=(254, 240, 138, 255))

    # 2층 발코니 난간 (아름다운 X자 크로스 원목 테라스 - 둘째 돼지가 서는 곳)
    balc_y = 690
    wdraw.rounded_rectangle([110, balc_y, 914, balc_y + 55], radius=12, fill=(120, 53, 15, 255), outline=INK, width=5)
    for bx in range(140, 880, 58):
        wdraw.line([(bx, balc_y + 8), (bx + 36, balc_y + 46)], fill=(217, 119, 6, 255), width=5)
        wdraw.line([(bx + 36, balc_y + 8), (bx, balc_y + 46)], fill=(217, 119, 6, 255), width=5)
        wdraw.line([(bx, balc_y + 8), (bx + 36, balc_y + 46)], fill=INK, width=2)
        wdraw.line([(bx + 36, balc_y + 8), (bx, balc_y + 46)], fill=INK, width=2)
    wdraw.rounded_rectangle([95, balc_y - 6, 929, balc_y + 12], radius=8, fill=(180, 83, 9, 255), outline=INK, width=4)

    # 7. 동화 삼각 원목 너와지붕 (Gabled Shingle Roof)
    # 지붕 처마 그림자
    wdraw.ellipse([100, 400, 924, 480], fill=(0, 0, 0, 70))
    roof_pts = [
        (512, 140),   # 지붕 꼭대기
        (964, 430),   # 우측 처마 끝
        (924, 470),
        (512, 200),
        (100, 470),
        (60, 430)     # 좌측 처마 끝
    ]
    wdraw.polygon(roof_pts, fill=(120, 53, 15, 255), outline=INK)
    # 너와 기와 타일들 (층층이 포개진 원목 타일)
    for layer in range(6):
        ry = 180 + layer * 46
        rx_spread = 80 + layer * 140
        num_tiles = int((rx_spread * 2) // 48)
        for t in range(num_tiles + 1):
            tx = (512 - rx_spread) + t * 48
            t_col = (146, 64, 14, 255) if (layer + t) % 2 == 0 else (180, 83, 9, 255)
            wdraw.rounded_rectangle([tx, ry, tx + 44, ry + 36], radius=8, fill=t_col, outline=INK, width=3)
            wdraw.line([(tx + 6, ry + 6), (tx + 38, ry + 6)], fill=(217, 119, 6, 200), width=2)

    # 8. 지붕 꼭대기 첫째 돼지 망루 관측대 & 붉은 깃발
    wdraw.rounded_rectangle([412, 130, 612, 190], radius=12, fill=(90, 35, 10, 255), outline=INK, width=4)
    # 깃대
    wdraw.line([(512, 30), (512, 130)], fill=(30, 41, 59, 255), width=6)
    wdraw.ellipse([504, 20, 520, 36], fill=(251, 191, 36, 255), outline=INK, width=3)
    # 펄럭이는 붉은 삼각 깃발
    wdraw.polygon([(512, 35), (600, 65), (512, 95)], fill=(239, 68, 68, 255), outline=INK)
    wdraw.polygon([(512, 45), (580, 65), (512, 85)], fill=(252, 165, 165, 255))

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


# ==============================================================================
# [3] 성같은 벽돌집 (Castle-like Brick Fortress)
# ==============================================================================
def create_masterpiece_brick_house():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 붉은 벽돌 굴뚝 & 뭉게뭉게 연기 (오른쪽 위)
    cdraw = ImageDraw.Draw(img)
    smokes = [(770, 95, 36, 210), (805, 60, 48, 170), (850, 25, 60, 130), (910, -2, 75, 80)]
    for sx, sy, sr, sa in smokes:
        cdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, sa))
    cdraw.rounded_rectangle([710, 140, 830, 370], radius=10, fill=(185, 28, 28, 255), outline=INK, width=5)
    for cy in range(175, 360, 28):
        cdraw.line([(710, cy), (830, cy)], fill=(241, 245, 249, 200), width=3)
    cdraw.rounded_rectangle([695, 125, 845, 165], radius=8, fill=(127, 29, 29, 255), outline=INK, width=5)

    # 2. 견고한 화강암 기단부
    fdraw = ImageDraw.Draw(img)
    draw_stone_foundation(fdraw, 80, 1140, 944, 1285)
    draw_fairytale_mushroom(fdraw, 65, 1275, 58, 44, is_blue=False)
    draw_fairytale_mushroom(fdraw, 115, 1290, 40, 30, is_blue=True)
    draw_fairytale_mushroom(fdraw, 955, 1280, 56, 42, is_blue=False)
    draw_fairytale_mushroom(fdraw, 905, 1295, 38, 28, is_blue=False)

    # 3. 1층 붉은 벽돌 성벽 (Y: 720 ~ 1150)
    bdraw = ImageDraw.Draw(img)
    bdraw.rounded_rectangle([100, 720, 924, 1150], radius=16, fill=(220, 38, 38, 255), outline=INK, width=5)
    # 벽돌 줄눈 & 텍스처
    brick_cols = [(239, 68, 68, 255), (220, 38, 38, 255), (185, 28, 28, 255), (248, 113, 113, 255)]
    for r, by in enumerate(range(728, 1140, 32)):
        bdraw.line([(100, by), (924, by)], fill=(241, 245, 249, 180), width=3)
        offset = (r % 2) * 32
        for bx in range(110 + offset, 910, 64):
            bdraw.line([(bx, by), (bx, by + 32)], fill=(241, 245, 249, 180), width=3)
            # 하이라이트 점
            bdraw.point((bx + 16, by + 8), fill=(254, 202, 202, 255))

    # 코너 화강암 귓돌 (Quoin Stones)
    for qy in range(720, 1140, 52):
        bdraw.rounded_rectangle([92, qy, 145, qy + 44], radius=6, fill=(203, 213, 225, 255), outline=INK, width=3)
        bdraw.rounded_rectangle([879, qy, 932, qy + 44], radius=6, fill=(203, 213, 225, 255), outline=INK, width=3)

    # 4. 성문: 철갑 아치 성문 (오른쪽)
    gate_x1, gate_x2 = 550, 810
    gate_y1, gate_y2 = 780, 1150
    bdraw.chord([gate_x1 - 10, gate_y1 - 70, gate_x2 + 10, gate_y2 - 200], start=180, end=360, fill=(30, 41, 59, 255), outline=INK, width=6)
    bdraw.rectangle([gate_x1 - 10, gate_y1 + 40, gate_x2 + 10, gate_y2], fill=(30, 41, 59, 255), outline=INK, width=6)
    bdraw.chord([gate_x1, gate_y1 - 60, gate_x2, gate_y2 - 210], start=180, end=360, fill=(51, 65, 85, 255))
    bdraw.rectangle([gate_x1, gate_y1 + 40, gate_x2, gate_y2 - 6], fill=(51, 65, 85, 255))
    # 철제 리벳 밴드 3줄
    for gy in [870, 970, 1070]:
        bdraw.rectangle([gate_x1, gy, gate_x2, gy + 22], fill=(15, 23, 42, 255), outline=INK, width=2)
        for rx in range(gate_x1 + 25, gate_x2, 45):
            bdraw.ellipse([rx - 6, gy + 5, rx + 6, gy + 17], fill=(226, 232, 240, 255))
    # 황금 사자머리 문고리
    bdraw.ellipse([660, 985, 700, 1025], fill=(251, 191, 36, 255), outline=INK, width=4)

    # 5. 1층 아치형 요새 창문 + 촛불 조명
    win_cx, win_cy = 330, 940
    add_glow(img, win_cx, win_cy, 60, 60)
    wx1, wy1, wx2, wy2 = 230, 820, 430, 1040
    bdraw.chord([wx1, wy1 - 50, wx2, wy1 + 150], start=180, end=360, fill=(71, 85, 105, 255), outline=INK, width=5)
    bdraw.rectangle([wx1, wy1 + 50, wx2, wy2], fill=(71, 85, 105, 255), outline=INK, width=5)
    bdraw.chord([wx1 + 12, wy1 - 38, wx2 - 12, wy1 + 138], start=180, end=360, fill=(254, 240, 138, 255))
    bdraw.rectangle([wx1 + 12, wy1 + 50, wx2 - 12, wy2 - 12], fill=(254, 240, 138, 255))
    # 쇠창살
    for fx in [280, 330, 380]:
        bdraw.line([(fx, wy1 + 10), (fx, wy2 - 12)], fill=(30, 41, 59, 255), width=5)
    bdraw.line([(wx1 + 12, win_cy), (wx2 - 12, win_cy)], fill=(30, 41, 59, 255), width=5)

    # 6. 2층 석조 테라스 & 성채 벽면 (Y: 360 ~ 730)
    bdraw.rounded_rectangle([140, 360, 884, 730], radius=12, fill=(185, 28, 28, 255), outline=INK, width=5)
    for r, by in enumerate(range(370, 720, 32)):
        bdraw.line([(140, by), (884, by)], fill=(241, 245, 249, 160), width=3)
        offset = (r % 2) * 32
        for bx in range(150 + offset, 870, 64):
            bdraw.line([(bx, by), (bx, by + 32)], fill=(241, 245, 249, 160), width=3)

    # 2층 중앙 아치 창문
    w2_cx, w2_cy = 512, 520
    add_glow(img, w2_cx, w2_cy, 60, 60)
    bdraw.chord([420, 410, 604, 590], start=180, end=360, fill=(254, 240, 138, 255), outline=INK, width=5)
    bdraw.rectangle([420, 500, 604, 620], fill=(254, 240, 138, 255), outline=INK, width=5)
    bdraw.line([(w2_cx, 430), (w2_cx, 620)], fill=(71, 85, 105, 255), width=6)
    bdraw.line([(420, w2_cy), (604, w2_cy)], fill=(71, 85, 105, 255), width=6)

    # 2층 테라스 발판 (석조 코벨 받침대)
    bdraw.rounded_rectangle([120, 690, 904, 740], radius=10, fill=(100, 116, 139, 255), outline=INK, width=5)
    for c_idx in range(7):
        cx = 160 + c_idx * 115
        bdraw.polygon([(cx, 740), (cx + 50, 740), (cx + 25, 785)], fill=(71, 85, 105, 255), outline=INK)

    # 7. 성벽 요새 치성 (Crenelations) & 좌우 코너 첨탑 터렛
    # 치성 성벽 기단
    bdraw.rounded_rectangle([100, 300, 924, 350], radius=10, fill=(100, 116, 139, 255), outline=INK, width=5)
    # 성벽 톱니 5개
    num_teeth = 5
    tw = 85
    gap = 52
    st_x = 150
    for t in range(num_teeth):
        tx = st_x + t * (tw + gap)
        bdraw.rounded_rectangle([tx, 200, tx + tw, 310], radius=8, fill=(185, 28, 28, 255), outline=INK, width=5)
        bdraw.rounded_rectangle([tx - 6, 190, tx + tw + 6, 210], radius=6, fill=(148, 163, 184, 255), outline=INK, width=3)

    # 좌우 코너 성채 원형 망루 탑 (Turrets)
    for t_cx in [120, 904]:
        bdraw.rounded_rectangle([t_cx - 45, 180, t_cx + 45, 330], radius=10, fill=(185, 28, 28, 255), outline=INK, width=4)
        # 고깔 원뿔 지붕
        bdraw.polygon([(t_cx, 80), (t_cx - 55, 190), (t_cx + 55, 190)], fill=(51, 65, 85, 255), outline=INK)
        bdraw.ellipse([t_cx - 8, 70, t_cx + 8, 86], fill=(251, 191, 36, 255))

    # 8. 성채 꼭대기 황금 왕실 깃발
    bdraw.line([(512, 50), (512, 195)], fill=(30, 41, 59, 255), width=6)
    bdraw.ellipse([502, 40, 522, 60], fill=(251, 191, 36, 255), outline=INK, width=3)
    bdraw.polygon([(512, 60), (630, 95), (512, 130)], fill=(245, 158, 11, 255), outline=INK)
    bdraw.polygon([(512, 72), (600, 95), (512, 118)], fill=(252, 211, 77, 255))

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


if __name__ == '__main__':
    print("Generating masterpiece fairytale houses...")
    
    h1 = create_masterpiece_straw_house()
    h1.save('assets/house_straw.png', 'PNG')
    h1.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/masterpiece_house_straw.png', 'PNG')
    print("Straw house done!")

    h2 = create_masterpiece_wood_house()
    h2.save('assets/house_wood.png', 'PNG')
    h2.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/masterpiece_house_wood.png', 'PNG')
    print("Wood house done!")

    h3 = create_masterpiece_brick_house()
    h3.save('assets/house_brick.png', 'PNG')
    h3.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/masterpiece_house_brick.png', 'PNG')
    print("Brick house done!")

    print("All 3 masterpiece fairytale houses generated successfully!")
