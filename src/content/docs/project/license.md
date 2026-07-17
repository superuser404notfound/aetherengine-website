---
title: License
description: LGPL-3.0 with an Apple Store / DRM exception.
---

AetherEngine is licensed under [LGPL-3.0 with an Apple Store / DRM Exception](https://github.com/superuser404notfound/AetherEngine/blob/main/LICENSE).

The exception clause grants explicit permission to distribute through application stores (Apple App Store, TestFlight, and similar) whose terms otherwise conflict with LGPL sections 4 to 6. Modifications to the engine itself still have to be released under LGPL.

This is what lets any app, closed source included, ship AetherEngine through the App Store while the engine stays open. ([Sodalite](https://sodalite.superuser404.de) itself is open source under GPL-3.0 with the same store exception.)

## FFmpeg and other third-party components

The exception above covers AetherEngine's own code only; it cannot and does not extend to FFmpeg's copyright holders. FFmpeg reaches your app through the [FFmpegBuild](https://github.com/superuser404notfound/FFmpegBuild) package as **dynamically linked frameworks** under plain LGPL-2.1-or-later (built without GPL components). Dynamic linking is what keeps the LGPL relink requirement satisfiable for closed-source App Store apps. FFmpegBuild's README documents the exact per-component licenses (FFmpeg LGPL-2.1+, dav1d BSD-2-Clause, zimg WTFPL, libzvbi LGPL-2.0+) and the concrete steps an adopting app has to take.
