# -*- coding: utf-8 -*-
"""
build_fairytale_houses_v2.py
아기돼지 삼형제의 동화 속 아기자기하고 예쁜 집 스프라이트 생성기 (v2)
- 2x 슈퍼샘플링(1024x1360) 후 고급 Lanczos 안티에일리어싱 리샘플링(512x680)
- 아기자기한 동화책 일러스트 풍 (플럼프 곡선, 따스한 셀 셰이딩, 동화 버섯 & 꽃화분)
"""

import math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

SW, SH = 1024, 1360
FW, FH = 512, 680

# 공통 아웃라인 및 셰이딩 색상 (동화풍 다크 브라운 라인)
INK = (58, 32, 16, 255)       # 따뜻한 잉크 아웃라인
INK_LIGHT = (90, 50, 25, 255) # 부드러운 내부 라인

def draw_pill(draw, x1, y1, x2, y2, r, fill, outline=INK, width=4):
    """둥근 알약/통나무 모양"""
    draw.line([(x1, y1), (x2, y2)], fill=fill, width=int(r*2))
    draw.ellipse([x1 - r, y1 - r, x1 + r, y1 + r], fill=fill)
    draw.ellipse([x2 - r, y2 - r, x2 + r, y2 + r], fill=fill)
    if outline and width > 0:
        draw.line([(x1, y1 - r), (x2, y2 - r)], fill=outline, width=width)
        draw.line([(x1, y1 + r), (x2, y2 + r)], fill=outline, width=width)
        draw.arc([x1 - r, y1 - r, x1 + r, y1 + r], start=90, end=270, fill=outline, width=width)
        draw.arc([x2 - r, y2 - r, x2 + r, y2 + r], start=270, end=450, fill=outline, width=width)

def draw_fairytale_mushroom(draw, cx, cy, cap_w, cap_h, is_blue=False):
    """배경 버섯과 완벽히 일치하는 아기자기한 점박이 버섯"""
    # 줄기
    sw = cap_w * 0.38
    sh = cap_h * 1.15
    draw.rounded_rectangle([cx - sw/2, cy - sh + cap_h*0.3, cx + sw/2, cy], radius=int(sw/2), fill=(255, 250, 240, 255), outline=INK, width=3)
    # 줄기 밑동 그림자
    draw.ellipse([cx - sw/2, cy - 6, cx + sw/2, cy + 2], fill=(210, 195, 175, 255))
    
    # 버섯 갓 (통통한 돔형)
    c_base = (56, 189, 248, 255) if is_blue else (239, 68, 68, 255)
    c_shade = (2, 132, 199, 255) if is_blue else (185, 28, 28, 255)
    c_hi = (186, 230, 253, 255) if is_blue else (252, 165, 165, 255)
    
    cap_box = [cx - cap_w/2, cy - sh - cap_h*0.35, cx + cap_w/2, cy - sh + cap_h*0.75]
    draw.chord(cap_box, start=180, end=360, fill=c_base, outline=INK, width=4)
    # 갓 밑단 둥근 림
    draw.ellipse([cx - cap_w/2, cy - sh + cap_h*0.05, cx + cap_w/2, cy - sh + cap_h*0.4], fill=c_shade, outline=INK, width=3)
    # 갓 상단 하이라이트
    draw.ellipse([cx - cap_w*0.3, cy - sh - cap_h*0.25, cx + cap_w*0.05, cy - sh], fill=c_hi)
    
    # 흰색 점박이들
    dots = [
        (cx - cap_w*0.25, cy - sh - cap_h*0.05, cap_w*0.13),
        (cx + cap_w*0.22, cy - sh, cap_w*0.11),
        (cx - cap_w*0.05, cy - sh - cap_h*0.18, cap_w*0.09),
        (cx + cap_w*0.05, cy - sh + cap_h*0.12, cap_w*0.08)
    ]
    for dx, dy, dr in dots:
        draw.ellipse([dx - dr, dy - dr*0.8, dx + dr, dy + dr*0.8], fill=(255, 255, 255, 255), outline=(220, 220, 220, 255), width=1)

def draw_window_glow(img, cx, cy, rx, ry):
    """창문에서 흘러나오는 동화 속 따스한 촛불 조명 글로우"""
    glow = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([cx - rx - 35, cy - ry - 35, cx + rx + 35, cy + ry + 35], fill=(254, 240, 138, 90))
    gdraw.ellipse([cx - rx - 15, cy - ry - 15, cx + rx + 15, cy + ry + 15], fill=(253, 224, 71, 140))
    glow = glow.filter(ImageFilter.GaussianBlur(28))
    img.alpha_composite(glow)

def draw_flower_box(draw, x1, y, x2, h=32):
    """창문 아래 피어난 알록달록 동화 꽃 화분"""
    # 화분 나무 박스
    draw.rounded_rectangle([x1, y, x2, y + h], radius=6, fill=(146, 64, 14, 255), outline=INK, width=4)
    draw.line([(x1 + 4, y + 6), (x2 - 4, y + 6)], fill=(180, 83, 9, 255), width=3)
    # 꽃과 풀잎
    colors = [(244, 63, 94, 255), (251, 113, 133, 255), (255, 255, 255, 255), (250, 204, 21, 255), (192, 132, 252, 255)]
    w_box = x2 - x1
    num_f = int(w_box // 22)
    for i in range(num_f):
        fx = x1 + 14 + i * 22
        fy = y - 6 + (i % 2) * 6
        # 초록 잎사귀
        draw.ellipse([fx - 10, fy + 4, fx + 10, fy + 16], fill=(34, 197, 94, 255), outline=(20, 83, 45, 255), width=2)
        # 꽃잎
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
            # 하이라이트 림
            draw.arc([rx + 6, ry + 4, rx + rw - 6, ry + rh - 4], start=180, end=300, fill=(240, 238, 235, 210), width=4)

    # 퐁퐁 솟아난 이끼 덩굴
    moss_cols = [(101, 163, 13, 255), (77, 124, 15, 255), (132, 204, 22, 255)]
    for m in range(16):
        mx = x1 + m * 55 + (m % 3) * 8
        my = y2 - 8
        mr = 28 + (m % 3) * 8
        draw.ellipse([mx - mr, my - mr*0.55, mx + mr, my + mr*0.55], fill=moss_cols[m % len(moss_cols)])


# ==============================================================================
# 1. 아기자기한 동화풍 황금 짚단 초가집 (Straw Thatched Fairytale Cottage)
# ==============================================================================
def render_straw_house_v2():
    img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # --- A. 굴뚝 & 연기 (오른쪽 위) ---
    cdraw = ImageDraw.Draw(img)
    # 뭉게뭉게 흰 구름 연기
    smokes = [(740, 95, 36, 210), (775, 60, 48, 170), (820, 25, 60, 130), (880, -2, 75, 80)]
    for sx, sy, sr, sa in smokes:
        cdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, sa))
    # 붉은 벽돌/흙돌 굴뚝
    cdraw.rounded_rectangle([680, 140, 770, 360], radius=10, fill=(185, 90, 50, 255), outline=INK, width=5)
    cdraw.rounded_rectangle([665, 125, 785, 165], radius=8, fill=(140, 65, 35, 255), outline=INK, width=5)
    for cy in range(185, 350, 35):
        cdraw.line([(680, cy), (770, cy)], fill=INK, width=3)
        for cx in [710, 740]:
            cdraw.line([(cx, cy), (cx, cy + 35)], fill=INK, width=2)

    # --- B. 기초 호박돌 & 이끼 & 버섯 (Foundation) ---
    fdraw = ImageDraw.Draw(img)
    draw_stone_foundation(fdraw, 90, 1140, 934, 1285)
    # 버섯들
    draw_fairytale_mushroom(fdraw, 75, 1275, 58, 44, is_blue=False)
    draw_fairytale_mushroom(fdraw, 125, 1290, 40, 30, is_blue=True)
    draw_fairytale_mushroom(fdraw, 945, 1280, 56, 42, is_blue=False)
    draw_fairytale_mushroom(fdraw, 895, 1295, 38, 28, is_blue=False)

    # --- C. 1층 툇마루 / 베란다 원목 데크 (아기돼지 삼형제가 서는 곳) ---
    deck_draw = ImageDraw.Draw(img)
    dy1, dy2 = 880, 1150
    dx1, dx2 = 110, 914
    # 마루 하부 공간
    deck_draw.rounded_rectangle([dx1 + 10, dy1 + 35, dx2 - 10, dy2], radius=14, fill=(90, 35, 10, 255), outline=INK, width=5)
    # 통나무 받침 기둥 5개
    for px in [150, 330, 512, 694, 874]:
        draw_pill(deck_draw, px, dy1 + 30, px, dy2 - 5, r=18, fill=(146, 64, 14, 255), outline=INK, width=4)
        deck_draw.line([(px - 4, dy1 + 45), (px - 4, dy2 - 15)], fill=(180, 83, 9, 255), width=3)
    # 두툼한 원목 마루 상판
    deck_draw.rounded_rectangle([dx1 - 20, dy1, dx2 + 20, dy1 + 60], radius=16, fill=(217, 119, 6, 255), outline=INK, width=6)
    deck_draw.line([(dx1 - 10, dy1 + 10), (dx2 + 10, dy1 + 10)], fill=(251, 191, 36, 240), width=6)
    for sx in range(dx1 + 10, dx2 + 10, 75):
        deck_draw.line([(sx, dy1 + 8), (sx, dy1 + 52)], fill=INK, width=3)

    # --- D. 방 벽체 (포근한 크림색 회벽 + 곡선형 원목 보 기둥) ---
    wall_draw = ImageDraw.Draw(img)
    wy1, wy2 = 430, dy1 + 15
    wx1, wx2 = 160, 864
    wall_pts = [(195, wy1), (829, wy1), (wx2, wy2), (wx1, wy2)]
    wall_draw.polygon(wall_pts, fill=(254, 243, 199, 255), outline=INK)
    # 부드러운 벽체 음영
    wall_draw.line([(195, wy1), (wx1, wy2)], fill=INK, width=6)
    wall_draw.line([(829, wy1), (wx2, wy2)], fill=INK, width=6)
    # 목재 기둥들
    draw_pill(wall_draw, 190, wy1, wx1, wy2, r=14, fill=(120, 53, 15, 255), outline=INK, width=4)
    draw_pill(wall_draw, 834, wy1, wx2, wy2, r=14, fill=(120, 53, 15, 255), outline=INK, width=4)
    draw_pill(wall_draw, 512, wy1, 512, wy2, r=12, fill=(146, 64, 14, 255), outline=INK, width=4)

    # --- E. 아치형 낭만 원목 문 (오른쪽) ---
    door_draw = ImageDraw.Draw(img)
    dor_x1, dor_x2 = 560, 800
    dor_y1, dor_y2 = 490, wy2
    door_draw.chord([dor_x1 - 10, dor_y1 - 60, dor_x2 + 10, dor_y1 + 120], start=180, end=360, fill=(90, 35, 10, 255), outline=INK, width=5)
    door_draw.rectangle([dor_x1 - 10, dor_y1 + 30, dor_x2 + 10, dor_y2], fill=(90, 35, 10, 255), outline=INK, width=5)
    # 문짝 판자
    door_draw.chord([dor_x1, dor_y1 - 50, dor_x2, dor_y1 + 110], start=180, end=360, fill=(180, 83, 9, 255))
    door_draw.rectangle([dor_x1, dor_y1 + 30, dor_x2, dor_y2 - 6], fill=(180, 83, 9, 255))
    for px in [620, 680, 740]:
        door_draw.line([(px, dor_y1), (px, dor_y2 - 6)], fill=(120, 53, 15, 255), width=4)
    # 중세 철물 경첩 & 황금 문고리
    door_draw.rounded_rectangle([dor_x1 - 5, dor_y1 + 75, dor_x1 + 65, dor_y1 + 100], radius=6, fill=(30, 41, 59, 255), outline=INK, width=2)
    door_draw.rounded_rectangle([dor_x1 - 5, dor_y1 + 250, dor_x1 + 65, dor_y1 + 275], radius=6, fill=(30, 41, 59, 255), outline=INK, width=2)
    door_draw.ellipse([735, dor_y1 + 165, 775, dor_y1 + 205], fill=(251, 191, 36, 255), outline=INK, width=4)
    door_draw.ellipse([747, dor_y1 + 177, 763, dor_y1 + 193], fill=(180, 83, 9, 255))

    # --- F. 아기자기한 촛불 창문 (왼쪽) + 조명 글로우 + 꽃 화분 ---
    win_cx, win_cy = 340, 640
    draw_window_glow(img, win_cx, win_cy, 60, 60)
    
    win_draw = ImageDraw.Draw(img)
    wx1, wy1, wx2, wy2 = 230, 520, 450, 760
    # 둥근 창틀
    win_draw.rounded_rectangle([wx1 - 12, wy1 - 12, wx2 + 12, wy2 + 12], radius=32, fill=(120, 53, 15, 255), outline=INK, width=5)
    win_draw.rounded_rectangle([wx1, wy1, wx2, wy2], radius=24, fill=(254, 240, 138, 255))
    win_draw.line([(win_cx, wy1), (win_cx, wy2)], fill=(120, 53, 15, 255), width=8)
    win_draw.line([(wx1, win_cy), (wx2, win_cy)], fill=(120, 53, 15, 255), width=8)
    draw_flower_box(win_draw, wx1 - 16, wy2 + 8, wx2 + 16, h=36)

    # --- G. 풍성하고 둥글둥글한 동화풍 황금 볏짚 지붕 (Fluffy Storybook Thatch Roof) ---
    roof_draw = ImageDraw.Draw(img)

    # 1. 처마 그림자
    roof_draw.ellipse([100, 460, 924, 550], fill=(0, 0, 0, 70))

    # 2. 메인 곡선형 볏짚 지붕 돔 (커다랗고 포근한 버섯/종 형태)
    # Bezier 대신 부드러운 다각형 곡선 포인트 생성
    # 상단 중심 (512, 160) -> 좌측 (60, 470) -> 하단 물결 -> 우측 (964, 470)
    roof_pts = []
    # 좌측 곡선
    for t in np.linspace(0, 1, 25):
        # 2차 베지에: (512, 160) -> (180, 220) -> (60, 470)
        x = (1-t)**2 * 512 + 2*(1-t)*t * 160 + t**2 * 50
        y = (1-t)**2 * 150 + 2*(1-t)*t * 220 + t**2 * 475
        roof_pts.append((x, y))

    # 하단 물결치는 스캘럽 처마 (12개의 통통한 곡선 볏단)
    num_scallops = 14
    for i in range(num_scallops):
        t0 = i / num_scallops
        t1 = (i + 1) / num_scallops
        x0 = 50 + t0 * 924
        x1 = 50 + t1 * 924
        mid_x = (x0 + x1) / 2
        # 아래로 둥글게 볼록
        roof_pts.append((mid_x, 505 + math.sin(i * 0.45) * 8))
        roof_pts.append((x1, 475))

    # 우측 곡선 (974, 475) -> (512, 150)
    for t in np.linspace(1, 0, 25):
        x = (1-t)**2 * 512 + 2*(1-t)*t * 864 + t**2 * 974
        y = (1-t)**2 * 150 + 2*(1-t)*t * 220 + t**2 * 475
        roof_pts.append((x, y))

    # 지붕 채우기 (풍성한 황금색)
    roof_draw.polygon(roof_pts, fill=(245, 158, 11, 255), outline=INK)
    # 지붕 상단 하이라이트 돔
    roof_draw.chord([150, 120, 874, 440], start=180, end=360, fill=(251, 191, 36, 255), outline=INK_LIGHT, width=3)
    roof_draw.chord([250, 130, 774, 340], start=180, end=360, fill=(253, 224, 71, 255))

    # 볏짚 결 디테일 라인들 (자연스러운 볏짚 빗질 결)
    for s in range(24):
        ang_ratio = s / 23.0
        bx = 100 + ang_ratio * 824
        tx = 350 + ang_ratio * 324
        x_min, x_max = min(bx - 40, tx + 40), max(bx - 40, tx + 40)
        roof_draw.arc([x_min, 220, x_max, 480], start=210, end=270, fill=(254, 240, 138, 240), width=4)
        x_min2, x_max2 = min(bx - 20, tx + 20), max(bx - 20, tx + 20)
        roof_draw.arc([x_min2, 250, x_max2, 495], start=200, end=260, fill=(180, 83, 9, 180), width=3)

    # 하단 볏짚 처마 층 (이중 처마 볼륨감)
    for i in range(num_scallops):
        t0 = i / num_scallops
        t1 = (i + 1) / num_scallops
        x0 = 50 + t0 * 924
        x1 = 50 + t1 * 924
        mid_x = (x0 + x1) / 2
        roof_draw.chord([x0, 440, x1, 515], start=0, end=180, fill=(251, 191, 36, 255), outline=INK, width=4)
        # 처마 끝 가닥
        roof_draw.line([(mid_x - 6, 475), (mid_x - 3, 508)], fill=(254, 243, 199, 255), width=3)
        roof_draw.line([(mid_x + 6, 475), (mid_x + 8, 506)], fill=(180, 83, 9, 220), width=3)

    # 3. 지붕 꼭대기 마루 & 엮음 볏단 새끼줄
    roof_draw.rounded_rectangle([280, 100, 744, 185], radius=35, fill=(217, 119, 6, 255), outline=INK, width=6)
    roof_draw.line([(310, 125), (714, 125)], fill=(254, 240, 138, 255), width=6)
    for bx in range(320, 710, 42):
        roof_draw.line([(bx, 95), (bx + 16, 190)], fill=(120, 53, 15, 255), width=5)
        roof_draw.line([(bx + 16, 95), (bx, 190)], fill=(120, 53, 15, 255), width=5)

    # 512 x 680 으로 최고급 Lanczos 리샘플링 다운스케일
    final_img = img.resize((FW, FH), Image.Resampling.LANCZOS)
    return final_img

if __name__ == '__main__':
    print("Rendering fairytale straw house v2...")
    h1 = render_straw_house_v2()
    h1.save('assets/house_straw.png', 'PNG')
    h1.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/v2_house_straw.png', 'PNG')
    print("Done v2!")
