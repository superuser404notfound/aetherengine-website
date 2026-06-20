---
title: Stability & versioning
description: The public API stability contract and semantic-versioning policy.
---

AetherEngine uses [Semantic Versioning](https://semver.org). The public API surface, every `public` declaration in `Sources/AetherEngine/`, is the stability contract:

- **Major** removes or renames public symbols, or breaks adopters.
- **Minor** adds public API, or codec / format support.
- **Patch** fixes bugs with no public API change.

`internal` types are not part of the contract.

```swift
.package(url: "https://github.com/superuser404notfound/AetherEngine", from: "3.11.6")
```

Pin to `.upToNextMinor(from: "3.11.6")` for stricter teams that prefer to opt into minor bumps explicitly. The full release history is on the [Changelog](/project/changelog/) page.
