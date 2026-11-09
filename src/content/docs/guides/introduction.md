---
title: Introduction
description: What AetherEngine is, what it gives you, and where to go next.
---

AetherEngine is a video and audio player engine for iOS, tvOS, macOS and visionOS. It plays almost any file or stream and keeps Apple's own HDR, Dolby Vision and Dolby Atmos handling intact.

## How it works

- **FFmpeg** opens the file. **VideoToolbox** decodes in hardware. **AVPlayer** presents the picture and passes Dolby Atmos through.
- Formats Apple cannot decode go to the engine's own software decoder (dav1d, libavcodec).
- The engine swaps the layer behind the view per session (`AVPlayerLayer` on the native path, `AVSampleBufferDisplayLayer` on the software path). Your app does not need to know which one is active.

## What you get

One view, `AetherPlayerView` (UIKit / AppKit) or `AetherPlayerSurface` (SwiftUI), and a few `async` methods. There is no `AVPlayerViewController`, no built-in controls and no analytics. You bind the view, call `play()`, and read the published properties for state. You build the transport bar and menus.

## Highlights

- **Plays nearly everything:** MKV, MP4, WebM, MPEG-TS, AVI, WMV, DVD and Blu-ray ISOs, on-demand MPEG-DASH, and every codec FFmpeg knows.
- **HDR done right:** HDR10, HDR10+, HLG, and Dolby Vision Profiles 5, 7, 8 and AV1 Profile 10, with the real display switch on Apple TV.
- **Dolby Atmos:** E-AC-3 Atmos is passed through untouched, to HDMI receivers and to AirPods with spatial audio.
- **Lossless height channels from TrueHD and DTS:X** as an optional component.
- **Subtitles of every kind:** text, ASS, PGS, DVB, DVD, teletext, closed captions, external files, and subtitles that survive Picture in Picture and AirPlay.
- **Live TV:** HLS ingest, DVR timeshift, recording over the same connection, and recovery when a channel breaks.
- **Any source:** URLs, your own byte reader (`IOReader`), and SMB shares.

## What it does not do

- No built-in UI, no analytics, no playlist or queue, no subtitle overlay. The engine hands you the data; your app draws it.
- Nothing leaves the device.

The full list is on the [Features](/guides/features/#what-the-engine-does-not-do) page.

## Next steps

1. [Installation](/guides/installation/): add the package and pick optional components.
2. [Host guide](/guides/host-guide/): build your first player, then live TV and tvOS setup.
3. [API reference](/reference/api/): every public API and the contracts your app has to answer.
