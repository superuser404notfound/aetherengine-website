---
title: Installation
description: Add AetherEngine with Swift Package Manager, plus the optional SMB and custom input-source products.
---

Add AetherEngine with Swift Package Manager:

```swift
.package(url: "https://github.com/superuser404notfound/AetherEngine", from: "3.11.6")
```

Pin to `.upToNextMinor(from: "3.11.6")` for teams that prefer to opt into minor bumps explicitly. FFmpegBuild is a transitive dependency and is resolved automatically.

## Requirements

| | Min |
| --- | --- |
| iOS | 16.0 |
| tvOS | 16.0 |
| macOS | 14.0 |
| Swift | 6.0 |
| Xcode | 16.0 |

## Examples

Two complementary samples ship in the repo `Examples/` directory:

- **MinimalPlayer** is a 90-line SwiftUI drop-in. Copy the file into a new tvOS / iOS / macOS app, point at a URL, run.
- **DemoPlayerMac** is a standalone macOS app for testers. Drop a file on the window, it plays. A notarized universal `.dmg` is attached to every [GitHub Release](https://github.com/superuser404notfound/AetherEngine/releases/latest).

## Custom input source

Play any byte source by implementing the `IOReader` protocol and loading it with `load(source:)`:

```swift
let probe = try await engine.load(source: .custom(MyArchiveReader(), formatHint: "mp4"))
```

Seekable readers support audio-track switching and background reload; embedded subtitles and scrub-preview thumbnails additionally need `makeIndependentReader()` (a second cursor). The full contract is in [Formats & codecs](/reference/formats/).

## SMB shares (optional product)

Playing media off an SMB2/3 share is a ready-made `IOReader`, shipped as a separate `AetherEngineSMB` product so the SMB dependency only enters consumers that opt in:

```swift
import AetherEngineSMB

let smb = try await SMBConnection.connect(
    server: URL(string: "smb://nas.local")!, share: "media",
    path: "Movies/film.mkv", user: "alice", password: "s3cret"
)
try await engine.load(source: .custom(SMBIOReader(source: smb), formatHint: "matroska"))
```

Read-only, NTLMv2 / guest auth (no Kerberos). On tvOS the host must declare `NSLocalNetworkUsageDescription` plus the local-network entitlement to reach a LAN share.
