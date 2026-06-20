---
title: Introduction
description: What AetherEngine is, the single player surface it exposes, and what it deliberately does not do.
---

AetherEngine is a media player engine for Apple platforms. FFmpeg demuxes, VideoToolbox decodes, AVPlayer handles Dolby Atmos. It gets the hard parts right (HDR, Dolby Vision, Dolby Atmos, container coverage, codec coverage) and exposes a single `AetherPlayerView` (UIKit / AppKit) or `AetherPlayerSurface` (SwiftUI) plus a handful of `async` methods. No `AVPlayerViewController`, no opinionated controls, no analytics. Bind the view, call `play()`, read the published properties for state.

The view is polymorphic: under the hood the engine swaps the hosted CALayer (`AVPlayerLayer` for the native AVPlayer path, `AVSampleBufferDisplayLayer` for the software dav1d fallback path) per session, without the host having to know. You provide the transport bar, the dropdowns, and the pretty.

## What it does not do

Things AetherEngine deliberately leaves to you, so you do not have to read the source to find out:

- No built-in UI: no controls, transport bar, or HUD.
- No external analytics or session reporting. A 1 Hz `engine.diagnostics.liveTelemetry` surface is provided for host UIs that render runtime stats locally; nothing leaves the device.
- No playlist or queue management. Call `load(url:)` for the next one.
- No subtitle overlay. The engine emits `SubtitleCue` (text or `CGImage`); your UI paints them.
- No Metal shaders. Everything renders through Apple's native display stack.
- No third-party networking. `URLSession` handles bytes, so TLS, HTTP/3, proxies, and MDM rules ride for free.

For codec and format depth see [Formats & codecs](/reference/formats/); for how the pipelines fit together see [Architecture](/reference/architecture/).
