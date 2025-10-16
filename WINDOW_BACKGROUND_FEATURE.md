# 窗口背景自定义功能 / Window Background Customization Feature

## 功能概述 / Overview

此功能允许用户自定义 Clash Verge Rev 的窗口背景，支持三种背景类型：纯色、图片和视频。

This feature allows users to customize the window background of Clash Verge Rev, supporting three types of backgrounds: solid color, image, and video.

## 功能特性 / Features

### 1. 背景类型 / Background Types

- **无背景 (None)**: 使用默认主题背景
- **纯色 (Solid Color)**: 使用自定义颜色作为背景
- **图片 (Image)**: 使用本地图片或在线图片作为背景
- **视频 (Video)**: 使用本地视频或在线视频作为背景

### 2. 效果设置 / Effect Settings

所有背景类型都支持以下效果调整：

All background types support the following effect adjustments:

- **不透明度 (Opacity)**: 0-100%，控制背景的透明度
- **模糊度 (Blur)**: 0-50px，为背景添加模糊效果
- **亮度 (Brightness)**: 0-200%，调整背景亮度
- **混合模式 (Blend Mode)**: 多种CSS混合模式可选

### 3. 图片特定设置 / Image-Specific Settings

- **大小 (Size)**: Cover（覆盖）、Contain（包含）、Auto（自动）、Stretch（拉伸）
- **位置 (Position)**: 中心、顶部、底部、左侧、右侧及各种组合

## 使用方法 / Usage

### 访问设置 / Access Settings

1. 打开应用程序 / Open the application
2. 进入设置页面 / Go to Settings page
3. 在"Verge 基础设置"部分找到"窗口背景设置" / Find "Window Background Settings" in "Verge Basic Setting" section
4. 点击打开背景设置对话框 / Click to open the background settings dialog

### 设置纯色背景 / Set Solid Color Background

1. 选择"纯色"背景类型 / Select "Solid Color" background type
2. 使用颜色选择器或输入颜色代码 / Use color picker or enter color code
3. 调整不透明度和其他效果（可选）/ Adjust opacity and other effects (optional)
4. 设置会实时生效 / Settings take effect in real-time

### 设置图片背景 / Set Image Background

1. 选择"图片"背景类型 / Select "Image" background type
2. 有两种方式添加图片 / Two ways to add image:
   - 点击"选择本地图片"浏览本地文件 / Click "Select Local Image" to browse local files
   - 直接输入图片URL / Enter image URL directly
3. 调整显示选项：大小、位置 / Adjust display options: size, position
4. 调整效果：不透明度、模糊度、亮度 / Adjust effects: opacity, blur, brightness

### 设置视频背景 / Set Video Background

1. 选择"视频"背景类型 / Select "Video" background type
2. 有两种方式添加视频 / Two ways to add video:
   - 点击"选择本地视频"浏览本地文件 / Click "Select Local Video" to browse local files
   - 直接输入视频URL / Enter video URL directly
3. 推荐格式：MP4, WebM / Recommended formats: MP4, WebM
4. 注意：视频背景可能影响性能 / Note: Video backgrounds may impact performance
5. 调整效果设置 / Adjust effect settings

### 重置设置 / Reset Settings

点击对话框底部的"重置为默认"按钮可清除所有背景设置。

Click the "Reset to Default" button at the bottom of the dialog to clear all background settings.

## 技术实现 / Technical Implementation

### 后端 (Rust)

文件: `src-tauri/src/config/verge.rs`

新增字段到 `IVergeTheme` 结构：
- `background_type`: 背景类型
- `background_color`: 纯色背景
- `background_image`: 图片URL
- `background_video`: 视频URL
- `background_opacity`: 不透明度
- `background_blur`: 模糊度
- `background_brightness`: 亮度
- `background_blend_mode`: 混合模式
- `background_size`: 图片大小模式
- `background_position`: 图片位置
- `background_repeat`: 图片重复模式

### 前端 (React/TypeScript)

#### 主要组件

1. **BackgroundViewer** (`src/components/setting/mods/background-viewer.tsx`)
   - 背景设置UI组件
   - 实时预览和应用设置
   - 支持本地文件选择和URL输入

2. **useCustomTheme** (`src/components/layout/use-custom-theme.ts`)
   - 应用背景设置到DOM
   - 通过CSS变量和动态样式实现
   - 支持视频背景的DOM元素创建

3. **Layout** (`src/pages/_layout.tsx`)
   - 渲染视频背景容器
   - 管理背景视频元素的生命周期

#### 国际化支持

已添加中文和英文翻译支持：
- `src/locales/zh.json`
- `src/locales/en.json`

## 注意事项 / Notes

1. **性能考虑 / Performance**
   - 视频背景会增加资源消耗 / Video backgrounds increase resource usage
   - 建议使用优化过的视频文件 / Recommend using optimized video files
   - 高分辨率图片可能影响加载速度 / High-resolution images may affect loading speed

2. **浏览器兼容性 / Browser Compatibility**
   - 混合模式在某些旧版浏览器可能不支持 / Blend modes may not work in older browsers
   - 视频格式支持取决于浏览器 / Video format support depends on browser

3. **文件路径 / File Paths**
   - 本地文件会自动转换为安全的 Tauri 资源URL / Local files are automatically converted to safe Tauri asset URLs
   - 支持绝对路径和相对路径 / Both absolute and relative paths are supported

## 配置存储 / Configuration Storage

所有背景设置都保存在 Verge 配置文件中的 `theme_setting` 对象下，会自动持久化到磁盘。

All background settings are saved under the `theme_setting` object in the Verge configuration file and automatically persisted to disk.

## 开发者注意 / Developer Notes

如需扩展此功能，可以：
- 添加更多背景类型（如渐变、图案）
- 添加预设背景模板
- 实现背景动画效果
- 添加背景轮播功能

To extend this feature, you can:
- Add more background types (gradients, patterns)
- Add preset background templates
- Implement background animation effects
- Add background slideshow functionality


