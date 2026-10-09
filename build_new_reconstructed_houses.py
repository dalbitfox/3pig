# -*- coding: utf-8 -*-
"""
build_new_reconstructed_houses.py
아기돼지 삼형제 신축 주택 3종 초고화질 렌더러
1. 짚으로 만든 옛날 느낌의 따뜻한 집 (황토 흙벽, 둥근 볏짚 지붕, 전통 창호문, 툇마루, 장독대, 호박, 옥수수)
2. 통나무로 만든 아늑한 집 (진짜 원목 통나무 엇갈려 쌓음, 돌 굴뚝 연기, 2층 발코니, 벽난로 온기 창문)
3. 벽과 콘크리트로 만든 성 같은 집 (견고한 콘크리트 패널 방벽, 철갑 리벳 성문, 2층 사격 총안 테라스, 최상층 성벽 치성/망루, 요새 조명)

캔버스: 1024 x 1360 (슈퍼샘플링) -> 512 x 680 (Lanczos)
"""

import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import cv2

SW, SH = 1024, 1360
FW, FH = 512, 680

INK = (45, 25, 15, 255)
INK_MED = (75, 42, 22, 220)
INK_LIGHT = (110, 65, 38, 160)

def draw_poly_aa(img, pts, fill, outline=None, width=0):
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    cv_img = np.array(overlay)
    cv_pts = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
    cv2.fillPoly(cv_img, [cv_pts], fill)
    if outline and width > 0:
        cv2.polylines(cv_img, [cv_pts], isClosed=True, color=outline, thickness=width, lineType=cv2.LINE_AA)
    layer = Image.fromarray(cv_img)
    img.alpha_composite(layer)

def add_warm_glow(img, cx, cy, rx, ry, inner_a=200, outer_a=95, glow_col=(254, 240, 138)):
    glow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([cx - rx*1.25, cy - ry*1.25, cx + rx*1.25, cy + ry*1.25], fill=(*glow_col[:3], outer_a))
    gdraw.ellipse([cx - rx*0.65, cy - ry*0.65, cx + rx*0.65, cy + ry*0.65], fill=(253, 224, 71, inner_a))
    glow = glow.filter(ImageFilter.GaussianBlur(int(rx * 0.45)))
    img.alpha_composite(glow)

def draw_fairytale_foundation(draw, x1, y1, x2, y2, is_concrete=False):
    """자연스러운 기초 기단부 (자연석 또는 콘크리트)"""
    if is_concrete:
        draw.rounded_rectangle([x1, y1, x2, y2], radius=14, fill=(148, 163, 184, 255), outline=INK, width=5)
        # 콘크리트 패널 줄눈 및 리벳 앵커 볼트
        for py in range(y1 + 35, y2, 35):
            draw.line([(x1 + 6, py), (x2 - 6, py)], fill=(71, 85, 105, 255), width=3)
        for px in range(x1 + 80, x2 - 40, 110):
            draw.line([(px, y1 + 4), (px, y2 - 4)], fill=(71, 85, 105, 255), width=2)
            draw.ellipse([px - 6, y1 + 18, px + 6, y1 + 30], fill=(51, 65, 85, 255), outline=INK, width=2)
            draw.ellipse([px - 6, y2 - 28, px + 6, y2 - 16], fill=(51, 65, 85, 255), outline=INK, width=2)
    else:
        draw.rounded_rectangle([x1, y1, x2, y2], radius=18, fill=(100, 90, 80, 255), outline=INK, width=5)
        stone_cols = [(195, 190, 185, 255), (165, 158, 150, 255), (145, 138, 130, 255), (210, 205, 198, 255)]
        rows = 3
        row_h = (y2 - y1) / rows
        num_cols = 8
        col_w = (x2 - x1) / num_cols
        for r in range(rows):
            sy = y1 + r * row_h
            for c in range(num_cols):
                sx = x1 + c * col_w + (r % 2) * (col_w * 0.4)
                ex = min(x2 - 4, sx + col_w * 0.92)
                if sx >= x2 - 8: continue
                scol = stone_cols[(r * 4 + c) % len(stone_cols)]
                draw.rounded_rectangle([sx + 3, sy + 3, ex, sy + row_h - 2], radius=10, fill=scol, outline=INK, width=3)
                draw.arc([sx + 8, sy + 5, ex - 6, sy + row_h - 4], start=180, end=300, fill=(250, 250, 250, 190), width=3)

    # 파릇파릇 풀잎 클러스터
    moss_cols = [(101, 163, 13, 255), (77, 124, 15, 255), (132, 204, 22, 255)]
    w_total = x2 - x1
    for m in range(16):
        mx = x1 + 12 + m * (w_total - 24) / 15
        my = y2 - 2
        mr = 20 + (m % 3) * 6
        draw.ellipse([mx - mr, my - mr*0.45, mx + mr, my + mr*0.45], fill=moss_cols[m % len(moss_cols)])

def draw_chimney_and_smoke(draw, cx, cy, cw=90, ch=280, style='stone'):
    """스타일별 굴뚝 (clay/stone/concrete) & 뭉게구름 연기"""
    smokes = [
        (cx + 45, cy - 35, 38, 220),
        (cx + 80, cy - 85, 52, 180),
        (cx + 125, cy - 145, 68, 140),
        (cx + 180, cy - 215, 86, 95)
    ]
    for sx, sy, sr, sa in smokes:
        draw.ellipse([sx - sr, sy - sr*0.88, sx + sr, sy + sr*0.88], fill=(255, 255, 255, sa), outline=(226, 232, 240, sa), width=2)
    
    if style == 'clay':
        body_col = (194, 95, 30, 255)
        cap_col = (150, 70, 20, 255)
        draw.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=16, fill=body_col, outline=INK, width=5)
        draw.rounded_rectangle([cx - 12, cy - 18, cx + cw + 12, cy + 18], radius=12, fill=cap_col, outline=INK, width=5)
        # 흙 질감 라인
        for ly in range(cy + 40, cy + ch - 10, 45):
            draw.line([(cx + 6, ly), (cx + cw - 6, ly)], fill=(130, 60, 15, 255), width=3)
    elif style == 'stone':
        draw.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=10, fill=(120, 115, 110, 255), outline=INK, width=5)
        draw.rounded_rectangle([cx - 15, cy - 20, cx + cw + 15, cy + 20], radius=8, fill=(90, 85, 80, 255), outline=INK, width=5)
        # 거친 돌무더기
        stone_cols = [(160, 155, 150, 255), (135, 130, 125, 255), (180, 175, 170, 255)]
        for r in range(cy + 25, cy + ch - 15, 32):
            for c in range(cx + 4, cx + cw - 12, 38):
                draw.rounded_rectangle([c, r, min(cx + cw - 4, c + 34), r + 26], radius=6, fill=stone_cols[(r+c)%3], outline=INK, width=2)
    elif style == 'concrete':
        draw.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=6, fill=(148, 163, 184, 255), outline=INK, width=5)
        draw.rounded_rectangle([cx - 14, cy - 18, cx + cw + 14, cy + 18], radius=6, fill=(100, 116, 139, 255), outline=INK, width=5)
        for ly in range(cy + 40, cy + ch - 10, 45):
            draw.line([(cx + 4, ly), (cx + cw - 4, ly)], fill=(71, 85, 105, 255), width=3)
            draw.ellipse([cx + 15, ly - 8, cx + 25, ly + 2], fill=(51, 65, 85, 255))
            draw.ellipse([cx + cw - 25, ly - 8, cx + cw - 15, ly + 2], fill=(51, 65, 85, 255))

# ==============================================================================
# [1] 1단계: 짚으로 만든 옛날 느낌의 따뜻한 집 (Traditional Cozy Thatched House)
# ==============================================================================
def create_traditional_thatched_house():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 옛날식 흙 굴뚝 & 몽글몽글 연기
    cdraw = ImageDraw.Draw(img)
    draw_chimney_and_smoke(cdraw, 700, 160, cw=80, ch=320, style='clay')

    # 2. 기초 돌담 기단부 (Y = 1170 ~ 1280)
    fdraw = ImageDraw.Draw(img)
    draw_fairytale_foundation(fdraw, 80, 1170, 944, 1280)

    # 전통 장독대 (우측 호박돌 위에 놓인 반질반질 옹기 항아리 3개)
    onggi_list = [
        (850, 1210, 56, 68),
        (795, 1225, 46, 54),
        (895, 1230, 40, 48)
    ]
    for ox, oy, ow, oh in onggi_list:
        # 항아리 몸체 (검붉은 옻칠 옹기)
        fdraw.ellipse([ox - ow/2, oy - oh/2, ox + ow/2, oy + oh/2], fill=(45, 25, 18, 255), outline=INK, width=3)
        # 항아리 뚜껑
        fdraw.ellipse([ox - ow*0.48, oy - oh*0.55, ox + ow*0.48, oy - oh*0.35], fill=(70, 40, 28, 255), outline=INK, width=3)
        fdraw.ellipse([ox - ow*0.18, oy - oh*0.62, ox + ow*0.18, oy - oh*0.48], fill=(95, 55, 38, 255), outline=INK, width=2)
        # 하이라이트 광택
        fdraw.arc([ox - ow*0.35, oy - oh*0.3, ox + ow*0.1, oy + oh*0.25], start=140, end=230, fill=(180, 120, 90, 220), width=3)

    # 3. 1층 넓은 툇마루 (Pigs standing deck at Y = 1010 ~ 1175)
    tdraw = ImageDraw.Draw(img)
    deck_y = 1010
    # 마루 상판 (정겨운 원목 판자)
    tdraw.rounded_rectangle([75, deck_y, 949, 1175], radius=16, fill=(194, 105, 35, 255), outline=INK, width=5)
    # 마루 널빤지 세로선
    for bx in range(130, 910, 72):
        tdraw.line([(bx, deck_y), (bx, 1175)], fill=(130, 60, 15, 255), width=3)
    # 상판 하이라이트
    tdraw.line([(80, deck_y + 6), (944, deck_y + 6)], fill=(251, 191, 36, 255), width=4)

    # 4. 정겨운 황토 흙벽 (Warm Ochre Mud Wall: Y: 460 ~ 1015)
    wdraw = ImageDraw.Draw(img)
    # 따스한 황토빛 베이스 벽체
    wdraw.rounded_rectangle([120, 460, 904, 1015], radius=26, fill=(217, 119, 6, 255), outline=INK, width=6)
    wdraw.rounded_rectangle([126, 466, 898, 1009], radius=22, fill=(245, 158, 11, 255))
    
    # 흙벽의 미세한 짚풀 텍스처
    np.random.seed(42)
    for _ in range(80):
        rx = np.random.randint(140, 880)
        ry = np.random.randint(480, 1000)
        rlen = np.random.randint(8, 20)
        wdraw.line([(rx, ry), (rx + rlen, ry + np.random.randint(-4, 5))], fill=(180, 83, 9, 160), width=2)

    # 전통 목조 가구식 기둥과 인방보 (기둥 3개 & 가로 인방)
    wdraw.rounded_rectangle([125, 460, 175, 1015], radius=10, fill=(120, 53, 15, 255), outline=INK, width=4)
    wdraw.rounded_rectangle([849, 460, 899, 1015], radius=10, fill=(120, 53, 15, 255), outline=INK, width=4)
    wdraw.rounded_rectangle([485, 460, 535, 1015], radius=8, fill=(135, 60, 18, 255), outline=INK, width=4)
    wdraw.rounded_rectangle([130, 460, 894, 500], radius=8, fill=(120, 53, 15, 255), outline=INK, width=4)
    wdraw.rounded_rectangle([130, 720, 894, 755], radius=6, fill=(135, 60, 18, 255), outline=INK, width=4)

    # 5. 좌측 전통 살창호문 창문 (Candlelight paper window)
    add_warm_glow(img, 320, 610, 140, 130, 210, 110, glow_col=(254, 240, 138))
    wdraw = ImageDraw.Draw(img)
    # 창틀 (원목 프레임)
    wdraw.rounded_rectangle([200, 510, 440, 710], radius=14, fill=(254, 243, 199, 255), outline=INK, width=5)
    # 창호지 살격자
    wdraw.line([(320, 510), (320, 710)], fill=(120, 53, 15, 255), width=5)
    for wy in range(545, 710, 36):
        wdraw.line([(200, wy), (440, wy)], fill=(146, 64, 14, 255), width=4)
    for wx in [240, 280, 360, 400]:
        wdraw.line([(wx, 510), (wx, 710)], fill=(146, 64, 14, 255), width=3)

    # 창문 처마 아래 옥수수 다발 & 붉은 고추 엮음 장식
    # 노란 옥수수 3자루
    for ci, cx in enumerate([230, 260, 290]):
        cy = 505 + (ci % 2) * 6
        wdraw.ellipse([cx - 8, cy, cx + 8, cy + 42], fill=(250, 204, 21, 255), outline=INK, width=2)
        for gy in range(cy + 6, cy + 38, 7):
            wdraw.line([(cx - 6, gy), (cx + 6, gy)], fill=(180, 83, 9, 255), width=2)
        # 옥수수 수염
        wdraw.line([(cx, cy - 4), (cx - 4, cy - 14)], fill=(120, 53, 15, 255), width=2)
        wdraw.line([(cx, cy - 4), (cx + 4, cy - 14)], fill=(120, 53, 15, 255), width=2)
    # 붉은 고추 줄
    for ri, rx in enumerate([350, 375, 400]):
        ry = 505 + (ri % 2) * 8
        wdraw.polygon([(rx, ry), (rx + 8, ry + 36), (rx - 2, ry + 38)], fill=(220, 38, 38, 255), outline=INK, width=2)
        wdraw.line([(rx, ry), (rx, ry - 10)], fill=(22, 101, 52, 255), width=2)

    # 6. 우측 전통 쌍여닫이 방문 (Traditional wooden paper door)
    door_box = [560, 510, 820, 1010]
    wdraw.rounded_rectangle([door_box[0]-10, door_box[1]-10, door_box[2]+10, door_box[3]+4], radius=18, fill=(90, 40, 12, 255), outline=INK, width=5)
    # 문짝 2개
    mid_dx = (door_box[0] + door_box[2]) // 2
    wdraw.rounded_rectangle([door_box[0], door_box[1], mid_dx - 2, door_box[3]], radius=12, fill=(254, 243, 199, 255), outline=INK, width=4)
    wdraw.rounded_rectangle([mid_dx + 2, door_box[1], door_box[2], door_box[3]], radius=12, fill=(254, 243, 199, 255), outline=INK, width=4)
    # 문살 격자
    for dx_panel in [(door_box[0], mid_dx - 2), (mid_dx + 2, door_box[2])]:
        x1p, x2p = dx_panel
        cxp = (x1p + x2p) // 2
        wdraw.line([(cxp, door_box[1]), (cxp, door_box[3])], fill=(130, 60, 15, 255), width=4)
        for dy in range(door_box[1] + 35, door_box[3] - 20, 38):
            wdraw.line([(x1p, dy), (x2p, dy)], fill=(146, 64, 14, 255), width=3)
    # 놋쇠 문고리 (전통 배꼽 문고리 & 둥근 고리)
    for hx in [mid_dx - 22, mid_dx + 22]:
        wdraw.ellipse([hx - 14, 760, hx + 14, 788], fill=(245, 158, 11, 255), outline=INK, width=3)
        wdraw.arc([hx - 10, 775, hx + 10, 805], start=0, end=180, fill=INK, width=4)

    # 문 옆 정겨운 호롱등 (벽걸이 전통 등불)
    add_warm_glow(img, 510, 630, 90, 90, 200, 100)
    wdraw = ImageDraw.Draw(img)
    # 호롱불 프레임
    wdraw.line([(495, 610), (525, 610)], fill=(45, 25, 15, 255), width=4)
    wdraw.polygon([(500, 615), (520, 615), (515, 645), (505, 645)], fill=(254, 240, 138, 255), outline=INK, width=3)
    wdraw.ellipse([506, 622, 514, 634], fill=(239, 68, 68, 255))
    wdraw.ellipse([508, 625, 512, 631], fill=(254, 240, 138, 255))

    # 7. 포근하고 둥근 황금 볏짚 지붕 (Straw Thatched Roof)
    # 처마 그림자
    rdraw = ImageDraw.Draw(img)
    rdraw.rounded_rectangle([100, 450, 924, 525], radius=20, fill=(0, 0, 0, 40))

    # 둥근 초가지붕 메인 볼륨 (부드러운 포탄/버섯형 곡선)
    roof_pts = [
        (45, 490), (95, 360), (220, 220), (410, 140), (512, 125), (614, 140),
        (804, 220), (929, 360), (979, 490),
        (940, 518), (860, 498), (780, 524), (700, 502),
        (610, 524), (512, 505), (414, 524), (324, 502),
        (244, 524), (164, 498), (84, 518)
    ]
    draw_poly_aa(img, roof_pts, fill=(217, 119, 6, 255), outline=INK, width=6)

    # 도톰한 황금 볏짚 레이어
    roof_mid_pts = [
        (55, 475), (105, 350), (225, 212), (412, 134), (512, 120), (612, 134),
        (799, 212), (919, 350), (969, 475),
        (930, 498), (850, 482), (770, 504), (690, 486),
        (605, 504), (512, 488), (419, 504), (329, 486),
        (249, 504), (169, 482), (89, 498)
    ]
    draw_poly_aa(img, roof_mid_pts, fill=(245, 158, 11, 255), outline=INK, width=5)

    # 지붕 상단 햇살 하이라이트
    roof_hi_pts = [
        (130, 410), (240, 270), (410, 175), (512, 145),
        (614, 175), (784, 270), (894, 410),
        (780, 340), (630, 275), (512, 255), (394, 275), (244, 340)
    ]
    draw_poly_aa(img, roof_hi_pts, fill=(253, 224, 71, 230))

    # 섬세한 볏짚 결 라인
    sdraw = ImageDraw.Draw(img)
    thatch_layers = [
        (250, 360, 680, 18),
        (320, 260, 780, 24),
        (390, 180, 860, 30)
    ]
    for ly, x_min, x_max, count in thatch_layers:
        for sx in np.linspace(x_min, x_max, count):
            rand_len = 24 + (int(sx) % 7) * 4
            rand_tilt = (int(sx) % 5 - 2) * 3
            sdraw.line([(sx, ly), (sx + rand_tilt, ly + rand_len)], fill=(180, 83, 9, 210), width=3)
            sdraw.line([(sx + 1, ly), (sx + rand_tilt + 1, ly + rand_len)], fill=(254, 240, 138, 180), width=2)

    # 처마 끝 드리워진 짚풀 솔
    for fx in range(70, 960, 16):
        fy = 490 + math.sin(fx * 0.05) * 8
        flen = 24 + (fx % 6) * 6
        sdraw.line([(fx, fy), (fx + (fx % 5 - 2)*3, fy + flen)], fill=(217, 119, 6, 255), width=3)
        sdraw.line([(fx + 1, fy), (fx + (fx % 5 - 2)*3 + 1, fy + flen)], fill=(253, 224, 71, 255), width=2)

    # 8. 지붕 위 탐스러운 주황색 박/호박 2덩이 (Cozy Pumpkins on thatched roof)
    pumpkins = [
        (360, 280, 70, 52),
        (660, 290, 80, 60)
    ]
    for px, py, pw, ph in pumpkins:
        # 호박 그림자
        sdraw.ellipse([px - pw*0.5, py + ph*0.2, px + pw*0.5, py + ph*0.5], fill=(0, 0, 0, 70))
        # 호박 덩이 (3단 엽)
        for dx, dw in [(-pw*0.3, pw*0.48), (pw*0.3, pw*0.48), (0, pw*0.6)]:
            sdraw.ellipse([px + dx - dw/2, py - ph/2, px + dx + dw/2, py + ph/2], fill=(234, 88, 12, 255), outline=INK, width=3)
            sdraw.ellipse([px + dx - dw*0.35, py - ph*0.35, px + dx + dw*0.1, py + ph*0.2], fill=(251, 146, 60, 220))
        # 호박 꼭지
        sdraw.line([(px, py - ph/2 + 2), (px + 6, py - ph/2 - 14)], fill=(22, 101, 52, 255), width=4)
        sdraw.ellipse([px + 5, py - ph/2 - 16, px + 9, py - ph/2 - 12], fill=(74, 222, 128, 255))

    # 9. 지붕 꼭대기 볏짚 용마름 (Ridge Cap) 볏짚 엮음
    cap_box = [240, 70, 784, 155]
    sdraw.rounded_rectangle(cap_box, radius=42, fill=(217, 119, 6, 255), outline=INK, width=6)
    sdraw.rounded_rectangle([cap_box[0]+6, cap_box[1]+6, cap_box[2]-6, cap_box[1]+34], radius=20, fill=(251, 191, 36, 255))
    for cx in range(275, 755, 38):
        sdraw.line([(cx - 15, 75), (cx + 15, 150)], fill=(120, 53, 15, 255), width=4)
        sdraw.line([(cx + 15, 75), (cx - 15, 150)], fill=(120, 53, 15, 255), width=4)
        sdraw.line([(cx, 68), (cx, 158)], fill=(254, 243, 199, 190), width=2)

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


# ==============================================================================
# [2] 2단계: 통나무로 만든 아늑한 집 (Authentic Cozy Log Cabin)
# ==============================================================================
def create_authentic_log_cabin():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 자연석 거친 돌 굴뚝 & 뭉게구름 연기 (좌측 상단)
    cdraw = ImageDraw.Draw(img)
    draw_chimney_and_smoke(cdraw, 180, 110, cw=90, ch=370, style='stone')

    # 2. 기초 돌담 기단부 (Y = 1170 ~ 1280)
    fdraw = ImageDraw.Draw(img)
    draw_fairytale_foundation(fdraw, 80, 1170, 944, 1280)

    # 3. 1층 튼튼한 통나무 현관 툇마루 테라스 (Pigs standing deck at Y = 1010 ~ 1175)
    tdraw = ImageDraw.Draw(img)
    deck_y = 1010
    tdraw.rounded_rectangle([75, deck_y, 949, 1175], radius=16, fill=(146, 64, 14, 255), outline=INK, width=5)
    for bx in range(130, 910, 72):
        tdraw.line([(bx, deck_y), (bx, 1175)], fill=(85, 35, 10, 255), width=3)
    tdraw.line([(80, deck_y + 6), (944, deck_y + 6)], fill=(217, 119, 6, 255), width=4)

    # 4. 1층 가로로 엇갈려 쌓은 굵은 원목 통나무 벽체 (Y: 740 ~ 1015)
    ldraw = ImageDraw.Draw(img)
    log_h = 55
    y_start = 740
    y_end = 1015
    num_logs = int((y_end - y_start) // log_h) + 1
    for i in range(num_logs):
        ly = y_start + i * log_h
        lh = min(log_h, y_end - ly)
        if lh < 25: continue
        # 원목 통나무 몸체
        ldraw.rounded_rectangle([105, ly, 919, ly + lh], radius=18, fill=(180, 83, 9, 255), outline=INK, width=4)
        # 상단 원통형 하이라이트 반사광
        ldraw.line([(115, ly + 8), (909, ly + 8)], fill=(245, 158, 11, 255), width=5)
        ldraw.line([(117, ly + 15), (907, ly + 15)], fill=(251, 191, 36, 190), width=3)
        # 하단 둥근 그림자
        ldraw.line([(115, ly + lh - 5), (909, ly + lh - 5)], fill=(120, 53, 15, 255), width=4)
        # 통나무 끝단 둥근 나이테 단면 (Saddle notch log ends)
        for cx in [105, 919]:
            ldraw.ellipse([cx - 26, ly + 2, cx + 26, ly + lh - 2], fill=(217, 119, 6, 255), outline=INK, width=4)
            if lh >= 38:
                ldraw.ellipse([cx - 16, ly + 7, cx + 16, ly + lh - 7], fill=(180, 83, 9, 255), outline=INK_MED, width=2)
                ldraw.ellipse([cx - 7, ly + 14, cx + 7, ly + lh - 14], fill=(146, 64, 14, 255))

    # 5. 1층 좌측 벽난로 온기 창문 (Fireplace glow window)
    add_warm_glow(img, 310, 865, 130, 120, 210, 110, glow_col=(254, 215, 100))
    ldraw = ImageDraw.Draw(img)
    ldraw.rounded_rectangle([200, 780, 420, 955], radius=22, fill=(254, 240, 138, 255), outline=INK, width=6)
    ldraw.line([(310, 780), (310, 955)], fill=(120, 53, 15, 255), width=6)
    ldraw.line([(200, 868), (420, 868)], fill=(120, 53, 15, 255), width=6)
    ldraw.polygon([(215, 795), (275, 795), (215, 855)], fill=(255, 255, 255, 170))
    
    # 창문 아래 원목 꽃화분대
    w_box_x1, w_box_x2, w_box_y = 185, 435, 955
    ldraw.rounded_rectangle([w_box_x1, w_box_y, w_box_x2, w_box_y + 32], radius=6, fill=(146, 64, 14, 255), outline=INK, width=4)
    for fi, fx in enumerate(range(w_box_x1 + 18, w_box_x2 - 10, 24)):
        fy = w_box_y - 6 + (fi % 2) * 5
        ldraw.ellipse([fx - 7, fy - 7, fx + 7, fy + 7], fill=(239, 68, 68, 255) if fi % 2 == 0 else (250, 204, 21, 255), outline=INK, width=2)
        ldraw.ellipse([fx - 3, fy - 3, fx + 3, fy + 3], fill=(255, 255, 255, 255))

    # 1층 우측 묵직한 통나무 현관문
    door_box = [550, 775, 820, 1010]
    ldraw.rounded_rectangle([door_box[0]-8, door_box[1]-8, door_box[2]+8, door_box[3]+4], radius=32, fill=(85, 35, 10, 255), outline=INK, width=5)
    ldraw.rounded_rectangle(door_box, radius=28, fill=(130, 60, 15, 255), outline=INK, width=5)
    for dx in [615, 685, 755]:
        ldraw.line([(dx, door_box[1] + 10), (dx, door_box[3])], fill=(80, 32, 8, 255), width=4)
    # 두꺼운 철제 장식 경첩 & 손잡이
    for hy in [825, 940]:
        ldraw.rounded_rectangle([540, hy, 625, hy + 22], radius=6, fill=(30, 41, 59, 255), outline=INK, width=3)
        ldraw.ellipse([612, hy + 4, 624, hy + 18], fill=(148, 163, 184, 255))
    ldraw.ellipse([750, 890, 782, 922], fill=(245, 158, 11, 255), outline=INK, width=4)

    # 6. 2층 돌출 통나무 발코니 테라스 (둘째 돼지 저격 플랫폼 Y = 715 ~ 760)
    ldraw.rounded_rectangle([85, 710, 939, 760], radius=12, fill=(120, 53, 15, 255), outline=INK, width=5)
    ldraw.line([(90, 718), (934, 718)], fill=(217, 119, 6, 255), width=4)
    for rx in range(115, 905, 65):
        ldraw.line([(rx, 710), (rx + 45, 760)], fill=(75, 30, 6, 255), width=3)
        ldraw.line([(rx + 45, 710), (rx, 760)], fill=(75, 30, 6, 255), width=3)

    # 7. 2층 통나무 벽체 (Y: 410 ~ 715)
    y2_start = 410
    y2_end = 715
    num2_logs = int((y2_end - y2_start) // log_h) + 1
    for i in range(num2_logs):
        ly = y2_start + i * log_h
        lh = min(log_h, y2_end - ly)
        if lh < 25: continue
        ldraw.rounded_rectangle([140, ly, 884, ly + lh], radius=16, fill=(180, 83, 9, 255), outline=INK, width=4)
        ldraw.line([(148, ly + 8), (876, ly + 8)], fill=(245, 158, 11, 255), width=5)
        ldraw.line([(148, ly + lh - 5), (876, ly + lh - 5)], fill=(120, 53, 15, 255), width=4)
        for cx in [140, 884]:
            ldraw.ellipse([cx - 22, ly + 3, cx + 22, ly + lh - 3], fill=(217, 119, 6, 255), outline=INK, width=3)

    # 2층 중앙 아늑한 다락방 창문 & 하트 덧문
    add_warm_glow(img, 512, 550, 120, 110, 190, 95)
    ldraw = ImageDraw.Draw(img)
    ldraw.rounded_rectangle([415, 455, 609, 645], radius=24, fill=(254, 240, 138, 255), outline=INK, width=5)
    ldraw.line([(512, 455), (512, 645)], fill=(120, 53, 15, 255), width=5)
    ldraw.line([(415, 550), (609, 550)], fill=(120, 53, 15, 255), width=5)
    for sx in [350, 609]:
        ldraw.rounded_rectangle([sx, 455, sx + 65, 645], radius=8, fill=(146, 64, 14, 255), outline=INK, width=4)
        hx, hy = sx + 32, 545
        ldraw.polygon([(hx, hy + 12), (hx - 12, hy - 4), (hx - 6, hy - 14), (hx, hy - 8), (hx + 6, hy - 14), (hx + 12, hy - 4)], fill=(254, 243, 199, 255))
    ldraw.rounded_rectangle([390, 645, 634, 675], radius=6, fill=(146, 64, 14, 255), outline=INK, width=4)

    # 8. 통나무 오두막 박공 너와 지붕 (Gable Timber Shingle Roof)
    rdraw = ImageDraw.Draw(img)
    rdraw.polygon([(35, 450), (512, 150), (989, 450), (512, 470)], fill=(0, 0, 0, 45))

    rows_shingles = [
        (405, 45, 979, 13),
        (345, 105, 919, 11),
        (285, 175, 849, 9),
        (225, 255, 769, 7),
        (165, 345, 679, 5),
        (115, 435, 589, 3)
    ]
    shingle_cols = [(146, 64, 14, 255), (180, 83, 9, 255), (120, 53, 15, 255), (194, 65, 12, 255)]
    for sy, sx1, sx2, count in rows_shingles:
        sw = (sx2 - sx1) / count
        for sc in range(count):
            bx = sx1 + sc * sw
            col = shingle_cols[(int(bx) + sy) % len(shingle_cols)]
            rdraw.rounded_rectangle([bx + 3, sy, bx + sw - 3, sy + 65], radius=10, fill=col, outline=INK, width=4)
            rdraw.line([(bx + 8, sy + 58), (bx + sw - 8, sy + 58)], fill=(251, 191, 36, 180), width=3)

    # 지붕 용마루 & 첫째 돼지 관측 망루 데크 (Y = 85 ~ 140)
    rdraw.rounded_rectangle([395, 85, 629, 142], radius=14, fill=(120, 53, 15, 255), outline=INK, width=5)
    rdraw.line([(405, 95), (619, 95)], fill=(217, 119, 6, 255), width=4)

    # 지붕 꼭대기 바람개비 깃발
    rdraw.line([(512, 18), (512, 90)], fill=(30, 41, 59, 255), width=6)
    rdraw.ellipse([502, 8, 522, 28], fill=(245, 158, 11, 255), outline=INK, width=3)
    rdraw.polygon([(512, 22), (620, 52), (512, 82)], fill=(239, 68, 68, 255), outline=INK, width=4)

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


# ==============================================================================
# [3] 3단계: 벽과 콘크리트로 만든 성 같은 집 (Reinforced Concrete Fortress Castle)
# ==============================================================================
def create_concrete_fortress_castle():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # 1. 강화 콘크리트 방어 배기탑 & 연기 (우측 상단)
    cdraw = ImageDraw.Draw(img)
    draw_chimney_and_smoke(cdraw, 690, 130, cw=90, ch=290, style='concrete')

    # 2. 견고한 철근 콘크리트 기초 기단 (Y = 1170 ~ 1280)
    bdraw = ImageDraw.Draw(img)
    draw_fairytale_foundation(bdraw, 75, 1170, 949, 1280, is_concrete=True)

    # 3. 1층 성문 앞 요새 테라스 (Pigs standing deck at Y = 1010 ~ 1175)
    deck_y = 1010
    bdraw.rounded_rectangle([65, deck_y, 959, 1175], radius=16, fill=(100, 116, 139, 255), outline=INK, width=5)
    for bx in range(125, 915, 80):
        bdraw.line([(bx, deck_y), (bx, 1175)], fill=(51, 65, 85, 255), width=3)
    bdraw.line([(70, deck_y + 6), (954, deck_y + 6)], fill=(203, 213, 225, 255), width=4)

    # 4. 1층 견고한 철근 콘크리트 & 석조 하이브리드 방벽 (Y: 700 ~ 1015)
    # 두꺼운 콘크리트 메인 벽체
    bdraw.rounded_rectangle([105, 700, 919, 1015], radius=16, fill=(148, 163, 184, 255), outline=INK, width=6)
    
    # 거푸집 패널 줄눈(Formwork Lines) 및 타이볼트(Tie-bolt) 리벳 구멍
    for py in [760, 830, 900, 970]:
        bdraw.line([(110, py), (914, py)], fill=(100, 116, 139, 255), width=3)
        bdraw.line([(110, py + 2), (914, py + 2)], fill=(226, 232, 240, 180), width=1)
    for px in [180, 270, 360, 450, 540, 630, 720, 810]:
        bdraw.line([(px, 705), (px, 1010)], fill=(100, 116, 139, 255), width=2)
        for py in [735, 795, 865, 935]:
            bdraw.ellipse([px - 5, py - 5, px + 5, py + 5], fill=(51, 65, 85, 255), outline=(30, 41, 59, 255), width=2)
            bdraw.ellipse([px - 2, py - 2, px + 2, py + 2], fill=(203, 213, 225, 200))

    # 좌우 코너 콘크리트 모루 버트레스 (Fortified Corner Buttresses)
    for qx, is_left in [(105, True), (864, False)]:
        for qi in range(10):
            qy = 705 + qi * 31
            qw = 52 if (qi % 2 == 0) else 36
            rx = qx if is_left else (qx + 55 - qw)
            bdraw.rounded_rectangle([rx, qy, rx + qw, qy + 27], radius=6, fill=(100, 116, 139, 255), outline=INK, width=3)
            bdraw.line([(rx + 4, qy + 4), (rx + qw - 4, qy + 4)], fill=(226, 232, 240, 220), width=2)

    # 5. 1층 좌측 아치형 요새 벙커 창문 & 두꺼운 방탄 철살
    add_warm_glow(img, 315, 835, 130, 130, 200, 100, glow_col=(254, 240, 138))
    bdraw = ImageDraw.Draw(img)
    bdraw.chord([195, 715, 435, 955], start=180, end=360, fill=(71, 85, 105, 255), outline=INK, width=6)
    bdraw.rectangle([195, 835, 435, 965], fill=(71, 85, 105, 255), outline=INK, width=6)
    bdraw.chord([215, 735, 415, 935], start=180, end=360, fill=(254, 240, 138, 255), outline=INK, width=4)
    bdraw.rectangle([215, 835, 415, 945], fill=(254, 240, 138, 255), outline=INK, width=4)
    for gx in [260, 315, 370]:
        bdraw.line([(gx, 745), (gx, 945)], fill=(30, 41, 59, 255), width=6)
    bdraw.line([(215, 845), (415, 845)], fill=(30, 41, 59, 255), width=6)

    # 1층 우측 웅장한 방어 철갑 성문 (Armored Blast Portcullis Gate)
    gate_box = [535, 730, 825, 1010]
    bdraw.chord([gate_box[0]-16, gate_box[1]-16, gate_box[2]+16, gate_box[1]+240], start=180, end=360, fill=(71, 85, 105, 255), outline=INK, width=6)
    bdraw.rectangle([gate_box[0]-16, gate_box[1]+105, gate_box[2]+16, gate_box[3]+4], fill=(71, 85, 105, 255), outline=INK, width=6)
    bdraw.chord([gate_box[0], gate_box[1], gate_box[2], gate_box[1]+260], start=180, end=360, fill=(30, 41, 59, 255), outline=INK, width=5)
    bdraw.rectangle([gate_box[0], gate_box[1]+130, gate_box[2], gate_box[3]], fill=(30, 41, 59, 255), outline=INK, width=5)
    # 강철 리벳 보강 밴드
    for ry in [810, 890, 960]:
        bdraw.rectangle([gate_box[0]+4, ry, gate_box[2]-4, ry + 26], fill=(51, 65, 85, 255), outline=INK, width=3)
        for rx in range(gate_box[0]+25, gate_box[2]-15, 36):
            bdraw.ellipse([rx - 6, ry + 6, rx + 6, ry + 18], fill=(226, 232, 240, 255), outline=INK, width=2)
    bdraw.ellipse([670, 935, 700, 965], fill=(245, 158, 11, 255), outline=INK, width=4)

    # 요새 벽면 고출력 서치라이트/랜턴
    add_warm_glow(img, 480, 755, 70, 70, 190, 90, glow_col=(186, 230, 253))
    bdraw = ImageDraw.Draw(img)
    bdraw.rounded_rectangle([465, 740, 495, 770], radius=8, fill=(30, 41, 59, 255), outline=INK, width=3)
    bdraw.ellipse([470, 745, 490, 765], fill=(56, 189, 248, 255))
    bdraw.ellipse([475, 750, 485, 760], fill=(255, 255, 255, 255))

    # 6. 2층 콘크리트 사격 테라스 (둘째 돼지 저격 플랫폼 Y = 665 ~ 715)
    # 두꺼운 콘크리트 슬래브
    bdraw.rounded_rectangle([85, 665, 939, 715], radius=10, fill=(100, 116, 139, 255), outline=INK, width=5)
    bdraw.line([(90, 673), (934, 673)], fill=(226, 232, 240, 255), width=4)
    # 슬래브 하부 콘크리트 코벨 지지대 (Corbels)
    for c_idx in range(6):
        cx = 155 + c_idx * 122
        bdraw.polygon([(cx, 715), (cx + 52, 715), (cx + 26, 765)], fill=(51, 65, 85, 255), outline=INK, width=3)
        bdraw.polygon([(cx + 10, 715), (cx + 42, 715), (cx + 26, 755)], fill=(148, 163, 184, 255))

    # 7. 2층 상부 콘크리트 방어벽 (Y: 340 ~ 670)
    bdraw.rounded_rectangle([145, 340, 879, 670], radius=14, fill=(148, 163, 184, 255), outline=INK, width=6)
    for py in [420, 500, 580]:
        bdraw.line([(150, py), (874, py)], fill=(100, 116, 139, 255), width=3)
    for px in [230, 340, 680, 790]:
        bdraw.line([(px, 345), (px, 665)], fill=(100, 116, 139, 255), width=2)
        for py in [380, 460, 540, 620]:
            bdraw.ellipse([px - 5, py - 5, px + 5, py + 5], fill=(51, 65, 85, 255), outline=INK, width=2)

    # 2층 중앙 방어 총안 창문 ( 둘째 돼지 사격 벙커 )
    add_warm_glow(img, 512, 490, 110, 110, 200, 90)
    bdraw = ImageDraw.Draw(img)
    bdraw.chord([425, 395, 599, 560], start=180, end=360, fill=(71, 85, 105, 255), outline=INK, width=5)
    bdraw.rectangle([425, 480, 599, 585], fill=(71, 85, 105, 255), outline=INK, width=5)
    bdraw.chord([440, 410, 584, 545], start=180, end=360, fill=(254, 240, 138, 255), outline=INK, width=4)
    bdraw.rectangle([440, 480, 584, 570], fill=(254, 240, 138, 255), outline=INK, width=4)
    bdraw.line([(512, 410), (512, 570)], fill=(30, 41, 59, 255), width=5)
    bdraw.line([(440, 490), (584, 490)], fill=(30, 41, 59, 255), width=5)

    # 8. 성채 꼭대기 콘크리트 요새 치성 (Crenelations: 첫째 돼지 지휘대 Y = 100 ~ 345)
    # 성벽 난간 발판
    bdraw.rounded_rectangle([75, 295, 949, 345], radius=10, fill=(100, 116, 139, 255), outline=INK, width=5)
    bdraw.line([(80, 303), (944, 303)], fill=(226, 232, 240, 255), width=4)

    # 요새 톱니 치성 (Battlements Merlons: 7개)
    merlons = [
        (85, 195, 185, 300),
        (215, 195, 315, 300),
        (345, 195, 445, 300),
        (475, 175, 549, 300), # 중앙 높은 망루 기둥
        (579, 195, 679, 300),
        (709, 195, 809, 300),
        (839, 195, 939, 300)
    ]
    for mx1, my1, mx2, my2 in merlons:
        bdraw.rounded_rectangle([mx1, my1, mx2, my2], radius=6, fill=(148, 163, 184, 255), outline=INK, width=5)
        # 상단 콘크리트 캡
        bdraw.rounded_rectangle([mx1 - 4, my1 - 4, mx2 + 4, my1 + 18], radius=4, fill=(203, 213, 225, 255), outline=INK, width=3)
        # 좁은 사격 총안 슬릿 (Embrasure slit)
        sl_cx = (mx1 + mx2) // 2
        bdraw.rounded_rectangle([sl_cx - 6, my1 + 35, sl_cx + 6, my1 + 75], radius=3, fill=(30, 41, 59, 255))

    # 최상층 지휘 깃발 (Imperial Fortress Banner)
    bdraw.line([(512, 50), (512, 175)], fill=(30, 41, 59, 255), width=6)
    bdraw.ellipse([502, 40, 522, 60], fill=(245, 158, 11, 255), outline=INK, width=3)
    bdraw.polygon([(512, 55), (630, 90), (512, 125)], fill=(37, 99, 235, 255), outline=INK, width=4)
    bdraw.polygon([(512, 65), (595, 90), (512, 115)], fill=(96, 165, 250, 255))
    # 황금 별 심볼
    bdraw.ellipse([535, 82, 555, 98], fill=(250, 204, 21, 255))

    return img.resize((FW, FH), Image.Resampling.LANCZOS)


def main():
    print("Building Tier 1: Traditional Thatched House...")
    straw_house = create_traditional_thatched_house()
    straw_house.save("assets/house_straw.png")
    print("-> assets/house_straw.png saved.")

    print("Building Tier 2: Authentic Log Cabin...")
    wood_house = create_authentic_log_cabin()
    wood_house.save("assets/house_wood.png")
    print("-> assets/house_wood.png saved.")

    print("Building Tier 3: Concrete Fortress Castle...")
    brick_house = create_concrete_fortress_castle()
    brick_house.save("assets/house_brick.png")
    print("-> assets/house_brick.png saved.")

    print("All 3 houses built successfully!")

if __name__ == '__main__':
    main()
