# -*- coding: utf-8 -*-
"""
generate_storybook_houses_v3.py
최고급 동화책 일러스트 풍 아기돼지 삼형제 집 3종 (짚집, 나무집, 성 벽돌집)
"""

import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import cv2

# 내부 슈퍼샘플링 해상도 (2x: 1024 x 1360) -> 최종 리샘플링 (512 x 680)
SW, SH = 1024, 1360
FW, FH = 512, 680

# 공통 팔레트 (따스하고 깊이 있는 동화책 잉크선)
INK = (45, 24, 16, 255)         # 진한 초콜릿 브라운 외곽선
INK_MED = (75, 42, 28, 220)     # 중간 디테일선
INK_LIGHT = (110, 65, 45, 160)  # 질감/음영 보조선

def get_bezier_curve(points, num_points=60):
    """베지에 곡선 좌표 생성"""
    n = len(points) - 1
    t = np.linspace(0, 1, num_points)
    curve = np.zeros((num_points, 2), dtype=np.float32)
    for i, p in enumerate(points):
        b = math.comb(n, i) * (t ** i) * ((1 - t) ** (n - i))
        curve[:, 0] += b * p[0]
        curve[:, 1] += b * p[1]
    return [(int(x), int(y)) for x, y in curve]

def draw_polygon_aa(img, pts, fill_color, outline_color=None, outline_width=0):
    """안티에일리어싱 폴리곤 드로잉"""
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    cv_img = np.array(overlay)
    cv_pts = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
    
    # 채우기
    cv2.fillPoly(cv_img, [cv_pts], fill_color)
    # 외곽선
    if outline_color and outline_width > 0:
        cv2.polylines(cv_img, [cv_pts], isClosed=True, color=outline_color, thickness=outline_width, lineType=cv2.LINE_AA)
    
    layer = Image.fromarray(cv_img)
    img.alpha_composite(layer)

def add_radial_glow(img, cx, cy, rx, ry, inner_col, outer_col):
    """부드러운 방사형 빛무리 효과"""
    glow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=outer_col)
    gdraw.ellipse([cx - rx*0.5, cy - ry*0.5, cx + rx*0.5, cy + ry*0.5], fill=inner_col)
    glow = glow.filter(ImageFilter.GaussianBlur(int(rx * 0.45)))
    img.alpha_composite(glow)

def draw_fairytale_mushroom(draw, cx, cy, cap_w, cap_h, is_blue=False):
    """배경과 100% 일치하는 빨강/파랑 점박이 동화 버섯"""
    sw = cap_w * 0.4
    sh = cap_h * 1.1
    # 버섯 대
    draw.rounded_rectangle([cx - sw/2, cy - sh + cap_h*0.3, cx + sw/2, cy], radius=int(sw/2), fill=(255, 252, 245, 255), outline=INK, width=3)
    draw.ellipse([cx - sw/2, cy - 6, cx + sw/2, cy + 2], fill=(225, 215, 200, 255))
    
    # 갓
    c_base = (56, 189, 248, 255) if is_blue else (239, 68, 68, 255)
    c_shade = (2, 132, 199, 255) if is_blue else (185, 28, 28, 255)
    c_hi = (186, 230, 253, 255) if is_blue else (252, 165, 165, 255)
    
    cap_box = [cx - cap_w/2, cy - sh - cap_h*0.35, cx + cap_w/2, cy - sh + cap_h*0.75]
    draw.chord(cap_box, start=180, end=360, fill=c_base, outline=INK, width=4)
    draw.ellipse([cx - cap_w/2, cy - sh + cap_h*0.05, cx + cap_w/2, cy - sh + cap_h*0.4], fill=c_shade, outline=INK, width=3)
    draw.ellipse([cx - cap_w*0.3, cy - sh - cap_h*0.25, cx + cap_w*0.05, cy - sh], fill=c_hi)
    
    # 흰색 점박이
    dots = [
        (cx - cap_w*0.25, cy - sh - cap_h*0.05, cap_w*0.13),
        (cx + cap_w*0.22, cy - sh, cap_w*0.11),
        (cx - cap_w*0.05, cy - sh - cap_h*0.18, cap_w*0.09),
        (cx + cap_w*0.05, cy - sh + cap_h*0.12, cap_w*0.08)
    ]
    for dx, dy, dr in dots:
        draw.ellipse([dx - dr, dy - dr*0.8, dx + dr, dy + dr*0.8], fill=(255, 255, 255, 255), outline=(220, 220, 220, 255), width=1)

def draw_flower_box(draw, x1, y, x2, h=30):
    """창문 아래 피어난 알록달록 동화 꽃 화분대"""
    draw.rounded_rectangle([x1, y, x2, y + h], radius=6, fill=(146, 64, 14, 255), outline=INK, width=4)
    draw.line([(x1 + 4, y + 6), (x2 - 4, y + 6)], fill=(180, 83, 9, 255), width=3)
    
    colors = [(244, 63, 94, 255), (251, 113, 133, 255), (255, 255, 255, 255), (250, 204, 21, 255), (192, 132, 252, 255)]
    w_box = x2 - x1
    num_f = int(w_box // 22)
    for i in range(num_f):
        fx = x1 + 14 + i * 22
        fy = y - 6 + (i % 2) * 6
        # 잎사귀
        draw.ellipse([fx - 10, fy + 4, fx + 10, fy + 16], fill=(34, 197, 94, 255), outline=(20, 83, 45, 255), width=2)
        # 꽃송이
        col = colors[i % len(colors)]
        draw.ellipse([fx - 8, fy - 8, fx + 8, fy + 8], fill=col, outline=INK, width=2)
        draw.ellipse([fx - 3, fy - 3, fx + 3, fy + 3], fill=(253, 224, 71, 255))

def draw_hanging_lantern(draw, x, y):
    """벽에 걸린 낭만적인 호롱불 램프"""
    draw.line([(x, y - 25), (x + 22, y - 25), (x + 22, y - 10)], fill=(30, 41, 59, 255), width=5)
    draw.polygon([(x + 10, y - 10), (x + 34, y - 10), (x + 28, y + 25), (x + 16, y + 25)], fill=(254, 240, 138, 255), outline=INK, width=3)
    draw.line([(x + 22, y - 10), (x + 22, y + 25)], fill=INK, width=2)
    draw.rounded_rectangle([x + 12, y + 23, x + 32, y + 30], radius=3, fill=(50, 40, 35, 255))

def draw_cobblestone_base(draw, x1, y1, x2, y2):
    """자연스러운 둥글둥글 호박돌 기초석 (삐져나가지 않고 단정하게 안착)"""
    draw.rounded_rectangle([x1, y1, x2, y2], radius=18, fill=(100, 90, 80, 255), outline=INK, width=4)
    stone_cols = [
        (180, 175, 170, 255), (150, 145, 140, 255), (130, 125, 120, 255),
        (195, 190, 185, 255), (160, 155, 150, 255)
    ]
    rows = 3
    row_h = (y2 - y1) / rows
    num_cols = 8
    col_w = (x2 - x1) / num_cols
    for r in range(rows):
        sy = y1 + r * row_h
        for c in range(num_cols):
            sx = x1 + c * col_w + (r % 2) * (col_w * 0.4)
            # 오른쪽 끝 클리핑
            ex = min(x2, sx + col_w * 0.92)
            if sx >= x2:
                continue
            scol = stone_cols[(r * 4 + c) % len(stone_cols)]
            draw.rounded_rectangle([sx + 3, sy + 3, ex - 3, sy + row_h - 2], radius=10, fill=scol, outline=INK, width=3)
            # 상단 하이라이트
            draw.arc([sx + 8, sy + 5, ex - 8, sy + row_h - 4], start=180, end=300, fill=(245, 245, 245, 180), width=3)

    # 이끼 군락
    moss_cols = [(101, 163, 13, 255), (77, 124, 15, 255), (132, 204, 22, 255)]
    w_total = x2 - x1
    for m in range(12):
        mx = x1 + 20 + m * (w_total - 40) / 11
        my = y2 - 4
        mr = 20 + (m % 3) * 6
        draw.ellipse([mx - mr, my - mr*0.5, mx + mr, my + mr*0.5], fill=moss_cols[m % len(moss_cols)])


# ==============================================================================
# [1] 1단계: 볏짚으로 만든 집 (Straw Cottage)
# ==============================================================================
def create_fairytale_straw_house():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 굴뚝 & 몽글몽글 동화 연기
    cdraw = ImageDraw.Draw(img)
    smokes = [(740, 110, 36, 210), (775, 75, 48, 170), (820, 40, 60, 130), (880, 15, 75, 80)]
    for sx, sy, sr, sa in smokes:
        cdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, sa))
    # 붉은 벽돌 굴뚝
    cdraw.rounded_rectangle([680, 150, 770, 460], radius=10, fill=(185, 90, 50, 255), outline=INK, width=5)
    cdraw.rounded_rectangle([665, 135, 785, 175], radius=8, fill=(140, 65, 35, 255), outline=INK, width=5)
    for cy in range(195, 450, 35):
        cdraw.line([(680, cy), (770, cy)], fill=INK, width=3)
        for cx in [710, 740]:
            cdraw.line([(cx, cy), (cx, cy + 35)], fill=INK, width=2)

    # 2. 호박돌 기단 (Foundation)
    fdraw = ImageDraw.Draw(img)
    draw_cobblestone_base(fdraw, 110, 1170, 914, 1280)
    draw_fairytale_mushroom(fdraw, 85, 1270, 60, 45, is_blue=False)
    draw_fairytale_mushroom(fdraw, 140, 1285, 42, 32, is_blue=True)
    draw_fairytale_mushroom(fdraw, 935, 1275, 58, 44, is_blue=False)
    draw_fairytale_mushroom(fdraw, 885, 1290, 40, 30, is_blue=False)

    # 3. 따스한 크림색 회벽 벽체 (Tudor style stucco + Timber)
    wdraw = ImageDraw.Draw(img)
    wdraw.rounded_rectangle([140, 500, 884, 1175], radius=24, fill=(254, 243, 199, 255), outline=INK, width=6)
    
    # 벽면 둥근 원목 기둥 (좌, 우, 중앙)
    wdraw.rounded_rectangle([130, 500, 175, 1175], radius=10, fill=(120, 53, 15, 255), outline=INK, width=5)
    wdraw.rounded_rectangle([849, 500, 894, 1175], radius=10, fill=(120, 53, 15, 255), outline=INK, width=5)
    wdraw.rounded_rectangle([485, 500, 535, 1175], radius=8, fill=(146, 64, 14, 255), outline=INK, width=4)
    # 벽면 가로 보 (Beam)
    wdraw.rounded_rectangle([130, 780, 894, 820], radius=6, fill=(146, 64, 14, 255), outline=INK, width=4)

    # 4. 좌측 따스한 격자 창문 & 꽃 화분
    # 창문 안쪽 따스한 촛불 빛무리
    add_radial_glow(img, 320, 640, 130, 120, (253, 224, 71, 160), (254, 240, 138, 90))
    wdraw = ImageDraw.Draw(img)
    wdraw.rounded_rectangle([210, 530, 430, 750], radius=32, fill=(254, 240, 138, 255), outline=INK, width=6)
    # 창틀 십자살
    wdraw.line([(320, 530), (320, 750)], fill=(120, 53, 15, 255), width=6)
    wdraw.line([(210, 640), (430, 640)], fill=(120, 53, 15, 255), width=6)
    # 창문 하이라이트 반사광
    wdraw.polygon([(230, 550), (290, 550), (230, 620)], fill=(255, 255, 255, 160))
    # 창문 아래 꽃 화분
    draw_flower_box(wdraw, 195, 750, 445, h=35)

    # 담쟁이 덩굴 (창문 옆을 타고 오름)
    ivy_pts = [(165, 1160), (160, 950), (175, 800), (160, 680), (180, 560)]
    for ip in range(len(ivy_pts) - 1):
        p1, p2 = ivy_pts[ip], ivy_pts[ip+1]
        wdraw.line([p1, p2], fill=(20, 83, 45, 255), width=5)
        wdraw.ellipse([p2[0]-10, p2[1]-8, p2[0]+10, p2[1]+8], fill=(34, 197, 94, 255), outline=INK, width=2)
        wdraw.ellipse([p2[0]-6, p2[1]-4, p2[0]+6, p2[1]+4], fill=(74, 222, 128, 255))

    # 5. 우측 아치형 원목 현관문
    # 문 아치
    door_box = [560, 550, 820, 1170]
    wdraw.rounded_rectangle([door_box[0]-10, door_box[1]-10, door_box[2]+10, door_box[3]+5], radius=70, fill=(90, 40, 12, 255), outline=INK, width=5)
    wdraw.rounded_rectangle(door_box, radius=65, fill=(180, 83, 9, 255), outline=INK, width=5)
    # 문 판자 세로 분할선
    for dx in [625, 690, 755]:
        wdraw.line([(dx, door_box[1] + 15), (dx, door_box[3])], fill=(120, 53, 15, 255), width=3)
    # 문 돌쩌귀 (철제 힌지 2개)
    for hy in [660, 980]:
        wdraw.rounded_rectangle([550, hy, 630, hy + 22], radius=6, fill=(30, 41, 59, 255), outline=INK, width=3)
        wdraw.ellipse([620, hy + 4, 632, hy + 18], fill=(148, 163, 184, 255))
    # 황금 둥근 손잡이
    wdraw.ellipse([755, 835, 785, 865], fill=(245, 158, 11, 255), outline=INK, width=4)
    wdraw.ellipse([760, 840, 775, 855], fill=(254, 240, 138, 255))
    # 현관 앞 따스한 호롱불 램프
    add_radial_glow(img, 510, 720, 90, 90, (253, 224, 71, 180), (254, 240, 138, 80))
    wdraw = ImageDraw.Draw(img)
    draw_hanging_lantern(wdraw, 500, 720)

    # 현관문 앞 디딤돌 테라스 (툇마루 발판)
    wdraw.rounded_rectangle([100, 1120, 924, 1175], radius=12, fill=(217, 119, 6, 255), outline=INK, width=5)
    for bx in range(160, 880, 80):
        wdraw.line([(bx, 1120), (bx, 1175)], fill=(146, 64, 14, 255), width=3)
    wdraw.line([(105, 1126), (919, 1126)], fill=(251, 191, 36, 255), width=3)

    # 6. 황금빛 동화 버섯 곡선 볏짚 지붕 (Straw Thatched Roof)
    # 지붕 그림자 (벽체 위 드롭섀도)
    rdraw = ImageDraw.Draw(img)
    rdraw.chord([40, 200, 984, 600], start=0, end=180, fill=(0, 0, 0, 45))

    # 메인 지붕 외형 (풍성한 버섯 모양 곡선)
    roof_pts = [
        (60, 520), (140, 360), (300, 220), (512, 170),
        (724, 220), (884, 360), (964, 520),
        (920, 545), (840, 530), (760, 550), (680, 535),
        (600, 550), (512, 535), (424, 550), (344, 535),
        (264, 550), (184, 530), (100, 545)
    ]
    # 지붕 밑면 음영 레이어
    draw_polygon_aa(img, roof_pts, fill_color=(217, 119, 6, 255), outline_color=INK, outline_width=6)
    
    # 지붕 메인 황금 볏짚 레이어 (살짝 올려서 입체감 형성)
    roof_top_pts = [
        (70, 505), (145, 350), (305, 215), (512, 165),
        (719, 215), (879, 350), (954, 505),
        (915, 525), (835, 510), (755, 530), (675, 515),
        (595, 530), (512, 515), (429, 530), (349, 515),
        (269, 530), (189, 510), (105, 525)
    ]
    draw_polygon_aa(img, roof_top_pts, fill_color=(245, 158, 11, 255), outline_color=INK, outline_width=5)

    # 지붕 상단 햇살 하이라이트 (포근하고 눈부신 황금빛)
    roof_hi_pts = [
        (130, 450), (220, 310), (340, 220), (512, 185),
        (684, 220), (804, 310), (894, 450),
        (780, 380), (640, 320), (512, 300), (384, 320), (244, 380)
    ]
    draw_polygon_aa(img, roof_hi_pts, fill_color=(252, 211, 77, 230))

    # 볏짚 질감 라인 (섬세하고 자연스러운 동화풍 스트로크)
    tdraw = ImageDraw.Draw(img)
    for ly in [340, 410, 480]:
        span_w = 400 + (ly - 300) * 1.5
        for sx in np.linspace(512 - span_w, 512 + span_w, 36):
            rand_len = 22 + (int(sx) % 7) * 4
            rand_tilt = (int(sx) % 5 - 2) * 4
            tdraw.line([(sx, ly), (sx + rand_tilt, ly + rand_len)], fill=(180, 83, 9, 220), width=3)
            tdraw.line([(sx + 1, ly), (sx + rand_tilt + 1, ly + rand_len)], fill=(254, 240, 138, 180), width=2)

    # 처마 끝 솔가지/지푸라기 드리움 (Fringe overhang)
    for fx in range(80, 950, 16):
        fy = 515 + math.sin(fx * 0.05) * 10
        flen = 24 + (fx % 6) * 6
        tdraw.line([(fx, fy), (fx + (fx % 5 - 2)*3, fy + flen)], fill=(217, 119, 6, 255), width=3)
        tdraw.line([(fx + 1, fy), (fx + (fx % 5 - 2)*3 + 1, fy + flen)], fill=(253, 224, 71, 255), width=2)

    # 7. 지붕 꼭대기 볏짚 용마름 (Ridge Cap) 볏짚단 묶음
    cap_box = [270, 100, 754, 185]
    tdraw.rounded_rectangle(cap_box, radius=40, fill=(217, 119, 6, 255), outline=INK, width=6)
    tdraw.rounded_rectangle([cap_box[0]+4, cap_box[1]+4, cap_box[2]-4, cap_box[1]+35], radius=20, fill=(251, 191, 36, 255))
    # X자 새끼줄 꼬임 장식 (Rustic Twine)
    for cx in range(305, 730, 42):
        tdraw.line([(cx - 16, 105), (cx + 16, 180)], fill=(120, 53, 15, 255), width=4)
        tdraw.line([(cx + 16, 105), (cx - 16, 180)], fill=(120, 53, 15, 255), width=4)
        tdraw.line([(cx, 95), (cx, 190)], fill=(254, 243, 199, 200), width=2)

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


# ==============================================================================
# [2] 2단계: 통나무로 만든 집 (Fairytale Log Chalet)
# ==============================================================================
def create_fairytale_wood_house():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 굴뚝 & 연기
    cdraw = ImageDraw.Draw(img)
    smokes = [(220, 100, 36, 210), (185, 65, 48, 170), (145, 30, 60, 130), (95, 5, 75, 80)]
    for sx, sy, sr, sa in smokes:
        cdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, sa))
    # 호박돌 굴뚝
    cdraw.rounded_rectangle([180, 130, 270, 450], radius=12, fill=(120, 113, 108, 255), outline=INK, width=5)
    cdraw.rounded_rectangle([165, 115, 285, 155], radius=8, fill=(87, 83, 78, 255), outline=INK, width=5)
    for cy in range(165, 430, 36):
        cdraw.line([(180, cy), (270, cy)], fill=INK, width=3)
        cdraw.line([(225, cy), (225, cy + 36)], fill=INK, width=2)

    # 2. 기초 호박돌 (Cobblestone Foundation)
    fdraw = ImageDraw.Draw(img)
    draw_cobblestone_base(fdraw, 90, 1170, 934, 1280)
    draw_fairytale_mushroom(fdraw, 70, 1270, 60, 45, is_blue=False)
    draw_fairytale_mushroom(fdraw, 125, 1285, 42, 32, is_blue=True)
    draw_fairytale_mushroom(fdraw, 950, 1275, 58, 44, is_blue=False)
    draw_fairytale_mushroom(fdraw, 900, 1290, 40, 30, is_blue=True)

    # 3. 1층 통나무 벽체 (Warm Honey Rounded Logs)
    ldraw = ImageDraw.Draw(img)
    log_h = 58
    y_start = 740
    y_end = 1175
    num_logs = int((y_end - y_start) // log_h) + 1
    
    for i in range(num_logs):
        ly = y_start + i * log_h
        lh = min(log_h, y_end - ly)
        if lh < 30:
            continue
        # 통나무 몸체 (둥글고 포근한 하이라이트/쉐도우)
        ldraw.rounded_rectangle([110, ly, 914, ly + lh], radius=16, fill=(180, 83, 9, 255), outline=INK, width=4)
        # 상단 원통형 하이라이트
        ldraw.line([(118, ly + 8), (906, ly + 8)], fill=(245, 158, 11, 255), width=6)
        ldraw.line([(120, ly + 14), (904, ly + 14)], fill=(251, 191, 36, 180), width=3)
        # 하단 원통형 음영
        ldraw.line([(118, ly + lh - 5), (906, ly + lh - 5)], fill=(120, 53, 15, 255), width=5)

        # 좌우 통나무 나이테 단면 (Log End Grain Circles)
        for cx in [110, 914]:
            ldraw.ellipse([cx - 24, ly + 3, cx + 24, ly + lh - 3], fill=(217, 119, 6, 255), outline=INK, width=4)
            if lh >= 38:
                ldraw.ellipse([cx - 15, ly + 9, cx + 15, ly + lh - 9], fill=(180, 83, 9, 255), outline=INK_MED, width=2)
            if lh >= 48:
                ldraw.ellipse([cx - 6, ly + 16, cx + 6, ly + lh - 16], fill=(146, 64, 14, 255))

    # 4. 1층 좌측 격자 창문 & 꽃 화분
    add_radial_glow(img, 310, 880, 120, 110, (253, 224, 71, 160), (254, 240, 138, 90))
    ldraw = ImageDraw.Draw(img)
    ldraw.rounded_rectangle([210, 790, 410, 970], radius=24, fill=(254, 240, 138, 255), outline=INK, width=6)
    ldraw.line([(310, 790), (310, 970)], fill=(120, 53, 15, 255), width=6)
    ldraw.line([(210, 880), (410, 880)], fill=(120, 53, 15, 255), width=6)
    ldraw.polygon([(225, 805), (280, 805), (225, 860)], fill=(255, 255, 255, 160))
    draw_flower_box(ldraw, 195, 970, 425, h=35)

    # 5. 1층 우측 원목 문 & 호롱불
    door_box = [550, 810, 810, 1170]
    ldraw.rounded_rectangle([door_box[0]-8, door_box[1]-8, door_box[2]+8, door_box[3]+4], radius=40, fill=(90, 40, 12, 255), outline=INK, width=5)
    ldraw.rounded_rectangle(door_box, radius=35, fill=(146, 64, 14, 255), outline=INK, width=5)
    for dx in [615, 680, 745]:
        ldraw.line([(dx, door_box[1] + 10), (dx, door_box[3])], fill=(90, 40, 12, 255), width=3)
    # 철제 경첩
    for hy in [870, 1060]:
        ldraw.rounded_rectangle([540, hy, 620, hy + 22], radius=5, fill=(30, 41, 59, 255), outline=INK, width=3)
        ldraw.ellipse([610, hy + 4, 622, hy + 18], fill=(148, 163, 184, 255))
    # 황금 문고리
    ldraw.ellipse([745, 980, 775, 1010], fill=(245, 158, 11, 255), outline=INK, width=4)
    ldraw.ellipse([750, 985, 765, 1000], fill=(254, 240, 138, 255))
    
    add_radial_glow(img, 500, 900, 85, 85, (253, 224, 71, 180), (254, 240, 138, 80))
    ldraw = ImageDraw.Draw(img)
    draw_hanging_lantern(ldraw, 490, 900)

    # 6. 2층 분할 발코니 데크 (둘째 돼지가 올라서는 낭만적인 원목 테라스 난간)
    ldraw.rounded_rectangle([90, 710, 934, 755], radius=10, fill=(120, 53, 15, 255), outline=INK, width=5)
    ldraw.line([(95, 718), (929, 718)], fill=(217, 119, 6, 255), width=4)
    # 발코니 X자 격자 지지대 난간
    for rx in range(120, 900, 65):
        ldraw.line([(rx, 710), (rx + 45, 755)], fill=(78, 32, 8, 255), width=3)
        ldraw.line([(rx + 45, 710), (rx, 755)], fill=(78, 32, 8, 255), width=3)

    # 7. 2층 통나무 벽체
    y2_start = 450
    y2_end = 715
    num2_logs = int((y2_end - y2_start) // log_h) + 1
    for i in range(num2_logs):
        ly = y2_start + i * log_h
        lh = min(log_h, y2_end - ly)
        if lh < 30:
            continue
        ldraw.rounded_rectangle([150, ly, 874, ly + lh], radius=16, fill=(180, 83, 9, 255), outline=INK, width=4)
        ldraw.line([(158, ly + 8), (866, ly + 8)], fill=(245, 158, 11, 255), width=5)
        ldraw.line([(158, ly + lh - 5), (866, ly + lh - 5)], fill=(120, 53, 15, 255), width=4)
        for cx in [150, 874]:
            ldraw.ellipse([cx - 20, ly + 3, cx + 20, ly + lh - 3], fill=(217, 119, 6, 255), outline=INK, width=3)

    # 2층 중앙 하트 덧문 다락방 창문 (둘째 돼지 룸)
    add_radial_glow(img, 512, 570, 110, 100, (253, 224, 71, 160), (254, 240, 138, 90))
    ldraw = ImageDraw.Draw(img)
    ldraw.rounded_rectangle([420, 480, 604, 660], radius=24, fill=(254, 240, 138, 255), outline=INK, width=5)
    ldraw.line([(512, 480), (512, 660)], fill=(120, 53, 15, 255), width=5)
    ldraw.line([(420, 570), (604, 570)], fill=(120, 53, 15, 255), width=5)
    # 좌우 하트 모양 덧문 (Shutters)
    for sx, is_left in [(360, True), (604, False)]:
        ldraw.rounded_rectangle([sx, 480, sx + 60, 660], radius=8, fill=(146, 64, 14, 255), outline=INK, width=4)
        hx = sx + 30
        hy = 560
        # 하트 모양 음각
        ldraw.polygon([(hx, hy + 12), (hx - 12, hy - 4), (hx - 6, hy - 14), (hx, hy - 8), (hx + 6, hy - 14), (hx + 12, hy - 4)], fill=(254, 243, 199, 255))
    draw_flower_box(ldraw, 395, 660, 629, h=30)

    # 8. 통나무 오두막 박공 너와 지붕 (Wooden Shingle Gable Roof)
    # 지붕 처마 드롭섀도
    rdraw = ImageDraw.Draw(img)
    rdraw.polygon([(40, 470), (512, 170), (984, 470), (512, 490)], fill=(0, 0, 0, 40))

    # 너와 지붕 기와 레이어 (스위스 샬레풍 원목 기와)
    rows_shingles = [
        (430, 40, 984, 14),
        (370, 100, 924, 13),
        (310, 170, 854, 11),
        (250, 250, 774, 9),
        (190, 340, 684, 7),
        (135, 430, 594, 5)
    ]
    shingle_cols = [(146, 64, 14, 255), (180, 83, 9, 255), (120, 53, 15, 255), (194, 65, 12, 255)]
    for sy, sx1, sx2, count in rows_shingles:
        sw = (sx2 - sx1) / count
        for sc in range(count):
            bx = sx1 + sc * sw
            col = shingle_cols[(int(bx) + sy) % len(shingle_cols)]
            rdraw.rounded_rectangle([bx + 2, sy, bx + sw - 2, sy + 65], radius=10, fill=col, outline=INK, width=4)
            # 기와 하단 하이라이트
            rdraw.line([(bx + 8, sy + 60), (bx + sw - 8, sy + 60)], fill=(251, 191, 36, 180), width=3)

    # 지붕 용마루 빔 (Ridge Beam)
    rdraw.rounded_rectangle([420, 110, 604, 160], radius=14, fill=(120, 53, 15, 255), outline=INK, width=5)
    rdraw.line([(430, 120), (594, 120)], fill=(217, 119, 6, 255), width=4)

    # 지붕 꼭대기 바람개비/깃발 (첫째 돼지 깃발)
    rdraw.line([(512, 35), (512, 115)], fill=(30, 41, 59, 255), width=6)
    rdraw.ellipse([502, 25, 522, 45], fill=(245, 158, 11, 255), outline=INK, width=3)
    rdraw.polygon([(512, 40), (610, 65), (512, 90)], fill=(239, 68, 68, 255), outline=INK, width=4)
    rdraw.polygon([(512, 48), (580, 65), (512, 82)], fill=(252, 165, 165, 255))

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


# ==============================================================================
# [3] 3단계: 성같은 벽돌집 (Fairytale Royal Brick Castle)
# ==============================================================================
def create_fairytale_brick_house():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 굴뚝 & 벽난로 연기
    cdraw = ImageDraw.Draw(img)
    smokes = [(720, 80, 36, 210), (760, 45, 48, 170), (810, 15, 60, 130), (870, -10, 75, 80)]
    for sx, sy, sr, sa in smokes:
        cdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, sa))
    # 붉은 성채 굴뚝
    cdraw.rounded_rectangle([680, 110, 770, 330], radius=10, fill=(185, 28, 28, 255), outline=INK, width=5)
    cdraw.rounded_rectangle([665, 95, 785, 135], radius=8, fill=(153, 27, 27, 255), outline=INK, width=5)

    # 2. 기초 대리석/화강암 기단 (Granite Ashlar Base)
    bdraw = ImageDraw.Draw(img)
    draw_cobblestone_base(bdraw, 80, 1160, 944, 1280)
    draw_fairytale_mushroom(bdraw, 65, 1265, 60, 45, is_blue=False)
    draw_fairytale_mushroom(bdraw, 120, 1280, 42, 32, is_blue=True)
    draw_fairytale_mushroom(bdraw, 960, 1270, 58, 44, is_blue=False)
    draw_fairytale_mushroom(bdraw, 910, 1285, 40, 30, is_blue=True)

    # 3. 1층 견고한 테라코타 벽돌 벽체 (Terracotta Castle Masonry)
    bdraw.rounded_rectangle([110, 680, 914, 1170], radius=18, fill=(185, 28, 28, 255), outline=INK, width=6)
    
    # 벽돌 디테일 (자연스러운 텍스처와 음영)
    brick_cols = [(220, 38, 38, 255), (185, 28, 28, 255), (153, 27, 27, 255), (239, 68, 68, 255)]
    np.random.seed(123)
    b_h = 32
    b_w = 68
    for r in range(int((1170 - 680) // b_h)):
        by = 685 + r * b_h
        for c in range(int((914 - 110) // b_w) + 1):
            bx = 115 + c * b_w + (r % 2) * (b_w // 2)
            ex = min(909, bx + b_w - 4)
            if bx >= 909:
                continue
            bcol = brick_cols[(r * 5 + c) % len(brick_cols)]
            bdraw.rounded_rectangle([bx, by, ex, by + b_h - 4], radius=4, fill=bcol)
            # 벽돌 상단 하이라이트 & 하단 음영
            bdraw.line([(bx + 2, by + 1), (ex - 2, by + 1)], fill=(254, 202, 202, 140), width=2)
            bdraw.line([(bx + 2, by + b_h - 5), (ex - 2, by + b_h - 5)], fill=(127, 29, 29, 200), width=2)

    # 좌우 석조 모루돌 (Stone Quoins) - 성채의 웅장함 표현
    for qx, is_left in [(110, True), (864, False)]:
        for qi in range(15):
            qy = 685 + qi * 32
            qw = 48 if (qi % 2 == 0) else 34
            rx = qx if is_left else (qx + 50 - qw)
            bdraw.rounded_rectangle([rx, qy, rx + qw, qy + 28], radius=6, fill=(203, 213, 225, 255), outline=INK, width=3)
            bdraw.line([(rx + 4, qy + 4), (rx + qw - 4, qy + 4)], fill=(248, 250, 252, 220), width=2)

    # 4. 1층 좌측 아치형 성채 창문 & 철제 창살
    add_radial_glow(img, 320, 840, 130, 130, (253, 224, 71, 160), (254, 240, 138, 90))
    bdraw = ImageDraw.Draw(img)
    # 석조 아치 프레임
    bdraw.chord([200, 710, 440, 950], start=180, end=360, fill=(148, 163, 184, 255), outline=INK, width=6)
    bdraw.rectangle([200, 830, 440, 970], fill=(148, 163, 184, 255), outline=INK, width=6)
    # 황금빛 유리창
    bdraw.chord([220, 730, 420, 930], start=180, end=360, fill=(254, 240, 138, 255), outline=INK, width=4)
    bdraw.rectangle([220, 830, 420, 950], fill=(254, 240, 138, 255), outline=INK, width=4)
    # 철제 방범 창살 (Iron Grille)
    for gx in [265, 320, 375]:
        bdraw.line([(gx, 740), (gx, 950)], fill=(30, 41, 59, 255), width=5)
    bdraw.line([(220, 850), (420, 850)], fill=(30, 41, 59, 255), width=5)

    # 5. 1층 우측 웅장한 아치형 철갑 성문 (Grand Castle Gate)
    gate_box = [540, 740, 820, 1170]
    # 석조 게이트 아치 림
    bdraw.chord([gate_box[0]-16, gate_box[1]-16, gate_box[2]+16, gate_box[1]+260], start=180, end=360, fill=(100, 116, 139, 255), outline=INK, width=6)
    bdraw.rectangle([gate_box[0]-16, gate_box[1]+120, gate_box[2]+16, gate_box[3]+4], fill=(100, 116, 139, 255), outline=INK, width=6)
    # 짙은 남색 강철 게이트
    bdraw.chord([gate_box[0], gate_box[1], gate_box[2], gate_box[1]+280], start=180, end=360, fill=(30, 41, 59, 255), outline=INK, width=5)
    bdraw.rectangle([gate_box[0], gate_box[1]+140, gate_box[2], gate_box[3]], fill=(30, 41, 59, 255), outline=INK, width=5)
    # 리벳 강철 띠 (Iron Bands & Rivets)
    for ry in [860, 980, 1100]:
        bdraw.rectangle([gate_box[0]+4, ry, gate_box[2]-4, ry + 24], fill=(51, 65, 85, 255), outline=INK, width=3)
        for rx in range(gate_box[0]+25, gate_box[2]-15, 38):
            bdraw.ellipse([rx - 5, ry + 6, rx + 5, ry + 16], fill=(226, 232, 240, 255), outline=INK, width=1)
    # 황금 사자상 문고리
    bdraw.ellipse([665, 995, 695, 1025], fill=(245, 158, 11, 255), outline=INK, width=4)
    bdraw.ellipse([670, 1000, 685, 1015], fill=(254, 240, 138, 255))
    
    # 6. 중간 성벽 분할 대리석 몰딩 (둘째 돼지 테라스)
    bdraw.rounded_rectangle([90, 650, 934, 695], radius=10, fill=(100, 116, 139, 255), outline=INK, width=5)
    bdraw.line([(95, 658), (929, 658)], fill=(203, 213, 225, 255), width=4)
    # 깃발 펜던트 장식 (Triangular Pennants)
    for c_idx in range(6):
        cx = 160 + c_idx * 120
        bdraw.polygon([(cx, 695), (cx + 50, 695), (cx + 25, 745)], fill=(30, 58, 138, 255), outline=INK, width=3)
        bdraw.polygon([(cx + 8, 695), (cx + 42, 695), (cx + 25, 735)], fill=(59, 130, 246, 255))

    # 7. 2층 상부 벽돌 벽체
    bdraw.rounded_rectangle([150, 340, 874, 660], radius=14, fill=(185, 28, 28, 255), outline=INK, width=6)
    for r in range(int((660 - 340) // b_h)):
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
    add_radial_glow(img, 512, 490, 110, 110, (253, 224, 71, 160), (254, 240, 138, 90))
    bdraw = ImageDraw.Draw(img)
    bdraw.chord([430, 400, 594, 560], start=180, end=360, fill=(148, 163, 184, 255), outline=INK, width=5)
    bdraw.rectangle([430, 480, 594, 580], fill=(148, 163, 184, 255), outline=INK, width=5)
    bdraw.chord([445, 415, 579, 545], start=180, end=360, fill=(254, 240, 138, 255), outline=INK, width=4)
    bdraw.rectangle([445, 480, 579, 565], fill=(254, 240, 138, 255), outline=INK, width=4)
    bdraw.line([(512, 415), (512, 565)], fill=(120, 53, 15, 255), width=5)
    bdraw.line([(445, 490), (579, 490)], fill=(120, 53, 15, 255), width=5)

    # 8. 성채 꼭대기 요새 치성 (Crenelated Battlements) - 첫째 돼지 지휘대
    bdraw.rounded_rectangle([80, 300, 944, 350], radius=10, fill=(100, 116, 139, 255), outline=INK, width=5)
    bdraw.line([(85, 308), (939, 308)], fill=(203, 213, 225, 255), width=4)
    
    # 톱니 치성 (Merlons) 5개
    num_teeth = 5
    tw = 90
    gap = 50
    st_x = 150
    for t in range(num_teeth):
        tx = st_x + t * (tw + gap)
        bdraw.rounded_rectangle([tx, 200, tx + tw, 310], radius=8, fill=(185, 28, 28, 255), outline=INK, width=5)
        # 톱니 상판 대리석 캡
        bdraw.rounded_rectangle([tx - 6, 190, tx + tw + 6, 212], radius=6, fill=(148, 163, 184, 255), outline=INK, width=3)
        bdraw.line([(tx, 196), (tx + tw, 196)], fill=(241, 245, 249, 220), width=2)

    # 좌우 코너 첨탑 망루 터렛 (Turrets with Conical Roofs)
    for t_cx in [120, 904]:
        # 원형 터렛 바디
        bdraw.rounded_rectangle([t_cx - 50, 180, t_cx + 50, 330], radius=12, fill=(185, 28, 28, 255), outline=INK, width=5)
        # 고딕 원뿔형 슬레이트 지붕
        bdraw.polygon([(t_cx, 60), (t_cx - 65, 190), (t_cx + 65, 190)], fill=(30, 58, 138, 255), outline=INK, width=5)
        bdraw.polygon([(t_cx, 75), (t_cx - 20, 185), (t_cx + 40, 185)], fill=(59, 130, 246, 255))
        # 황금 피니얼 보주 (Golden Finial)
        bdraw.ellipse([t_cx - 10, 50, t_cx + 10, 70], fill=(245, 158, 11, 255), outline=INK, width=3)
        bdraw.ellipse([t_cx - 5, 54, t_cx + 5, 64], fill=(254, 240, 138, 255))

    # 9. 성채 중앙 황금 왕실 깃발 (Royal Crest Banner)
    bdraw.line([(512, 30), (512, 190)], fill=(30, 41, 59, 255), width=6)
    bdraw.ellipse([502, 20, 522, 40], fill=(245, 158, 11, 255), outline=INK, width=3)
    bdraw.polygon([(512, 45), (640, 80), (512, 115)], fill=(245, 158, 11, 255), outline=INK, width=4)
    bdraw.polygon([(512, 55), (610, 80), (512, 105)], fill=(253, 224, 71, 255))

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


if __name__ == '__main__':
    print("Generating fairytale storybook houses v3...")
    
    h1 = create_fairytale_straw_house()
    h1.save('assets/house_straw.png', 'PNG')
    h1.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/v3_house_straw.png', 'PNG')
    print("Straw house v3 done!")

    h2 = create_fairytale_wood_house()
    h2.save('assets/house_wood.png', 'PNG')
    h2.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/v3_house_wood.png', 'PNG')
    print("Wood house v3 done!")

    h3 = create_fairytale_brick_house()
    h3.save('assets/house_brick.png', 'PNG')
    h3.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/v3_house_brick.png', 'PNG')
    print("Brick house v3 done!")

    print("All 3 fairytale storybook houses v3 generated successfully!")
