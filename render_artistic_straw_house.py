# -*- coding: utf-8 -*-
"""
render_artistic_straw_house.py
초고화질 2x 슈퍼샘플링(1024x1360) 동화풍 황금 볏짚 초가집
"""

import math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

# 2x 슈퍼샘플링 캔버스
SW, SH = 1024, 1360
FINAL_W, FINAL_H = 512, 680

def get_gradient_2d(w, h, top_color, bot_color):
    """부드러운 수직 그라데이션 배열 생성"""
    r1, g1, b1, a1 = top_color
    r2, g2, b2, a2 = bot_color
    y = np.linspace(0, 1, h)[:, None]
    r = (r1 * (1 - y) + r2 * y).astype(np.uint8)
    g = (g1 * (1 - y) + g2 * y).astype(np.uint8)
    b = (b1 * (1 - y) + b2 * y).astype(np.uint8)
    a = (a1 * (1 - y) + a2 * y).astype(np.uint8)
    r = np.repeat(r, w, axis=1)
    g = np.repeat(g, w, axis=1)
    b = np.repeat(b, w, axis=1)
    a = np.repeat(a, w, axis=1)
    return np.dstack((r, g, b, a))

def create_fairytale_straw_house():
    base = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))

    # =========================================================================
    # 1. 굴뚝 (오른쪽 위 낭만적인 굽은 돌굴뚝 + 연기)
    # =========================================================================
    chim_img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(chim_img)
    # 연기 (몽실몽실 투명도 그라데이션)
    smoke_clouds = [
        (760, 90, 40, 220),
        (795, 60, 55, 180),
        (845, 30, 70, 140),
        (910, 10, 85, 90)
    ]
    for sx, sy, sr, sa in smoke_clouds:
        cdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, sa))
    # 굴뚝 몸체 (자연석 벽돌 느낌)
    chim_pts = [(700, 170), (790, 160), (775, 410), (690, 420)]
    cdraw.polygon(chim_pts, fill=(168, 162, 158, 255), outline=(68, 64, 60, 255))
    # 굴뚝 림
    cdraw.rounded_rectangle([685, 155, 805, 195], radius=10, fill=(120, 113, 108, 255), outline=(44, 40, 36, 255), width=6)
    # 굴뚝 개별 호박돌 텍스처
    for cy in range(210, 400, 36):
        cdraw.line([(695, cy), (780, cy - 4)], fill=(68, 64, 60, 200), width=4)
        for cx in [720, 755]:
            cdraw.line([(cx, cy), (cx, cy + 34)], fill=(68, 64, 60, 200), width=3)
    base.alpha_composite(chim_img)

    # =========================================================================
    # 2. 기초 호박돌 & 이끼 & 버섯 (Foundation)
    # =========================================================================
    found_img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(found_img)
    fy1, fy2 = 1130, 1280
    fx1, fx2 = 100, 924
    # 기초 바탕 흙/그림자
    fdraw.rounded_rectangle([fx1 - 15, fy1, fx2 + 15, fy2], radius=35, fill=(60, 50, 40, 255))
    
    # 둥글둥글한 자연 호박돌 4단 배치
    stone_cols = [
        (168, 162, 158, 255), (140, 134, 130, 255), (120, 113, 108, 255),
        (190, 185, 180, 255), (100, 95, 90, 255)
    ]
    np.random.seed(101)
    for row in range(4):
        cury = fy1 + 8 + row * 36
        num_stones = 10
        sw = (fx2 - fx1) / num_stones
        for col in range(num_stones + 1):
            curx = fx1 - 10 + col * sw + (row % 2) * (sw * 0.4)
            rw = sw * 1.05
            rh = 38
            scol = stone_cols[(row * 3 + col) % len(stone_cols)]
            fdraw.rounded_rectangle([curx, cury, curx + rw, cury + rh], radius=18, fill=scol, outline=(50, 45, 40, 255), width=4)
            # 하이라이트 곡선
            fdraw.arc([curx + 6, cury + 4, curx + rw - 6, cury + rh - 4], start=180, end=300, fill=(240, 238, 235, 190), width=4)

    # 푹신푹신한 초록 이끼 덤불
    moss_cols = [(101, 163, 13, 255), (77, 124, 15, 255), (132, 204, 22, 255), (63, 98, 18, 255)]
    for m in range(24):
        mx = fx1 + m * 35 + (m % 3) * 6
        my = fy2 - 12 + (m % 2) * 8
        mr = 24 + (m % 4) * 6
        fdraw.ellipse([mx - mr, my - mr*0.6, mx + mr, my + mr*0.6], fill=moss_cols[m % len(moss_cols)])

    # 배경과 똑같은 예쁜 빨간 점박이 버섯 & 파란 버섯들!
    def draw_shroom(draw, cx, cy, cap_w, cap_h, is_blue=False):
        sw = cap_w * 0.35
        sh = cap_h * 1.1
        draw.rounded_rectangle([cx - sw/2, cy - sh + cap_h*0.3, cx + sw/2, cy], radius=int(sw/2), fill=(250, 245, 235, 255), outline=(160, 140, 120, 255), width=3)
        c_fill = (56, 189, 248, 255) if is_blue else (239, 68, 68, 255)
        c_dark = (2, 132, 199, 255) if is_blue else (185, 28, 28, 255)
        draw.chord([cx - cap_w/2, cy - sh - cap_h*0.4, cx + cap_w/2, cy - sh + cap_h*0.7], start=180, end=360, fill=c_fill, outline=c_dark, width=3)
        # 점
        dr = cap_w * 0.1
        for dx, dy in [(-cap_w*0.25, 0.05), (cap_w*0.2, 0.1), (0, -0.2)]:
            px = cx + dx
            py = cy - sh + cap_h * dy
            draw.ellipse([px - dr, py - dr, px + dr, py + dr], fill=(255, 255, 255, 245))

    draw_shroom(fdraw, 80, 1270, 56, 42, is_blue=False)
    draw_shroom(fdraw, 125, 1285, 38, 30, is_blue=True)
    draw_shroom(fdraw, 930, 1275, 54, 40, is_blue=False)
    draw_shroom(fdraw, 885, 1290, 36, 28, is_blue=False)
    base.alpha_composite(found_img)

    # =========================================================================
    # 3. 1층 툇마루 / 원목 데크 (아기돼지 삼형제가 편안히 서는 공간!)
    # =========================================================================
    deck_img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    ddraw = ImageDraw.Draw(deck_img)
    dy1, dy2 = 880, 1145
    dx1, dx2 = 120, 904
    # 마루 하부 그림자 및 지지 기둥
    ddraw.rounded_rectangle([dx1, dy1 + 40, dx2, dy2], radius=15, fill=(120, 53, 15, 255), outline=(67, 20, 7, 255), width=6)
    # 기둥들
    for px in [150, 300, 512, 720, 870]:
        ddraw.rounded_rectangle([px - 18, dy1 + 30, px + 18, dy2], radius=8, fill=(90, 35, 10, 255), outline=(50, 18, 5, 255), width=4)
        # 나뭇결
        ddraw.line([(px, dy1 + 35), (px, dy2 - 5)], fill=(146, 64, 14, 200), width=3)
    # 마루 상판 (두툼한 원목 마루 슬래브)
    slab_box = [dx1 - 25, dy1, dx2 + 25, dy1 + 55]
    ddraw.rounded_rectangle(slab_box, radius=16, fill=(217, 119, 6, 255), outline=(120, 53, 15, 255), width=6)
    # 마루 상판 하이라이트
    ddraw.line([(dx1 - 15, dy1 + 10), (dx2 + 15, dy1 + 10)], fill=(251, 191, 36, 240), width=6)
    # 세로 원목 판자 이음선
    for sx in range(dx1 - 10, dx2 + 20, 68):
        ddraw.line([(sx, dy1 + 5), (sx, dy1 + 50)], fill=(120, 53, 15, 255), width=3)
    base.alpha_composite(deck_img)

    # =========================================================================
    # 4. 방 벽체 (포근한 크림색 회벽 & 굽은 원목 뼈대 기둥)
    # =========================================================================
    wall_img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    wdraw = ImageDraw.Draw(wall_img)
    wy1, wy2 = 460, dy1 + 15
    wx1, wx2 = 160, 864
    # 벽면 (동화풍 사다리꼴 - 위가 살짝 좁아져 귀엽고 안정적인 형태)
    wall_pts = [(190, wy1), (834, wy1), (wx2, wy2), (wx1, wy2)]
    wdraw.polygon(wall_pts, fill=(254, 243, 199, 255), outline=(146, 64, 14, 255))
    # 따스한 벽면 질감 (미세한 질감 선)
    for py in range(wy1 + 40, wy2, 45):
        wdraw.line([(wx1 + 30, py), (wx2 - 30, py)], fill=(253, 230, 138, 140), width=3)

    # 코너 목재 기둥 (자연스러운 굽은 통나무 기둥)
    wdraw.line([(190, wy1), (wx1, wy2)], fill=(120, 53, 15, 255), width=24)
    wdraw.line([(834, wy1), (wx2, wy2)], fill=(120, 53, 15, 255), width=24)
    # 중앙 지주목
    wdraw.line([(512, wy1), (512, wy2)], fill=(146, 64, 14, 255), width=18)
    base.alpha_composite(wall_img)

    # =========================================================================
    # 5. 아치형 낭만 원목 문 (오른쪽 방)
    # =========================================================================
    door_img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    dodraw = ImageDraw.Draw(door_img)
    dor_x1, dor_x2 = 560, 800
    dor_y1, dor_y2 = 510, wy2
    # 아치 문틀 (짙은 호두나무색)
    dodraw.chord([dor_x1 - 10, dor_y1 - 50, dor_x2 + 10, dor_y1 + 110], start=180, end=360, fill=(90, 35, 10, 255), outline=(50, 18, 5, 255), width=6)
    dodraw.rectangle([dor_x1 - 10, dor_y1 + 30, dor_x2 + 10, dor_y2], fill=(90, 35, 10, 255), outline=(50, 18, 5, 255), width=6)
    # 문짝 판자들
    dodraw.chord([dor_x1, dor_y1 - 40, dor_x2, dor_y1 + 100], start=180, end=360, fill=(180, 83, 9, 255))
    dodraw.rectangle([dor_x1, dor_y1 + 30, dor_x2, dor_y2 - 6], fill=(180, 83, 9, 255))
    for px in [620, 680, 740]:
        dodraw.line([(px, dor_y1 + 10), (px, dor_y2 - 6)], fill=(120, 53, 15, 255), width=4)
    # 중세풍 단조 철물 경첩 & 금빛 손잡이 고리
    dodraw.rounded_rectangle([dor_x1 - 6, dor_y1 + 80, dor_x1 + 65, dor_y1 + 104], radius=6, fill=(30, 41, 59, 255))
    dodraw.rounded_rectangle([dor_x1 - 6, dor_y1 + 240, dor_x1 + 65, dor_y1 + 264], radius=6, fill=(30, 41, 59, 255))
    # 황금 고리 손잡이
    dodraw.ellipse([735, dor_y1 + 160, 775, dor_y1 + 200], fill=(251, 191, 36, 255), outline=(180, 83, 9, 255), width=5)
    dodraw.ellipse([747, dor_y1 + 172, 763, dor_y1 + 188], fill=(180, 83, 9, 255))
    base.alpha_composite(door_img)

    # =========================================================================
    # 6. 아기자기한 촛불 창문 (왼쪽 방) + 꽃 화분 + 따스한 조명 글로우
    # =========================================================================
    win_cx, win_cy = 340, 660
    # 창문 조명 빛 번짐 (글로우)
    glow_img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow_img)
    gdraw.ellipse([win_cx - 150, win_cy - 150, win_cx + 150, win_cy + 150], fill=(254, 240, 138, 90))
    gdraw.ellipse([win_cx - 90, win_cy - 90, win_cx + 90, win_cy + 90], fill=(253, 224, 71, 140))
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(32))
    base.alpha_composite(glow_img)

    win_img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    wndraw = ImageDraw.Draw(win_img)
    wx1, wy1, wx2, wy2 = 240, 550, 440, 770
    # 둥근 창틀
    wndraw.rounded_rectangle([wx1 - 12, wy1 - 12, wx2 + 12, wy2 + 12], radius=32, fill=(120, 53, 15, 255), outline=(67, 20, 7, 255), width=6)
    wndraw.rounded_rectangle([wx1, wy1, wx2, wy2], radius=24, fill=(254, 240, 138, 255))
    # 십자 창살
    wndraw.line([(win_cx, wy1), (win_cx, wy2)], fill=(120, 53, 15, 255), width=8)
    wndraw.line([(wx1, win_cy), (wx2, win_cy)], fill=(120, 53, 15, 255), width=8)
    # 꽃 화분대 (창문 아래 풍성한 동화 꽃들)
    fb_y = wy2 + 8
    wndraw.rounded_rectangle([wx1 - 16, fb_y, wx2 + 16, fb_y + 40], radius=8, fill=(146, 64, 14, 255), outline=(90, 35, 10, 255), width=5)
    flower_cols = [(244, 63, 94, 255), (251, 113, 133, 255), (255, 255, 255, 255), (250, 204, 21, 255), (192, 132, 252, 255)]
    for i in range(11):
        flx = wx1 - 5 + i * 21
        fly = fb_y - 8 + (i % 2) * 8
        # 초록 잎사귀
        wndraw.ellipse([flx - 10, fly + 4, flx + 10, fly + 16], fill=(34, 197, 94, 255))
        # 꽃잎
        wndraw.ellipse([flx - 9, fly - 9, flx + 9, fly + 9], fill=flower_cols[i % len(flower_cols)])
        wndraw.ellipse([flx - 3, fly - 3, flx + 3, fly + 3], fill=(253, 224, 71, 255))
    base.alpha_composite(win_img)

    # =========================================================================
    # 7. 풍성하고 둥글둥글한 동화풍 황금 볏짚 지붕 (Fluffy Storybook Thatch Roof)
    # =========================================================================
    roof_img = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(roof_img)

    # 지붕 그림자 (벽체에 드리우는 부드러운 그림자)
    rdraw.ellipse([140, 480, 884, 570], fill=(0, 0, 0, 70))

    # 3단 입체 볏짚 볼륨 (하단 볏짚 단 -> 중단 -> 상단 지붕 마루)
    # Tier 1 (하단 넓은 처마 지붕)
    t1_y1, t1_y2 = 300, 530
    rdraw.chord([40, 180, 984, 530], start=0, end=180, fill=(217, 119, 6, 255), outline=(146, 64, 14, 255), width=6)
    rdraw.ellipse([40, 220, 984, 510], fill=(245, 158, 11, 255))

    # 물결치는 사랑스러운 볏짚 처마 술 (Scalloped Straw Fringe)
    num_fringes = 18
    f_w = 944 / num_fringes
    for i in range(num_fringes):
        fcx = 40 + i * f_w + f_w/2
        fcy = 505 + math.sin(i * 0.6) * 12
        rdraw.ellipse([fcx - f_w*0.6, fcy - 24, fcx + f_w*0.6, fcy + 24], fill=(251, 191, 36, 255), outline=(180, 83, 9, 255), width=4)
        # 볏짚 가닥 하이라이트
        rdraw.line([(fcx - 6, fcy - 12), (fcx - 4, fcy + 18)], fill=(254, 240, 138, 255), width=3)
        rdraw.line([(fcx + 6, fcy - 10), (fcx + 8, fcy + 16)], fill=(217, 119, 6, 255), width=2)

    # Tier 2 (중단 볏짚 돔)
    rdraw.chord([120, 160, 904, 420], start=180, end=360, fill=(251, 191, 36, 255), outline=(180, 83, 9, 255), width=6)
    rdraw.ellipse([130, 200, 894, 380], fill=(252, 211, 77, 255))
    # 볏짚 결 라인들
    for s in range(22):
        sx = 160 + s * 33
        rdraw.arc([sx - 30, 200, sx + 40, 390], start=210, end=270, fill=(254, 243, 199, 230), width=4)
        rdraw.arc([sx - 15, 230, sx + 25, 420], start=200, end=260, fill=(180, 83, 9, 180), width=3)

    # Tier 3 (상단 지붕 꼭대기 마루 & 엮음 새끼줄)
    rdraw.rounded_rectangle([300, 120, 724, 200], radius=35, fill=(217, 119, 6, 255), outline=(146, 64, 14, 255), width=6)
    rdraw.line([(320, 145), (704, 145)], fill=(254, 240, 138, 255), width=6)
    # 지붕 엮음 서까래/새끼줄 볏단 교차 핀
    for bx in range(330, 700, 42):
        rdraw.line([(bx, 115), (bx + 14, 205)], fill=(120, 53, 15, 255), width=5)
        rdraw.line([(bx + 14, 115), (bx, 205)], fill=(120, 53, 15, 255), width=5)

    base.alpha_composite(roof_img)

    # 512 x 680 으로 최고급 Lanczos 리샘플링 다운스케일 (자연스러운 안티에일리어싱 완성!)
    final_img = base.resize((FINAL_W, FINAL_H), Image.Resampling.LANCZOS)
    return final_img

if __name__ == '__main__':
    print("Rendering artistic fairytale straw house...")
    h1 = create_fairytale_straw_house()
    h1.save('assets/house_straw.png', 'PNG')
    h1.save('C:/Users/june/.gemini/antigravity/brain/c418be0f-f4b0-413e-938c-29718c43c6f4/artistic_house_straw.png', 'PNG')
    print("Done!")
