---
title: Introduction
description: What AetherEngine is, the single player surface it exposes, and what it deliberately does not do.
---

AetherEngine is a media player engine for Apple platforms. FFmpeg demuxes, VideoToolbox decodes, AVPlayer handles Dolby Atmos. It gets the hard parts right (HDR, Dolby Vision, Dolby Atmos, container coverage, codec coverage) and exposes a single `AetherPlayerView` (UIKit / AppKit) or `AetherPlayerSurface` (SwiftUI) plus a handful of `async` methods. No `AVPlayerViewController`, no opinionated controls, no analytics. Bind the view, call `play()`, read the published properties for state.

The view is polymorphic: under the hood the engine swaps the hosted CALayer (`AVPlayerLayer` for the native AVPlayer path, `AVSampleBufferDisplayLayer` for the software dav1d fallback path) per session, without the host having to know. You provide the transport bar, the dropdowns, and the pretty.

## How it compares

On Apple platforms the real choice is between AVPlayer, with deep OS integration but only the formats Apple ships, and a VLC- or mpv-derived engine, which plays almost anything but renders its own frames and bypasses the system's Dolby Vision, Atmos, and HDR handling. AetherEngine is built to give you both: FFmpeg's format breadth layered on top of VideoToolbox and AVPlayer, so Dolby Vision, Atmos, and Match Content keep working.

| | AetherEngine | AVPlayer | VLCKit | libmpv |
|---|---|---|---|---|
| **Approach** | Embeddable engine, Apple-only | Apple's built-in player | libVLC wrapped for Apple | libmpv, cross-platform |
| **Container & codec breadth** | Wide, FFmpeg demux | Narrow, Apple's set | Wide | Wide |
| **Hardware decode** | VideoToolbox, dav1d SW fallback | VideoToolbox | VideoToolbox plus software | VideoToolbox plus software |
| **Dolby Vision** | P5, P7 as 8.1, P8.1, P8.4, AV1 P10.x, real display switch | P5 and P8.1 only | Tone-maps, no DV display | Tone-maps, no DV display |
| **Dolby Atmos** | EAC3+JOC stream-copied (HDMI MAT, spatial) | EAC3+JOC passthrough | Decodes to PCM, no object passthrough | No Atmos passthrough on Apple |
| **HDR on tvOS** | Native Match Content switch | Native Match Content | Software tone-mapping | Software tone-mapping |
| **Rendering & UI** | OS-native, you ship SwiftUI | OS-native, you ship UI | Own renderer, bundled controls | Own renderer, bundled OSC |
| **Apple TV / App Store** | Yes, LGPL plus store exception | Yes | Yes, LGPL | Not practical, GPL, no tvOS |

The engine leans on the platform where the platform is best (hardware decode, Dolby Vision display, Atmos passthrough) and only falls back to its own software path (dav1d, libavcodec) for the formats VideoToolbox cannot handle.

## What it does not do

Things AetherEngine deliberately leaves to you, so you do not have to read the source to find out:

- No built-in UI: no controls, transport bar, or HUD.
- No external analytics or session reporting. A 1 Hz `engine.diagnostics.liveTelemetry` surface is provided for host UIs that render runtime stats locally; nothing leaves the device.
- No playlist or queue management. Call `load(url:)` for the next one.
- No subtitle overlay. The engine emits `SubtitleCue` (text or `CGImage`); your UI paints them.
- No Metal shaders. Everything renders through Apple's native display stack.
- No third-party networking. `URLSession` handles bytes, so TLS, HTTP/3, proxies, and MDM rules ride for free.

For codec and format depth see [Formats & codecs](/reference/formats/); for how the pipelines fit together see [Architecture](/reference/architecture/).
