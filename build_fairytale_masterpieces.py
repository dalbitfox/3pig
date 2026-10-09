# -*- coding: utf-8 -*-
"""
build_fairytale_masterpieces.py
아기자기하고 예쁜 동화책 일러스트 스타일의 아기돼지 삼형제 집 3종
- 1단계: 볏짚으로 만든 집 (포근한 버섯형 볏짚 지붕, 아치문, 창문 꽃화분, 툇마루 테라스)
- 2단계: 나무로 만든 집 (2층 알프스 통나무 샬레, 하트 덧문 발코니, 원목 너와지붕)
- 3단계: 성같은 벽돌집 (테라코타 벽돌 성채, 톱니 치성, 코너 원뿔 첨탑, 황금 왕실 깃발)

캔버스 규격: 1024 x 1360 (슈퍼샘플링) -> 512 x 680 (최종 고화질 리샘플링)
기능적 캐릭터 안착 높이 동기화:
- 1층(셋째/삼형제): Y = 1020 (툇마루/성문 앞 테라스)
- 2층(둘째 저격수): Y = 760 (발코니/성벽 테라스)
- 3층(첫째 지휘관): Y = 360 (지붕 관측대/성채 치성)
"""

import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import cv2

SW, SH = 1024, 1360
FW, FH = 512, 680

# 부드러운 동화풍 짙은 초콜릿 잉크 외곽선
INK = (52, 28, 16, 255)
INK_MED = (85, 48, 28, 220)
INK_LIGHT = (120, 75, 45, 160)

def draw_poly(img, pts, fill, outline=None, width=0):
    """안티에일리어싱 폴리곤 드로잉"""
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    cv_img = np.array(overlay)
    cv_pts = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
    cv2.fillPoly(cv_img, [cv_pts], fill)
    if outline and width > 0:
        cv2.polylines(cv_img, [cv_pts], isClosed=True, color=outline, thickness=width, lineType=cv2.LINE_AA)
    layer = Image.fromarray(cv_img)
    img.alpha_composite(layer)

def add_warm_glow(img, cx, cy, rx, ry, inner_alpha=180, outer_alpha=90):
    """창문 및 랜턴의 포근한 황금빛 방사형 빛무리"""
    glow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([cx - rx*1.2, cy - ry*1.2, cx + rx*1.2, cy + ry*1.2], fill=(254, 240, 138, outer_alpha))
    gdraw.ellipse([cx - rx*0.6, cy - ry*0.6, cx + rx*0.6, cy + ry*0.6], fill=(253, 224, 71, inner_alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(int(rx * 0.4)))
    img.alpha_composite(glow)

def draw_fairytale_mushrooms(draw, base_x, base_y):
    """기단 주변에 돋아난 아기자기한 점박이 버섯들"""
    mushrooms = [
        (base_x - 30, base_y + 15, 52, 38, False), # 빨강
        (base_x + 25, base_y + 30, 36, 26, True),  # 파랑
        (base_x + 770, base_y + 18, 50, 36, False),
        (base_x + 820, base_y + 32, 34, 25, True)
    ]
    for mx, my, mw, mh, is_blue in mushrooms:
        # 버섯 기둥
        sw = mw * 0.38
        sh = mh * 1.15
        draw.rounded_rectangle([mx - sw/2, my - sh + mh*0.25, mx + sw/2, my], radius=int(sw/2), fill=(255, 250, 240, 255), outline=INK, width=3)
        # 버섯 갓
        c_base = (56, 189, 248, 255) if is_blue else (239, 68, 68, 255)
        c_shade = (2, 132, 199, 255) if is_blue else (185, 28, 28, 255)
        c_hi = (186, 230, 253, 255) if is_blue else (252, 165, 165, 255)
        
        cap_box = [mx - mw/2, my - sh - mh*0.35, mx + mw/2, my - sh + mh*0.75]
        draw.chord(cap_box, start=180, end=360, fill=c_base, outline=INK, width=4)
        draw.ellipse([mx - mw/2, my - sh + mh*0.05, mx + mw/2, my - sh + mh*0.4], fill=c_shade, outline=INK, width=3)
        draw.ellipse([mx - mw*0.3, my - sh - mh*0.25, mx + mw*0.05, my - sh], fill=c_hi)
        # 흰 점
        for dx, dy, dr in [(mx - mw*0.25, my - sh - mh*0.05, mw*0.12), (mx + mw*0.2, my - sh, mw*0.1), (mx - mw*0.04, my - sh - mh*0.16, mw*0.08)]:
            draw.ellipse([dx - dr, dy - dr*0.8, dx + dr, dy + dr*0.8], fill=(255, 255, 255, 255))

def draw_flower_box(draw, x1, y, x2, h=30):
    """알록달록 풍성한 동화 꽃 화분대"""
    draw.rounded_rectangle([x1, y, x2, y + h], radius=6, fill=(146, 64, 14, 255), outline=INK, width=4)
    draw.line([(x1 + 4, y + 6), (x2 - 4, y + 6)], fill=(180, 83, 9, 255), width=3)
    colors = [(244, 63, 94, 255), (251, 113, 133, 255), (255, 255, 255, 255), (250, 204, 21, 255), (192, 132, 252, 255), (96, 165, 250, 255)]
    w_box = x2 - x1
    num_f = int(w_box // 22)
    for i in range(num_f):
        fx = x1 + 14 + i * 22
        fy = y - 6 + (i % 2) * 6
        draw.ellipse([fx - 10, fy + 4, fx + 10, fy + 16], fill=(34, 197, 94, 255), outline=(20, 83, 45, 255), width=2)
        col = colors[i % len(colors)]
        draw.ellipse([fx - 8, fy - 8, fx + 8, fy + 8], fill=col, outline=INK, width=2)
        draw.ellipse([fx - 3, fy - 3, fx + 3, fy + 3], fill=(253, 224, 71, 255))

def draw_hanging_lantern(draw, x, y):
    """벽걸이 앤틱 황금 호롱등"""
    draw.line([(x, y - 25), (x + 22, y - 25), (x + 22, y - 10)], fill=(45, 30, 20, 255), width=5)
    draw.polygon([(x + 10, y - 10), (x + 34, y - 10), (x + 28, y + 25), (x + 16, y + 25)], fill=(254, 240, 138, 255), outline=INK, width=3)
    draw.line([(x + 22, y - 10), (x + 22, y + 25)], fill=INK, width=2)
    draw.rounded_rectangle([x + 12, y + 23, x + 32, y + 30], radius=3, fill=(50, 40, 35, 255))

def draw_chimney_and_smoke(draw, cx, cy, cw=90, ch=280, is_brick=False):
    """동화풍 굴뚝과 몽글몽글 피어오르는 연기"""
    # 몽글몽글 구름 연기 (위로 갈수록 커지고 투명해짐)
    smokes = [
        (cx + 45, cy - 35, 38, 220),
        (cx + 75, cy - 85, 50, 180),
        (cx + 120, cy - 145, 65, 140),
        (cx + 175, cy - 210, 82, 90)
    ]
    for sx, sy, sr, sa in smokes:
        draw.ellipse([sx - sr, sy - sr*0.9, sx + sr, sy + sr*0.9], fill=(255, 255, 255, sa), outline=(226, 232, 240, sa), width=2)
    
    # 굴뚝 몸체
    body_col = (185, 28, 28, 255) if is_brick else (140, 130, 120, 255)
    cap_col = (153, 27, 27, 255) if is_brick else (100, 90, 80, 255)
    draw.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=10, fill=body_col, outline=INK, width=5)
    draw.rounded_rectangle([cx - 15, cy - 20, cx + cw + 15, cy + 20], radius=8, fill=cap_col, outline=INK, width=5)
    # 벽돌/석조 눈금선
    for ly in range(cy + 35, cy + ch - 10, 35):
        draw.line([(cx, ly), (cx + cw, ly)], fill=INK, width=3)
        off_x = (ly % 2) * (cw // 2)
        draw.line([(cx + off_x, ly), (cx + off_x, ly + 35)], fill=INK, width=2)

def draw_fairytale_foundation(draw, x1, y1, x2, y2):
    """자연스러운 둥글둥글 호박돌 기초 + 싱그러운 이끼 잔디"""
    draw.rounded_rectangle([x1, y1, x2, y2], radius=18, fill=(90, 82, 75, 255), outline=INK, width=4)
    stone_cols = [
        (185, 180, 175, 255), (155, 150, 145, 255), (135, 130, 125, 255),
        (200, 195, 190, 255), (165, 160, 155, 255)
    ]
    rows = 3
    row_h = (y2 - y1) / rows
    num_cols = 8
    col_w = (x2 - x1) / num_cols
    for r in range(rows):
        sy = y1 + r * row_h
        for c in range(num_cols):
            sx = x1 + c * col_w + (r % 2) * (col_w * 0.4)
            ex = min(x2 - 4, sx + col_w * 0.92)
            if sx >= x2 - 8:
                continue
            scol = stone_cols[(r * 4 + c) % len(stone_cols)]
            draw.rounded_rectangle([sx + 3, sy + 3, ex, sy + row_h - 2], radius=10, fill=scol, outline=INK, width=3)
            # 상단 하이라이트
            draw.arc([sx + 8, sy + 5, ex - 6, sy + row_h - 4], start=180, end=300, fill=(250, 250, 250, 190), width=3)

    # 기단 아래 이끼 잔디 덤불
    moss_cols = [(101, 163, 13, 255), (77, 124, 15, 255), (132, 204, 22, 255)]
    w_total = x2 - x1
    for m in range(14):
        mx = x1 + 15 + m * (w_total - 30) / 13
        my = y2 - 2
        mr = 22 + (m % 3) * 6
        draw.ellipse([mx - mr, my - mr*0.48, mx + mr, my + mr*0.48], fill=moss_cols[m % len(moss_cols)])


# ==============================================================================
# [1] 1단계: 볏짚으로 만든 집 (Straw Fairytale Cottage)
# ==============================================================================
def create_fairytale_straw_house():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 굴뚝 & 연기 (우측 상단)
    cdraw = ImageDraw.Draw(img)
    draw_chimney_and_smoke(cdraw, 680, 160, cw=85, ch=320, is_brick=False)

    # 2. 기초 호박돌 & 점박이 버섯 (Y = 1170 ~ 1280)
    fdraw = ImageDraw.Draw(img)
    draw_fairytale_foundation(fdraw, 90, 1170, 934, 1280)
    draw_fairytale_mushrooms(fdraw, 110, 1250)

    # 3. 1층 툇마루 테라스 발판 (Pigs standing deck at Y = 1020)
    # 돼지들의 발이 닿는 따스한 원목 테라스 데크
    tdraw = ImageDraw.Draw(img)
    deck_y = 1010
    tdraw.rounded_rectangle([80, deck_y, 944, 1175], radius=16, fill=(180, 83, 9, 255), outline=INK, width=5)
    # 원목 데크 판자 분할선
    for bx in range(140, 900, 75):
        tdraw.line([(bx, deck_y), (bx, 1175)], fill=(120, 53, 15, 255), width=3)
    # 데크 상단 황금빛 하이라이트
    tdraw.line([(85, deck_y + 6), (939, deck_y + 6)], fill=(251, 191, 36, 255), width=4)

    # 4. 코지한 크림색 회벽 벽체 (Tudor Stucco & Curved Timber) - Y: 460 ~ 1015
    wdraw = ImageDraw.Draw(img)
    wdraw.rounded_rectangle([130, 460, 894, 1015], radius=24, fill=(254, 243, 199, 255), outline=INK, width=6)
    
    # 둥근 원목 코너 기둥 및 중앙 보 (Rustic Wood Posts)
    wdraw.rounded_rectangle([120, 460, 170, 1015], radius=12, fill=(120, 53, 15, 255), outline=INK, width=5)
    wdraw.rounded_rectangle([854, 460, 904, 1015], radius=12, fill=(120, 53, 15, 255), outline=INK, width=5)
    wdraw.rounded_rectangle([485, 460, 535, 1015], radius=8, fill=(146, 64, 14, 255), outline=INK, width=4)
    # 벽면 가로 구조 보
    wdraw.rounded_rectangle([125, 710, 899, 745], radius=6, fill=(146, 64, 14, 255), outline=INK, width=4)

    # 5. 좌측 따스한 아치형 격자 창문 & 꽃 화분대
    add_warm_glow(img, 320, 590, 130, 120, 180, 90)
    wdraw = ImageDraw.Draw(img)
    # 창문 프레임
    wdraw.chord([210, 480, 430, 700], start=180, end=360, fill=(254, 240, 138, 255), outline=INK, width=5)
    wdraw.rectangle([210, 590, 430, 710], fill=(254, 240, 138, 255), outline=INK, width=5)
    # 격자살
    wdraw.line([(320, 480), (320, 710)], fill=(120, 53, 15, 255), width=5)
    wdraw.line([(210, 590), (430, 590)], fill=(120, 53, 15, 255), width=5)
    # 반사광
    wdraw.polygon([(230, 500), (280, 500), (230, 570)], fill=(255, 255, 255, 160))
    # 창문 아래 꽃 화분대
    draw_flower_box(wdraw, 195, 710, 445, h=32)

    # 담쟁이 덩굴 (창문 옆을 타고 싱그럽게 자람)
    ivy_pts = [(165, 1010), (160, 850), (175, 720), (160, 600), (175, 490)]
    for ip in range(len(ivy_pts) - 1):
        p1, p2 = ivy_pts[ip], ivy_pts[ip+1]
        wdraw.line([p1, p2], fill=(20, 83, 45, 255), width=4)
        wdraw.ellipse([p2[0]-10, p2[1]-8, p2[0]+10, p2[1]+8], fill=(34, 197, 94, 255), outline=INK, width=2)
        wdraw.ellipse([p2[0]-5, p2[1]-4, p2[0]+5, p2[1]+4], fill=(74, 222, 128, 255))

    # 6. 우측 아치형 원목 현관문 & 벽걸이 등불
    door_box = [560, 500, 810, 1010]
    wdraw.rounded_rectangle([door_box[0]-10, door_box[1]-10, door_box[2]+10, door_box[3]+4], radius=65, fill=(90, 40, 12, 255), outline=INK, width=5)
    wdraw.rounded_rectangle(door_box, radius=60, fill=(180, 83, 9, 255), outline=INK, width=5)
    # 판자 세로선
    for dx in [625, 685, 745]:
        wdraw.line([(dx, door_box[1] + 12), (dx, door_box[3])], fill=(120, 53, 15, 255), width=3)
    # 철제 경첩
    for hy in [600, 860]:
        wdraw.rounded_rectangle([550, hy, 630, hy + 22], radius=6, fill=(30, 41, 59, 255), outline=INK, width=3)
        wdraw.ellipse([620, hy + 4, 632, hy + 18], fill=(148, 163, 184, 255))
    # 황금 손잡이
    wdraw.ellipse([745, 760, 775, 790], fill=(245, 158, 11, 255), outline=INK, width=4)
    wdraw.ellipse([750, 765, 765, 780], fill=(254, 240, 138, 255))
    
    # 현관 앞 벽걸이 호롱등
    add_warm_glow(img, 510, 640, 85, 85, 190, 90)
    wdraw = ImageDraw.Draw(img)
    draw_hanging_lantern(wdraw, 500, 640)

    # 7. 황금빛 동화 버섯 곡선 볏짚 지붕 (Straw Thatched Roof)
    # 지붕 처마 밑 벽체 드리움 그림자
    rdraw = ImageDraw.Draw(img)
    rdraw.rounded_rectangle([110, 450, 914, 520], radius=15, fill=(0, 0, 0, 35))

    # 메인 지붕 외형 (풍성하고 둥근 버섯형 곡선)
    roof_pts = [
        (50, 490), (120, 330), (280, 180), (512, 135),
        (744, 180), (904, 330), (974, 490),
        (930, 515), (850, 495), (770, 520), (690, 500),
        (610, 520), (512, 500), (414, 520), (334, 500),
        (254, 520), (174, 495), (94, 515)
    ]
    draw_poly(img, roof_pts, fill=(217, 119, 6, 255), outline=INK, width=6)

    # 지붕 상단 풍성한 황금 레이어 (살짝 올려 입체감 강화)
    roof_top_pts = [
        (60, 475), (125, 320), (285, 175), (512, 130),
        (739, 175), (899, 320), (964, 475),
        (925, 495), (845, 480), (765, 500), (685, 485),
        (605, 500), (512, 485), (419, 500), (339, 485),
        (259, 500), (179, 480), (99, 495)
    ]
    draw_poly(img, roof_top_pts, fill=(245, 158, 11, 255), outline=INK, width=5)

    # 지붕 상단 햇살 하이라이트 레이어
    roof_hi_pts = [
        (130, 420), (220, 270), (340, 180), (512, 145),
        (684, 180), (804, 270), (894, 420),
        (780, 350), (640, 290), (512, 270), (384, 290), (244, 350)
    ]
    draw_poly(img, roof_hi_pts, fill=(253, 224, 71, 220))

    # 섬세한 볏짚 질감 라인 (지붕 영역 내부만 렌더링)
    sdraw = ImageDraw.Draw(img)
    for ly in [280, 350, 420]:
        span_w = 260 + (ly - 200) * 1.3
        for sx in np.linspace(512 - span_w, 512 + span_w, 28):
            rand_len = 22 + (int(sx) % 7) * 4
            rand_tilt = (int(sx) % 5 - 2) * 3
            sdraw.line([(sx, ly), (sx + rand_tilt, ly + rand_len)], fill=(180, 83, 9, 210), width=3)
            sdraw.line([(sx + 1, ly), (sx + rand_tilt + 1, ly + rand_len)], fill=(254, 240, 138, 170), width=2)

    # 처마 끝 솔가지/지푸라기 드리움 (Straw Fringe Overhang)
    for fx in range(75, 955, 16):
        fy = 485 + math.sin(fx * 0.05) * 8
        flen = 22 + (fx % 6) * 6
        sdraw.line([(fx, fy), (fx + (fx % 5 - 2)*3, fy + flen)], fill=(217, 119, 6, 255), width=3)
        sdraw.line([(fx + 1, fy), (fx + (fx % 5 - 2)*3 + 1, fy + flen)], fill=(253, 224, 71, 255), width=2)

    # 8. 지붕 꼭대기 볏짚 용마름 (Ridge Cap) 볏짚단 묶음
    cap_box = [260, 80, 764, 165]
    sdraw.rounded_rectangle(cap_box, radius=40, fill=(217, 119, 6, 255), outline=INK, width=6)
    sdraw.rounded_rectangle([cap_box[0]+5, cap_box[1]+5, cap_box[2]-5, cap_box[1]+32], radius=20, fill=(251, 191, 36, 255))
    # X자 새끼줄 꼬임 장식 (Rustic Twine)
    for cx in range(295, 740, 42):
        sdraw.line([(cx - 16, 85), (cx + 16, 160)], fill=(120, 53, 15, 255), width=4)
        sdraw.line([(cx + 16, 85), (cx - 16, 160)], fill=(120, 53, 15, 255), width=4)
        sdraw.line([(cx, 75), (cx, 170)], fill=(254, 243, 199, 190), width=2)

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


# ==============================================================================
# [2] 2단계: 통나무로 만든 집 (Fairytale Log Chalet)
# ==============================================================================
def create_fairytale_wood_house():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 굴뚝 & 연기 (좌측 상단)
    cdraw = ImageDraw.Draw(img)
    draw_chimney_and_smoke(cdraw, 180, 120, cw=85, ch=360, is_brick=False)

    # 2. 기초 호박돌 & 점박이 버섯 (Y = 1170 ~ 1280)
    fdraw = ImageDraw.Draw(img)
    draw_fairytale_foundation(fdraw, 90, 1170, 934, 1280)
    draw_fairytale_mushrooms(fdraw, 110, 1250)

    # 3. 1층 툇마루 테라스 발판 (Pigs standing deck at Y = 1020)
    deck_y = 1010
    tdraw = ImageDraw.Draw(img)
    tdraw.rounded_rectangle([80, deck_y, 944, 1175], radius=16, fill=(146, 64, 14, 255), outline=INK, width=5)
    for bx in range(140, 900, 75):
        tdraw.line([(bx, deck_y), (bx, 1175)], fill=(90, 40, 12, 255), width=3)
    tdraw.line([(85, deck_y + 6), (939, deck_y + 6)], fill=(217, 119, 6, 255), width=4)

    # 4. 1층 원목 통나무 벽체 (Rounded Honey Logs) - Y: 750 ~ 1015
    ldraw = ImageDraw.Draw(img)
    log_h = 52
    y_start = 745
    y_end = 1015
    num_logs = int((y_end - y_start) // log_h) + 1
    for i in range(num_logs):
        ly = y_start + i * log_h
        lh = min(log_h, y_end - ly)
        if lh < 25:
            continue
        ldraw.rounded_rectangle([110, ly, 914, ly + lh], radius=16, fill=(180, 83, 9, 255), outline=INK, width=4)
        ldraw.line([(118, ly + 8), (906, ly + 8)], fill=(245, 158, 11, 255), width=5)
        ldraw.line([(120, ly + 14), (904, ly + 14)], fill=(251, 191, 36, 180), width=3)
        ldraw.line([(118, ly + lh - 5), (906, ly + lh - 5)], fill=(120, 53, 15, 255), width=4)
        # 통나무 단면 나이테
        for cx in [110, 914]:
            ldraw.ellipse([cx - 24, ly + 3, cx + 24, ly + lh - 3], fill=(217, 119, 6, 255), outline=INK, width=4)
            if lh >= 38:
                ldraw.ellipse([cx - 15, ly + 8, cx + 15, ly + lh - 8], fill=(180, 83, 9, 255), outline=INK_MED, width=2)

    # 5. 1층 좌측 창문 & 꽃 화분
    add_warm_glow(img, 310, 860, 120, 110, 180, 90)
    ldraw = ImageDraw.Draw(img)
    ldraw.rounded_rectangle([210, 780, 410, 950], radius=24, fill=(254, 240, 138, 255), outline=INK, width=6)
    ldraw.line([(310, 780), (310, 950)], fill=(120, 53, 15, 255), width=6)
    ldraw.line([(210, 865), (410, 865)], fill=(120, 53, 15, 255), width=6)
    ldraw.polygon([(225, 795), (280, 795), (225, 850)], fill=(255, 255, 255, 160))
    draw_flower_box(ldraw, 195, 950, 425, h=32)

    # 1층 우측 원목 문 & 호롱불
    door_box = [550, 780, 810, 1010]
    ldraw.rounded_rectangle([door_box[0]-8, door_box[1]-8, door_box[2]+8, door_box[3]+4], radius=35, fill=(90, 40, 12, 255), outline=INK, width=5)
    ldraw.rounded_rectangle(door_box, radius=30, fill=(146, 64, 14, 255), outline=INK, width=5)
    for dx in [615, 680, 745]:
        ldraw.line([(dx, door_box[1] + 10), (dx, door_box[3])], fill=(90, 40, 12, 255), width=3)
    for hy in [830, 940]:
        ldraw.rounded_rectangle([540, hy, 620, hy + 20], radius=5, fill=(30, 41, 59, 255), outline=INK, width=3)
        ldraw.ellipse([610, hy + 4, 622, hy + 16], fill=(148, 163, 184, 255))
    ldraw.ellipse([745, 890, 775, 920], fill=(245, 158, 11, 255), outline=INK, width=4)
    ldraw.ellipse([750, 895, 765, 910], fill=(254, 240, 138, 255))
    
    add_warm_glow(img, 495, 860, 85, 85, 190, 90)
    ldraw = ImageDraw.Draw(img)
    draw_hanging_lantern(ldraw, 485, 860)

    # 6. 2층 발코니 테라스 데크 (Y = 750 ~ 760: 둘째 돼지 저격 플랫폼)
    ldraw.rounded_rectangle([90, 715, 934, 760], radius=10, fill=(120, 53, 15, 255), outline=INK, width=5)
    ldraw.line([(95, 723), (929, 723)], fill=(217, 119, 6, 255), width=4)
    # 발코니 X자 목재 난간 장식
    for rx in range(120, 900, 65):
        ldraw.line([(rx, 715), (rx + 45, 760)], fill=(78, 32, 8, 255), width=3)
        ldraw.line([(rx + 45, 715), (rx, 760)], fill=(78, 32, 8, 255), width=3)

    # 7. 2층 통나무 벽체 (Y: 420 ~ 720)
    y2_start = 420
    y2_end = 720
    num2_logs = int((y2_end - y2_start) // log_h) + 1
    for i in range(num2_logs):
        ly = y2_start + i * log_h
        lh = min(log_h, y2_end - ly)
        if lh < 25:
            continue
        ldraw.rounded_rectangle([150, ly, 874, ly + lh], radius=16, fill=(180, 83, 9, 255), outline=INK, width=4)
        ldraw.line([(158, ly + 8), (866, ly + 8)], fill=(245, 158, 11, 255), width=5)
        ldraw.line([(158, ly + lh - 5), (866, ly + lh - 5)], fill=(120, 53, 15, 255), width=4)
        for cx in [150, 874]:
            ldraw.ellipse([cx - 20, ly + 3, cx + 20, ly + lh - 3], fill=(217, 119, 6, 255), outline=INK, width=3)

    # 2층 중앙 하트 덧문 다락방 창문 (둘째 돼지 룸)
    add_warm_glow(img, 512, 550, 110, 100, 180, 90)
    ldraw = ImageDraw.Draw(img)
    ldraw.rounded_rectangle([420, 460, 604, 640], radius=24, fill=(254, 240, 138, 255), outline=INK, width=5)
    ldraw.line([(512, 460), (512, 640)], fill=(120, 53, 15, 255), width=5)
    ldraw.line([(420, 550), (604, 550)], fill=(120, 53, 15, 255), width=5)
    # 좌우 하트 덧문
    for sx in [355, 604]:
        ldraw.rounded_rectangle([sx, 460, sx + 65, 640], radius=8, fill=(146, 64, 14, 255), outline=INK, width=4)
        hx = sx + 32
        hy = 545
        ldraw.polygon([(hx, hy + 12), (hx - 12, hy - 4), (hx - 6, hy - 14), (hx, hy - 8), (hx + 6, hy - 14), (hx + 12, hy - 4)], fill=(254, 243, 199, 255))
    draw_flower_box(ldraw, 395, 640, 629, h=30)

    # 8. 통나무 오두막 박공 너와 지붕 (Gable Shingle Roof)
    # 지붕 처마 드롭섀도
    rdraw = ImageDraw.Draw(img)
    rdraw.polygon([(40, 450), (512, 160), (984, 450), (512, 470)], fill=(0, 0, 0, 40))

    # 너와 기와 레이어 (Alpine wooden shingles)
    rows_shingles = [
        (410, 50, 974, 13),
        (350, 110, 914, 11),
        (290, 180, 844, 9),
        (230, 260, 764, 7),
        (170, 350, 674, 5),
        (120, 440, 584, 3)
    ]
    shingle_cols = [(146, 64, 14, 255), (180, 83, 9, 255), (120, 53, 15, 255), (194, 65, 12, 255)]
    for sy, sx1, sx2, count in rows_shingles:
        sw = (sx2 - sx1) / count
        for sc in range(count):
            bx = sx1 + sc * sw
            col = shingle_cols[(int(bx) + sy) % len(shingle_cols)]
            rdraw.rounded_rectangle([bx + 3, sy, bx + sw - 3, sy + 65], radius=10, fill=col, outline=INK, width=4)
            rdraw.line([(bx + 8, sy + 58), (bx + sw - 8, sy + 58)], fill=(251, 191, 36, 180), width=3)

    # 지붕 용마루 빔 (Ridge Beam) & 첫째 돼지 관측 발판 (Y = 360)
    rdraw.rounded_rectangle([400, 90, 624, 145], radius=14, fill=(120, 53, 15, 255), outline=INK, width=5)
    rdraw.line([(410, 100), (614, 100)], fill=(217, 119, 6, 255), width=4)

    # 지붕 꼭대기 바람개비/깃발 (첫째 돼지 붉은 깃발)
    rdraw.line([(512, 20), (512, 95)], fill=(30, 41, 59, 255), width=6)
    rdraw.ellipse([502, 10, 522, 30], fill=(245, 158, 11, 255), outline=INK, width=3)
    rdraw.polygon([(512, 25), (620, 55), (512, 85)], fill=(239, 68, 68, 255), outline=INK, width=4)
    rdraw.polygon([(512, 35), (590, 55), (512, 75)], fill=(252, 165, 165, 255))

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


# ==============================================================================
# [3] 3단계: 성같은 벽돌집 (Fairytale Royal Brick Castle)
# ==============================================================================
def create_fairytale_brick_house():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 굴뚝 & 벽난로 연기 (우측 상단)
    cdraw = ImageDraw.Draw(img)
    draw_chimney_and_smoke(cdraw, 680, 140, cw=85, ch=280, is_brick=True)

    # 2. 기초 대리석/화강암 기단 (Granite Ashlar Base)
    bdraw = ImageDraw.Draw(img)
    draw_fairytale_foundation(bdraw, 80, 1170, 944, 1280)
    draw_fairytale_mushrooms(bdraw, 100, 1250)

    # 3. 1층 성문 앞 석조 테라스 (Pigs standing deck at Y = 1020)
    deck_y = 1010
    bdraw.rounded_rectangle([70, deck_y, 954, 1175], radius=16, fill=(100, 116, 139, 255), outline=INK, width=5)
    for bx in range(130, 910, 80):
        bdraw.line([(bx, deck_y), (bx, 1175)], fill=(51, 65, 85, 255), width=3)
    bdraw.line([(75, deck_y + 6), (949, deck_y + 6)], fill=(203, 213, 225, 255), width=4)

    # 4. 1층 견고한 테라코타 벽돌 벽체 (Terracotta Masonry) - Y: 710 ~ 1015
    bdraw.rounded_rectangle([110, 705, 914, 1015], radius=16, fill=(185, 28, 28, 255), outline=INK, width=6)
    brick_cols = [(220, 38, 38, 255), (185, 28, 28, 255), (153, 27, 27, 255), (239, 68, 68, 255)]
    np.random.seed(123)
    b_h = 32
    b_w = 68
    for r in range(int((1015 - 705) // b_h)):
        by = 710 + r * b_h
        for c in range(int((914 - 110) // b_w) + 1):
            bx = 115 + c * b_w + (r % 2) * (b_w // 2)
            ex = min(909, bx + b_w - 4)
            if bx >= 909:
                continue
            bcol = brick_cols[(r * 5 + c) % len(brick_cols)]
            bdraw.rounded_rectangle([bx, by, ex, by + b_h - 4], radius=4, fill=bcol)
            bdraw.line([(bx + 2, by + 1), (ex - 2, by + 1)], fill=(254, 202, 202, 140), width=2)
            bdraw.line([(bx + 2, by + b_h - 5), (ex - 2, by + b_h - 5)], fill=(127, 29, 29, 200), width=2)

    # 좌우 석조 모루돌 (Stone Quoins)
    for qx, is_left in [(110, True), (864, False)]:
        for qi in range(10):
            qy = 710 + qi * 31
            qw = 48 if (qi % 2 == 0) else 34
            rx = qx if is_left else (qx + 50 - qw)
            bdraw.rounded_rectangle([rx, qy, rx + qw, qy + 27], radius=6, fill=(203, 213, 225, 255), outline=INK, width=3)
            bdraw.line([(rx + 4, qy + 4), (rx + qw - 4, qy + 4)], fill=(248, 250, 252, 220), width=2)

    # 5. 1층 좌측 아치형 성채 창문 & 철제 창살
    add_warm_glow(img, 320, 830, 130, 130, 180, 90)
    bdraw = ImageDraw.Draw(img)
    bdraw.chord([200, 715, 440, 955], start=180, end=360, fill=(148, 163, 184, 255), outline=INK, width=6)
    bdraw.rectangle([200, 835, 440, 965], fill=(148, 163, 184, 255), outline=INK, width=6)
    bdraw.chord([220, 735, 420, 935], start=180, end=360, fill=(254, 240, 138, 255), outline=INK, width=4)
    bdraw.rectangle([220, 835, 420, 945], fill=(254, 240, 138, 255), outline=INK, width=4)
    for gx in [265, 320, 375]:
        bdraw.line([(gx, 745), (gx, 945)], fill=(30, 41, 59, 255), width=5)
    bdraw.line([(220, 845), (420, 845)], fill=(30, 41, 59, 255), width=5)

    # 1층 우측 아치형 철갑 성문 (Grand Castle Gate)
    gate_box = [540, 735, 820, 1010]
    bdraw.chord([gate_box[0]-16, gate_box[1]-16, gate_box[2]+16, gate_box[1]+240], start=180, end=360, fill=(100, 116, 139, 255), outline=INK, width=6)
    bdraw.rectangle([gate_box[0]-16, gate_box[1]+105, gate_box[2]+16, gate_box[3]+4], fill=(100, 116, 139, 255), outline=INK, width=6)
    bdraw.chord([gate_box[0], gate_box[1], gate_box[2], gate_box[1]+260], start=180, end=360, fill=(30, 41, 59, 255), outline=INK, width=5)
    bdraw.rectangle([gate_box[0], gate_box[1]+130, gate_box[2], gate_box[3]], fill=(30, 41, 59, 255), outline=INK, width=5)
    # 리벳 강철 띠
    for ry in [830, 930]:
        bdraw.rectangle([gate_box[0]+4, ry, gate_box[2]-4, ry + 24], fill=(51, 65, 85, 255), outline=INK, width=3)
        for rx in range(gate_box[0]+25, gate_box[2]-15, 38):
            bdraw.ellipse([rx - 5, ry + 6, rx + 5, ry + 16], fill=(226, 232, 240, 255), outline=INK, width=1)
    bdraw.ellipse([665, 935, 695, 965], fill=(245, 158, 11, 255), outline=INK, width=4)
    bdraw.ellipse([670, 940, 685, 955], fill=(254, 240, 138, 255))
    
    # 6. 중간 성벽 대리석 몰딩 (2층 발코니 플랫폼: 둘째 돼지 저격대 Y = 760)
    bdraw.rounded_rectangle([90, 665, 934, 715], radius=10, fill=(100, 116, 139, 255), outline=INK, width=5)
    bdraw.line([(95, 673), (929, 673)], fill=(203, 213, 225, 255), width=4)
    # 깃발 펜던트 장식 (Blue Castle Pennants)
    for c_idx in range(6):
        cx = 160 + c_idx * 120
        bdraw.polygon([(cx, 715), (cx + 50, 715), (cx + 25, 765)], fill=(30, 58, 138, 255), outline=INK, width=3)
        bdraw.polygon([(cx + 8, 715), (cx + 42, 715), (cx + 25, 755)], fill=(59, 130, 246, 255))

    # 7. 2층 상부 벽돌 벽체 (Y: 340 ~ 675)
    bdraw.rounded_rectangle([150, 340, 874, 675], radius=14, fill=(185, 28, 28, 255), outline=INK, width=6)
    for r in range(int((675 - 340) // b_h)):
        by = 345 + r * b_h
        for c in range(int((874 - 150) // b_w) + 1):
            bx = 155 + c * b_w + (r % 2) * (b_w // 2)
            ex = min(869, bx + b_w - 4)
            if bx >= 869:
                continue
            bcol = brick_cols[(r * 3 + c) % len(brick_cols)]
            bdraw.rounded_rectangle([bx, by, ex, by + b_h - 4], radius=4, fill=bcol)
            bdraw.line([(bx + 2, by + 1), (ex - 2, by + 1)], fill=(254, 202, 202, 140), width=2)

    # 2층 중앙 아치형 망루 창문 (둘째 돼지 룸)
    add_warm_glow(img, 512, 490, 110, 110, 180, 90)
    bdraw = ImageDraw.Draw(img)
    bdraw.chord([430, 400, 594, 560], start=180, end=360, fill=(148, 163, 184, 255), outline=INK, width=5)
    bdraw.rectangle([430, 480, 594, 580], fill=(148, 163, 184, 255), outline=INK, width=5)
    bdraw.chord([445, 415, 579, 545], start=180, end=360, fill=(254, 240, 138, 255), outline=INK, width=4)
    bdraw.rectangle([445, 480, 579, 565], fill=(254, 240, 138, 255), outline=INK, width=4)
    bdraw.line([(512, 415), (512, 565)], fill=(120, 53, 15, 255), width=5)
    bdraw.line([(445, 490), (579, 490)], fill=(120, 53, 15, 255), width=5)

    # 8. 성채 꼭대기 요새 치성 (Crenelations: 첫째 돼지 지휘대 Y = 360)
    bdraw.rounded_rectangle([80, 300, 944, 350], radius=10, fill=(100, 116, 139, 255), outline=INK, width=5)
    bdraw.line([(85, 308), (939, 308)], fill=(203, 213, 225, 255), width=4)
    
    # 톱니 치성 5개
    num_teeth = 5
    tw = 90
    gap = 50
    st_x = 150
    for t in range(num_teeth):
        tx = st_x + t * (tw + gap)
        bdraw.rounded_rectangle([tx, 200, tx + tw, 310], radius=8, fill=(185, 28, 28, 255), outline=INK, width=5)
        bdraw.rounded_rectangle([tx - 6, 190, tx + tw + 6, 212], radius=6, fill=(148, 163, 184, 255), outline=INK, width=3)
        bdraw.line([(tx, 196), (tx + tw, 196)], fill=(241, 245, 249, 220), width=2)

    # 좌우 코너 첨탑 망루 터렛 (Turrets with Conical Roofs)
    for t_cx in [120, 904]:
        bdraw.rounded_rectangle([t_cx - 50, 180, t_cx + 50, 330], radius=12, fill=(185, 28, 28, 255), outline=INK, width=5)
        # 고딕 원뿔 슬레이트 지붕
        bdraw.polygon([(t_cx, 55), (t_cx - 65, 190), (t_cx + 65, 190)], fill=(30, 58, 138, 255), outline=INK, width=5)
        bdraw.polygon([(t_cx, 70), (t_cx - 20, 185), (t_cx + 40, 185)], fill=(59, 130, 246, 255))
        # 황금 피니얼 보주
        bdraw.ellipse([t_cx - 10, 45, t_cx + 10, 65], fill=(245, 158, 11, 255), outline=INK, width=3)
        bdraw.ellipse([t_cx - 5, 49, t_cx + 5, 59], fill=(254, 240, 138, 255))

    # 9. 성채 중앙 황금 왕실 깃발
    bdraw.line([(512, 25), (512, 190)], fill=(30, 41, 59, 255), width=6)
    bdraw.ellipse([502, 15, 522, 35], fill=(245, 158, 11, 255), outline=INK, width=3)
    bdraw.polygon([(512, 38), (640, 73), (512, 108)], fill=(245, 158, 11, 255), outline=INK, width=4)
    bdraw.polygon([(512, 48), (610, 73), (512, 98)], fill=(253, 224, 71, 255))

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


if __name__ == '__main__':
    print("Building masterpiece fairytale storybook houses...")
    
    h1 = create_fairytale_straw_house()
    h1.save('assets/house_straw.png', 'PNG')
    h1.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/masterpiece_v4_house_straw.png', 'PNG')
    print("Straw house done!")

    h2 = create_fairytale_wood_house()
    h2.save('assets/house_wood.png', 'PNG')
    h2.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/masterpiece_v4_house_wood.png', 'PNG')
    print("Wood house done!")

    h3 = create_fairytale_brick_house()
    h3.save('assets/house_brick.png', 'PNG')
    h3.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/masterpiece_v4_house_brick.png', 'PNG')
    print("Brick house done!")

    print("All 3 masterpiece fairytale storybook houses generated successfully!")
