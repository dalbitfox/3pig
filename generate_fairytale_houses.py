# -*- coding: utf-8 -*-
"""
generate_fairytale_houses.py
동화 속 아기자기하고 예쁜 아기돼지 삼형제의 집 스프라이트 생성기
"""

import math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

W, H = 512, 680

def get_empty_canvas():
    return Image.new('RGBA', (W, H), (0, 0, 0, 0))

def draw_fairytale_mushroom(draw, x, y, cap_w=24, cap_h=18, is_blue=False):
    """배경의 버섯과 똑같이 어울리는 아기자기한 점박이 버섯"""
    stem_w = cap_w * 0.35
    stem_h = cap_h * 1.1
    stem_box = [x - stem_w/2, y - stem_h + cap_h*0.3, x + stem_w/2, y]
    draw.rounded_rectangle(stem_box, radius=int(stem_w/2), fill=(245, 238, 220, 255), outline=(180, 160, 140, 255), width=2)
    
    cap_col = (56, 189, 248, 255) if is_blue else (239, 68, 68, 255)
    cap_dark = (2, 132, 199, 255) if is_blue else (185, 28, 28, 255)
    cap_box = [x - cap_w/2, y - stem_h - cap_h*0.4, x + cap_w/2, y - stem_h + cap_h*0.7]
    draw.chord(cap_box, start=180, end=360, fill=cap_col, outline=cap_dark, width=2)
    
    # 흰 점박이
    dot_r = max(2, int(cap_w * 0.1))
    draw.ellipse([x - cap_w*0.25 - dot_r, y - stem_h + cap_h*0.05 - dot_r, x - cap_w*0.25 + dot_r, y - stem_h + cap_h*0.05 + dot_r], fill=(255, 255, 255, 240))
    draw.ellipse([x + cap_w*0.2 - dot_r*0.8, y - stem_h + cap_h*0.1 - dot_r*0.8, x + cap_w*0.2 + dot_r*0.8, y - stem_h + cap_h*0.1 + dot_r*0.8], fill=(255, 255, 255, 240))
    draw.ellipse([x - dot_r*0.7, y - stem_h - cap_h*0.15 - dot_r*0.7, x + dot_r*0.7, y - stem_h - cap_h*0.15 + dot_r*0.7], fill=(255, 255, 255, 240))

def draw_window_glow(img, cx, cy, rx, ry):
    """창문에서 은은하게 퍼져나오는 동화 속 따스한 촛불 조명"""
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([cx - rx - 20, cy - ry - 20, cx + rx + 20, cy + ry + 20], fill=(254, 240, 138, 85))
    gdraw.ellipse([cx - rx - 10, cy - ry - 10, cx + rx + 10, cy + ry + 10], fill=(253, 224, 71, 130))
    glow = glow.filter(ImageFilter.GaussianBlur(14))
    img.alpha_composite(glow)

def draw_flower_box(draw, x1, y, x2, h=18):
    """창문 아래 피어난 알록달록 동화 꽃 화분"""
    draw.rounded_rectangle([x1, y, x2, y + h], radius=4, fill=(146, 64, 14, 255), outline=(113, 63, 18, 255), width=2)
    colors = [(244, 63, 94, 255), (251, 113, 133, 255), (255, 255, 255, 255), (250, 204, 21, 255)]
    w_box = x2 - x1
    for i in range(int(w_box // 11)):
        fx = x1 + 6 + i * 11
        fy = y - 4 + (i % 2) * 3
        draw.ellipse([fx - 5, fy + 2, fx + 5, fy + 8], fill=(34, 197, 94, 255))
        draw.ellipse([fx - 4, fy - 4, fx + 4, fy + 4], fill=colors[i % len(colors)])
        draw.ellipse([fx - 1.5, fy - 1.5, fx + 1.5, fy + 1.5], fill=(253, 224, 71, 255))

def draw_stone_foundation(draw, x1, y1, x2, y2):
    """자연스러운 동화풍 둥근 호박돌/강돌 기초석 + 이끼 (바닥과 완벽히 융합)"""
    draw.rounded_rectangle([x1, y1, x2, y2], radius=16, fill=(100, 95, 90, 255), outline=(60, 55, 50, 255), width=3)
    stone_cols = [(168, 162, 158, 255), (140, 134, 130, 255), (120, 113, 108, 255), (180, 175, 170, 255)]
    for row in range(3):
        ry = y1 + 6 + row * 22
        for col in range(6):
            rx = x1 + 8 + col * ((x2 - x1 - 16) / 5.5) + (row % 2) * 14
            rw = 26 + (col % 3) * 6
            rh = 17 + (row % 2) * 3
            c = stone_cols[(row * 3 + col) % len(stone_cols)]
            draw.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=8, fill=c, outline=(68, 64, 60, 255), width=2)
            draw.arc([rx + 3, ry + 2, rx + rw - 3, ry + rh - 2], start=180, end=300, fill=(231, 229, 228, 200), width=2)

    moss_cols = [(101, 163, 13, 240), (77, 124, 15, 240), (132, 204, 22, 240)]
    for m in range(8):
        mx = x1 + 10 + m * ((x2 - x1 - 20) / 7)
        my = y2 - 4
        draw.ellipse([mx - 14, my - 8, mx + 14, my + 6], fill=moss_cols[m % len(moss_cols)])


# ==============================================================================
# 1. 아기자기한 동화풍 황금 짚단 초가집 (Straw Thatched Fairytale Cottage)
# ==============================================================================
def generate_straw_house():
    img = get_empty_canvas()
    draw = ImageDraw.Draw(img)

    # 1. 굴뚝
    chim_box = [340, 80, 385, 180]
    draw.rounded_rectangle(chim_box, radius=8, fill=(168, 162, 158, 255), outline=(87, 83, 78, 255), width=3)
    draw.rounded_rectangle([335, 75, 390, 95], radius=6, fill=(120, 113, 108, 255), outline=(68, 64, 60, 255), width=3)
    for s_idx, (sx, sy, sr) in enumerate([(362, 55, 14), (370, 32, 18), (385, 10, 22)]):
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, 210 - s_idx * 40))

    # 2. 돌 기초
    draw_stone_foundation(draw, 50, 570, 462, 645)

    # 3. 1층 툇마루 / 베란다 데크
    deck_y1 = 440
    deck_y2 = 580
    draw.rounded_rectangle([60, deck_y1, 452, deck_y2], radius=12, fill=(180, 83, 9, 255), outline=(120, 53, 15, 255), width=3)
    for px in range(75, 440, 32):
        draw.line([(px, deck_y1), (px, deck_y2)], fill=(120, 53, 15, 255), width=2)
    draw.rounded_rectangle([55, deck_y1 - 6, 457, deck_y1 + 10], radius=5, fill=(217, 119, 6, 255), outline=(120, 53, 15, 255), width=3)

    # 4. 방 벽체
    wall_y1 = 230
    wall_y2 = deck_y1
    draw.rounded_rectangle([80, wall_y1, 432, wall_y2], radius=10, fill=(254, 243, 199, 255), outline=(180, 83, 9, 255), width=3)
    draw.line([(80, wall_y1), (80, wall_y2)], fill=(120, 53, 15, 255), width=8)
    draw.line([(432, wall_y1), (432, wall_y2)], fill=(120, 53, 15, 255), width=8)
    draw.line([(255, wall_y1), (255, wall_y2)], fill=(146, 64, 14, 255), width=6)

    # 5. 아치형 원목 문
    door_box = [285, 260, 405, wall_y2]
    draw.chord([285, 220, 405, 340], start=180, end=360, fill=(146, 64, 14, 255), outline=(90, 40, 10, 255), width=3)
    draw.rectangle([285, 280, 405, wall_y2], fill=(146, 64, 14, 255), outline=(90, 40, 10, 255), width=3)
    for dx in [315, 345, 375]:
        draw.line([(dx, 270), (dx, wall_y2)], fill=(90, 40, 10, 255), width=2)
    draw.rectangle([282, 305, 310, 315], fill=(30, 41, 59, 255))
    draw.rectangle([282, 385, 310, 395], fill=(30, 41, 59, 255))
    draw.ellipse([380, 350, 396, 366], fill=(251, 191, 36, 255), outline=(180, 83, 9, 255), width=2)

    # 6. 창문 + 촛불 조명 + 꽃 화분
    win_cx, win_cy = 168, 325
    draw_window_glow(img, win_cx, win_cy, 45, 45)
    draw.rounded_rectangle([120, 275, 215, 375], radius=16, fill=(254, 240, 138, 255), outline=(146, 64, 14, 255), width=4)
    draw.line([(168, 275), (168, 375)], fill=(146, 64, 14, 255), width=3)
    draw.line([(120, 325), (215, 325)], fill=(146, 64, 14, 255), width=3)
    draw_flower_box(draw, 110, 378, 225, h=18)

    # 7. 황금빛 곡선형 초가지붕
    layers = [
        (90, 210, 175, (251, 191, 36, 255), (180, 83, 9, 255)),
        (130, 250, 210, (245, 158, 11, 255), (180, 83, 9, 255)),
        (170, 280, 235, (217, 119, 6, 255), (146, 64, 14, 255)),
    ]
    for y_top, y_bot, w_spread, f_col, o_col in layers:
        cx = 256
        pts = [
            (cx - w_spread * 0.7, y_top),
            (cx + w_spread * 0.7, y_top),
            (cx + w_spread, y_bot - 10),
            (cx - w_spread, y_bot - 10),
        ]
        draw.polygon(pts, fill=f_col, outline=o_col)
        draw.chord([cx - w_spread, y_top - 40, cx + w_spread, y_top + 40], start=180, end=360, fill=f_col, outline=o_col, width=3)

    # 지붕 처마 볏짚 술
    eave_y = 265
    fringe_pts = []
    num_teeth = 28
    for i in range(num_teeth + 1):
        fx = 256 - 240 + (480 / num_teeth) * i
        fy = eave_y + (12 if i % 2 == 1 else 0)
        fringe_pts.append((fx, fy))
    fringe_pts.append((256 + 240, 230))
    fringe_pts.append((256 - 240, 230))
    draw.polygon(fringe_pts, fill=(251, 191, 36, 255), outline=(180, 83, 9, 255))

    for s in range(16):
        sx = 50 + s * 27
        draw.arc([sx, 120, sx + 50, 260], start=210, end=270, fill=(254, 240, 138, 255), width=2)
        draw.arc([sx - 10, 150, sx + 35, 275], start=200, end=260, fill=(180, 83, 9, 160), width=2)

    # 지붕 꼭대기 볏짚 묶음
    draw.rounded_rectangle([170, 75, 342, 105], radius=12, fill=(217, 119, 6, 255), outline=(146, 64, 14, 255), width=3)
    for bx in range(185, 335, 22):
        draw.line([(bx, 75), (bx + 8, 105)], fill=(120, 53, 15, 255), width=3)

    # 8. 바닥 버섯
    draw_fairytale_mushroom(draw, 35, 640, cap_w=30, cap_h=22, is_blue=False)
    draw_fairytale_mushroom(draw, 58, 648, cap_w=20, cap_h=16, is_blue=True)
    draw_fairytale_mushroom(draw, 470, 642, cap_w=28, cap_h=20, is_blue=False)
    draw_fairytale_mushroom(draw, 445, 650, cap_w=18, cap_h=14, is_blue=False)

    return img


# ==============================================================================
# 2. 아기자기한 동화풍 원목 통나무 오두막 (Log Cabin Fairytale Lodge)
# ==============================================================================
def generate_wood_house():
    img = get_empty_canvas()
    draw = ImageDraw.Draw(img)

    # 1. 굴뚝
    chim_box = [115, 60, 160, 170]
    draw.rounded_rectangle(chim_box, radius=8, fill=(120, 113, 108, 255), outline=(68, 64, 60, 255), width=3)
    draw.rounded_rectangle([110, 55, 165, 75], radius=5, fill=(168, 162, 158, 255), outline=(68, 64, 60, 255), width=3)
    for s_idx, (sx, sy, sr) in enumerate([(138, 38, 12), (130, 18, 16)]):
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, 210 - s_idx * 40))

    # 2. 자연석 기초석
    draw_stone_foundation(draw, 45, 575, 467, 645)

    # 3. 1층 통나무 벽체
    log_y_start = 370
    log_h = 24
    num_logs = 9
    for l in range(num_logs):
        ly = log_y_start + l * log_h
        draw.rounded_rectangle([55, ly, 457, ly + log_h + 2], radius=int(log_h/2), fill=(146, 64, 14, 255), outline=(90, 40, 10, 255), width=3)
        draw.line([(70, ly + 5), (442, ly + 5)], fill=(180, 83, 9, 200), width=3)
        for ex in [65, 447]:
            draw.ellipse([ex - 10, ly + 2, ex + 10, ly + log_h], fill=(217, 119, 6, 255), outline=(90, 40, 10, 255), width=2)
            draw.ellipse([ex - 4, ly + 6, ex + 4, ly + log_h - 4], fill=(180, 83, 9, 255))

    # 4. 1층 현관문 & 벽등 랜턴
    door_box = [280, 400, 395, 580]
    draw.rounded_rectangle(door_box, radius=12, fill=(90, 40, 10, 255), outline=(60, 25, 8, 255), width=3)
    for dx in [310, 340, 370]:
        draw.line([(dx, 405), (dx, 575)], fill=(60, 25, 8, 255), width=2)
    draw.ellipse([372, 485, 386, 499], fill=(251, 191, 36, 255), outline=(120, 53, 15, 255), width=2)
    draw.line([(405, 440), (420, 440)], fill=(30, 41, 59, 255), width=3)
    draw.rounded_rectangle([415, 435, 435, 465], radius=4, fill=(254, 240, 138, 255), outline=(30, 41, 59, 255), width=2)

    # 5. 1층 창문
    win_cx, win_cy = 175, 470
    draw_window_glow(img, win_cx, win_cy, 45, 40)
    draw.rounded_rectangle([130, 425, 220, 515], radius=10, fill=(254, 240, 138, 255), outline=(90, 40, 10, 255), width=3)
    draw.line([(175, 425), (175, 515)], fill=(90, 40, 10, 255), width=3)
    draw.line([(130, 470), (220, 470)], fill=(90, 40, 10, 255), width=3)
    draw_flower_box(draw, 120, 518, 230, h=16)

    # 6. 2층 통나무 벽체
    draw.rounded_rectangle([75, 200, 437, 375], radius=10, fill=(180, 83, 9, 255), outline=(120, 53, 15, 255), width=3)
    for l2 in range(7):
        ly2 = 205 + l2 * 24
        draw.line([(80, ly2), (432, ly2)], fill=(120, 53, 15, 255), width=2)

    draw_window_glow(img, 256, 275, 45, 40)
    draw.rounded_rectangle([210, 230, 302, 320], radius=8, fill=(254, 240, 138, 255), outline=(90, 40, 10, 255), width=3)
    draw.line([(256, 230), (256, 320)], fill=(90, 40, 10, 255), width=2)
    draw.line([(210, 275), (302, 275)], fill=(90, 40, 10, 255), width=2)
    draw.rounded_rectangle([182, 230, 208, 320], radius=4, fill=(120, 53, 15, 255), outline=(60, 25, 8, 255), width=2)
    draw.rounded_rectangle([304, 230, 330, 320], radius=4, fill=(120, 53, 15, 255), outline=(60, 25, 8, 255), width=2)

    # 2층 발코니 난간
    balc_y = 350
    draw.rounded_rectangle([70, balc_y, 442, balc_y + 26], radius=6, fill=(120, 53, 15, 255), outline=(60, 25, 8, 255), width=3)
    for bx in range(85, 425, 30):
        draw.line([(bx, balc_y + 4), (bx + 18, balc_y + 22)], fill=(217, 119, 6, 255), width=2)
        draw.line([(bx + 18, balc_y + 4), (bx, balc_y + 22)], fill=(217, 119, 6, 255), width=2)

    # 7. 너와지붕
    roof_pts = [
        (256, 70),
        (475, 215),
        (460, 235),
        (256, 100),
        (52, 235),
        (37, 215)
    ]
    draw.polygon(roof_pts, fill=(146, 64, 14, 255), outline=(60, 25, 8, 255))
    for r_layer in range(5):
        ry = 90 + r_layer * 26
        rx_spread = 60 + r_layer * 70
        for tx in range(int(256 - rx_spread), int(256 + rx_spread), 28):
            draw.rounded_rectangle([tx, ry, tx + 24, ry + 16], radius=4, fill=(120, 53, 15, 255), outline=(60, 25, 8, 255), width=2)

    # 8. 망루 & 빨간 깃발
    draw.rounded_rectangle([206, 65, 306, 95], radius=6, fill=(90, 40, 10, 255), outline=(60, 25, 8, 255), width=2)
    draw.line([(256, 15), (256, 65)], fill=(30, 41, 59, 255), width=3)
    draw.polygon([(256, 18), (300, 32), (256, 46)], fill=(239, 68, 68, 255), outline=(185, 28, 28, 255))

    # 9. 바닥 버섯
    draw_fairytale_mushroom(draw, 35, 640, cap_w=28, cap_h=20, is_blue=False)
    draw_fairytale_mushroom(draw, 470, 642, cap_w=28, cap_h=20, is_blue=True)

    return img


# ==============================================================================
# 3. 아기자기한 동화풍 성 같은 벽돌 요새 집 (Castle-like Brick Fortress)
# ==============================================================================
def generate_brick_house():
    img = get_empty_canvas()
    draw = ImageDraw.Draw(img)

    # 1. 붉은 벽돌 굴뚝 & 뭉게뭉게 연기
    chim_box = [355, 60, 415, 175]
    draw.rounded_rectangle(chim_box, radius=6, fill=(185, 28, 28, 255), outline=(127, 29, 29, 255), width=3)
    for cy in range(75, 170, 14):
        draw.line([(355, cy), (415, cy)], fill=(226, 232, 240, 220), width=2)
    draw.rounded_rectangle([348, 55, 422, 75], radius=5, fill=(153, 27, 27, 255), outline=(127, 29, 29, 255), width=3)
    for s_idx, (sx, sy, sr) in enumerate([(385, 38, 14), (395, 18, 18), (410, -2, 24)]):
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, 210 - s_idx * 40))

    # 2. 견고한 화강암 기단부
    draw_stone_foundation(draw, 45, 575, 467, 645)

    # 3. 1층 붉은 벽돌 성채
    draw.rounded_rectangle([55, 360, 457, 580], radius=8, fill=(220, 38, 38, 255), outline=(153, 27, 27, 255), width=3)
    for r, by in enumerate(range(365, 575, 16)):
        draw.line([(55, by), (457, by)], fill=(226, 232, 240, 200), width=2)
        offset = (r % 2) * 16
        for bx in range(60 + offset, 450, 32):
            draw.line([(bx, by), (bx, by + 16)], fill=(226, 232, 240, 200), width=2)
            draw.point((bx + 8, by + 4), fill=(254, 202, 202, 255))

    # 4. 성문: 철갑 원목 대문
    gate_box = [275, 390, 405, 580]
    draw.chord([275, 330, 405, 450], start=180, end=360, fill=(51, 65, 85, 255), outline=(15, 23, 42, 255), width=4)
    draw.rectangle([275, 390, 405, 580], fill=(51, 65, 85, 255), outline=(15, 23, 42, 255), width=4)
    for gy in [425, 480, 535]:
        draw.rectangle([275, gy, 405, gy + 12], fill=(30, 41, 59, 255), outline=(15, 23, 42, 255), width=2)
        for rx in range(288, 400, 24):
            draw.ellipse([rx - 3, gy + 3, rx + 3, gy + 9], fill=(203, 213, 225, 255))
    draw.ellipse([330, 500, 350, 520], fill=(251, 191, 36, 255), outline=(180, 83, 9, 255), width=3)

    # 5. 1층 아치형 요새 창문
    win_cx, win_cy = 165, 470
    draw_window_glow(img, win_cx, win_cy, 45, 45)
    draw.chord([125, 410, 205, 490], start=180, end=360, fill=(254, 240, 138, 255), outline=(51, 65, 85, 255), width=3)
    draw.rectangle([125, 450, 205, 520], fill=(254, 240, 138, 255), outline=(51, 65, 85, 255), width=3)
    for fx in [145, 165, 185]:
        draw.line([(fx, 430), (fx, 520)], fill=(30, 41, 59, 255), width=3)
    draw.line([(125, 475), (205, 475)], fill=(30, 41, 59, 255), width=3)

    # 6. 2층 석조 테라스 & 성채 벽면
    draw.rounded_rectangle([75, 180, 437, 365], radius=6, fill=(185, 28, 28, 255), outline=(127, 29, 29, 255), width=3)
    for r, by in enumerate(range(185, 360, 16)):
        draw.line([(75, by), (437, by)], fill=(226, 232, 240, 180), width=2)
        offset = (r % 2) * 16
        for bx in range(80 + offset, 430, 32):
            draw.line([(bx, by), (bx, by + 16)], fill=(226, 232, 240, 180), width=2)

    draw_window_glow(img, 256, 260, 45, 45)
    draw.chord([210, 205, 302, 295], start=180, end=360, fill=(254, 240, 138, 255), outline=(71, 85, 105, 255), width=3)
    draw.rectangle([210, 250, 302, 315], fill=(254, 240, 138, 255), outline=(71, 85, 105, 255), width=3)
    draw.line([(256, 215), (256, 315)], fill=(71, 85, 105, 255), width=3)
    draw.line([(210, 265), (302, 265)], fill=(71, 85, 105, 255), width=3)

    # 2층 둘째 돼지 테라스 발판
    draw.rounded_rectangle([70, 345, 442, 370], radius=5, fill=(100, 116, 139, 255), outline=(51, 65, 85, 255), width=3)
    for c_idx in range(6):
        cx = 90 + c_idx * 60
        draw.polygon([(cx, 370), (cx + 25, 370), (cx + 12, 395)], fill=(71, 85, 105, 255), outline=(51, 65, 85, 255))

    # 7. 성벽 요새 치성 (Crenelations)
    draw.rounded_rectangle([50, 150, 462, 175], radius=6, fill=(100, 116, 139, 255), outline=(51, 65, 85, 255), width=3)
    num_teeth = 5
    t_w = 42
    gap = 26
    start_x = 75
    for t in range(num_teeth):
        tx = start_x + t * (t_w + gap)
        draw.rounded_rectangle([tx, 100, tx + t_w, 155], radius=4, fill=(185, 28, 28, 255), outline=(127, 29, 29, 255), width=3)
        draw.rounded_rectangle([tx - 3, 94, tx + t_w + 3, 104], radius=3, fill=(148, 163, 184, 255), outline=(51, 65, 85, 255), width=2)

    # 8. 황금 깃발
    draw.line([(256, 45), (256, 100)], fill=(30, 41, 59, 255), width=3)
    draw.ellipse([252, 40, 260, 48], fill=(251, 191, 36, 255))
    draw.polygon([(256, 48), (315, 65), (256, 82)], fill=(245, 158, 11, 255), outline=(180, 83, 9, 255))

    # 9. 바닥 버섯
    draw_fairytale_mushroom(draw, 35, 640, cap_w=30, cap_h=22, is_blue=False)
    draw_fairytale_mushroom(draw, 470, 642, cap_w=28, cap_h=20, is_blue=False)

    return img


if __name__ == '__main__':
    print("Generating fairytale straw house...")
    h1 = generate_straw_house()
    h1.save('assets/house_straw.png', 'PNG')
    h1.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/preview_house_straw.png', 'PNG')

    print("Generating fairytale wood house...")
    h2 = generate_wood_house()
    h2.save('assets/house_wood.png', 'PNG')
    h2.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/preview_house_wood.png', 'PNG')

    print("Generating fairytale brick house...")
    h3 = generate_brick_house()
    h3.save('assets/house_brick.png', 'PNG')
    h3.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/preview_house_brick.png', 'PNG')

    print("All 3 fairytale houses generated successfully!")
