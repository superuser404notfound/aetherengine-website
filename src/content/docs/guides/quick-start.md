---
title: Quick start
description: Bind the player surface, load a URL, and read playback state.
---

```swift
import AetherEngine
import SwiftUI

let player = try AetherEngine()

// SwiftUI: drop AetherPlayerSurface anywhere in the view tree
var body: some View { AetherPlayerSurface(engine: player) }

// UIKit / AppKit: bind an AetherPlayerView directly
let surface = AetherPlayerView()
player.bind(view: surface)

try await player.load(url: videoURL)                            // or with a resume position
try await player.load(url: videoURL, startPosition: 347.5)
try await player.load(url: videoURL, options: .init(
    httpHeaders: headers,              // attached to every demux + segment fetch
    matchContentEnabled: matchContent  // tvOS Match Content master toggle
))
try await player.reloadAtCurrentPosition()                      // background reopen, preserves options
try await player.load(url: trackURL, options: .init(audioOnly: true))   // lean audio path

// Transport
player.play()
player.pause()
player.togglePlayPause()
player.setRate(1.5)                    // clamped to player.maxSupportedRate (2x video, 3x audio-only)
await player.seek(to: 120)
player.stop()

// State (Combine @Published)
player.$state          // .idle, .loading, .playing, .paused, .seeking, .error
player.$duration
player.$videoFormat    // .sdr, .hdr10, .hdr10Plus, .dolbyVision, .hlg
player.$isSeeking      // true until a seek physically lands (programmatic + native scrubs)
player.$seekTarget     // in-flight seek destination (source-PTS), nil otherwise
player.$currentAVPlayer // active AVPlayer, re-emitted on every reload (MPNowPlayingSession)

// Time lives on player.clock, a SEPARATE ObservableObject, so the ~10 Hz
// ticks never fire objectWillChange on the engine.
player.clock.$currentTime   // ~10 Hz playback clock (transport / scrub / resume)
player.clock.$sourceTime    // source PTS of the displayed frame (render subtitles against this)

// Tracks
player.audioTracks                             // [TrackInfo]
player.selectAudioTrack(index: trackID)
player.subtitleTracks                          // [TrackInfo], text + bitmap, one list
player.selectSubtitleTrack(index: streamID)
player.selectSidecarSubtitle(url: srtURL)      // .srt / .ass / .vtt next to the media
player.clearSubtitle()
player.$subtitleCues                           // [SubtitleCue]: .text(String) or .image(SubtitleImage)

// Info panel / Now Playing (iOS / tvOS)
player.setExternalMetadata([ AVMetadataItem(/* title, artwork, etc. */) ])
```

Subtitle cues land in raw source PTS; render the overlay against `player.sourceTime` (see [Formats & codecs](/reference/formats/#subtitles)). The 1 Hz diagnostics snapshot lives on `player.diagnostics.liveTelemetry`, off-the-engine for the same render-stability reason.

## Host setup on tvOS

For HDR / Dolby Vision sources to play reliably on tvOS 26.5+, the engine must drive `AVDisplayManager.preferredDisplayCriteria` itself (synchronously, before the AVPlayerItem assignment). AVKit-auto criteria cannot satisfy this for HLS multivariant HDR sources. The engine-driven sole-writer path is the default:

```swift
// In your AVPlayerViewController subclass
playerVC.appliesPreferredDisplayCriteriaAutomatically = false

// When loading
try await engine.load(url: url, options: LoadOptions(
    suppressDisplayCriteria: false,      // default; engine writes criteria
    matchContentEnabled: matchContent,   // tvOS Match Content master toggle
    panelIsInHDRMode: panelInHDRMode     // current EDR-headroom > 1.0
))
```

`suppressDisplayCriteria` defaults to `false`: `apply()` runs synchronously inside `load(url:)`, `waitForSwitch` blocks until the panel reaches the target mode (or a 5 s timeout), then `replaceCurrentItem` runs against an already-correct panel.

Building custom chrome with a SwiftUI `Menu`? On tvOS 26 an open `Menu`'s focused row blinks on any render transaction in the tree. Build the menu button in UIKit (`UIButton.menu` + `showsMenuAsPrimaryAction`) and guard `updateUIView` so the open dropdown never rebuilds. Pattern in [Architecture](/reference/architecture/).
