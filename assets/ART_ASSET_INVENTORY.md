# 《科大守卫战》美术素材整理清单

## 源文件

- `assets/ustc_defense_asset_sheet_gemini.png`：Gemini 生成的总素材表，作为原始拆图来源保留。
- `assets/source/supplemental_asset_sheet_imagegen.png`：使用 image 生成补齐的缺失素材表。
- `assets/source/enemy_missing_sheet_imagegen.png`：使用 image2 生成的缺失敌人素材表，已拆分为 PPT、Bug 和四个 Boss。
- `assets/source/tower_levels_sheet_imagegen.png`：使用 image2 生成的防御塔等级素材表，已拆分为 4 种塔的 Lv.1/Lv.2/Lv.3。
- `assets/source/current_map_ui_reference.png`：当前地图/UI 方向参考图，不作为独立 sprite 直接加载。
- `assets/campus-diorama-main.png`：旧沙盘图源文件，暂时保留，不替代当前地图方案。

## 已整理的独立素材

### 地图与玩法辅助

- `assets/maps/map_east_campus_01.png`：第一张地图“东区一教”纯地图底图。
- `assets/maps/map_gaoxin_campus_01.png`：第二张地图“高新校区”纯地图底图，保留永怀湖、思佩桥、右侧生活区与运动区布局。
- `assets/maps/map_west_campus_01.png`：第三张地图“也西湖”旧版纯地图底图，保留作备份。
- `assets/maps/map_west_campus_02.png`：第三张地图“也西湖”新版纯地图底图，建筑更贴近浅黄色行进道路。
- `assets/maps/flag_entrance.png`：入口旗帜，128×160，透明。
- `assets/maps/flag_exit.png`：出口旗帜，128×160，透明。
- `assets/maps/tower_slot_empty.png`：空塔位，128×128，透明。
- `assets/maps/tower_slot_selected.png`：选中塔位，128×128，透明。
- `assets/maps/range_circle.png`：攻击范围圈，256×256，透明。

### 防御塔

- `assets/towers/tower_math.png`：高数塔，256×256，透明。
- `assets/towers/tower_physics.png`：物理塔，256×256，透明。
- `assets/towers/tower_lab.png`：实验塔，256×256，透明。
- `assets/towers/tower_coffee.png`：咖啡塔，256×256，透明。
- `assets/towers/tower_math_lv1.png`、`tower_math_lv2.png`、`tower_math_lv3.png`：高数塔 1-3 级当前游戏内素材，256×256，透明。
- `assets/towers/tower_physics_lv1.png`、`tower_physics_lv2.png`、`tower_physics_lv3.png`：物理塔 1-3 级当前游戏内素材，256×256，透明。
- `assets/towers/tower_lab_lv1.png`、`tower_lab_lv2.png`、`tower_lab_lv3.png`：实验塔 1-3 级当前游戏内素材，256×256，透明。
- `assets/towers/tower_coffee_lv1.png`、`tower_coffee_lv2.png`、`tower_coffee_lv3.png`：咖啡塔 1-3 级当前游戏内素材，256×256，透明。

### 敌人

- `assets/enemies/enemy_homework.png`：作业怪，160×160，透明。
- `assets/enemies/enemy_report.png`：实验报告怪，180×180，透明。
- `assets/enemies/enemy_ddl.png`：DDL 怪，160×160，透明。
- `assets/enemies/enemy_ppt.png`：PPT 怪，160×160，透明。
- `assets/enemies/enemy_bug.png`：Bug 幼虫，160×160，透明。
- `assets/enemies/enemy_boss_midterm.png`：期中试卷 Boss，220×220，透明。
- `assets/enemies/enemy_boss_ddl.png`：DDL 总负责人，220×220，透明。
- `assets/enemies/enemy_boss_lab.png`：实验验收 Boss，220×220，透明。
- `assets/enemies/enemy_boss_thesis.png`：毕业论文 Boss，220×220，透明。

### UI 图标

- `assets/ui/icon_hp.png`：生命图标，64×64，透明。
- `assets/ui/icon_coin.png`：金币图标，64×64，透明。
- `assets/ui/icon_wave.png`：波次图标，64×64，透明。
- `assets/ui/icon_upgrade.png`：升级图标，64×64，透明。
- `assets/ui/icon_sell.png`：出售图标，64×64，透明。
- `assets/ui/icon_pause.png`：暂停图标，64×64，透明。
- `assets/ui/icon_help.png`：帮助图标，64×64，透明。
- `assets/ui/icon_setting.png`：设置图标，64×64，透明。
- `assets/ui/icon_wave_shield.png`：补充盾牌波次/目标图标，64×64，透明。

### 建造栏塔卡小图

- `assets/ui/tower_card_math.png`：高数塔卡小图，96×96，透明。
- `assets/ui/tower_card_physics.png`：物理塔卡小图，96×96，透明。
- `assets/ui/tower_card_lab.png`：实验塔卡小图，96×96，透明。
- `assets/ui/tower_card_coffee.png`：咖啡塔卡小图，96×96，透明。

### 特效

- `assets/effects/fx_bullet_blue.png`：蓝色魔法弹，64×64，透明。
- `assets/effects/fx_bullet_orange.png`：橙色物理弹，64×64，透明。
- `assets/effects/fx_bullet_green.png`：绿色实验液滴，64×64，透明。
- `assets/effects/fx_slow_wave.png`：咖啡减速波纹，128×128，透明。
- `assets/effects/fx_hit_spark.png`：命中火花，96×96，透明。

## 处理脚本与 QA

- `tools/extract_asset_sheet.py`：拆图、去底、统一画布尺寸、生成塔位/范围圈的脚本。
- `qa-shots/asset-extraction-contact-sheet.png`：最终素材接触表，用于快速检查裁剪质量。
- `qa-shots/asset-sheet-coordinate-guide.png`：Gemini 总表坐标参考图。

## 文档缺口状态

`科大守卫战_美术素材制作文档.md` 的 P0 与 P1 独立素材已经补齐。地图底图本轮按用户指定使用当前地图方案，因此没有从 Gemini 表中拆出 `map_east_campus_01.png`。

后续如果进入 P2，再补：攻击动画帧、敌人行走动画帧，以及更多 UI 状态图标。
