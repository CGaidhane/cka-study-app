# Graph Report - cka-study-app  (2026-06-10)

## Corpus Check
- 22 files · ~78,279 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 163 nodes · 149 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2a05ab1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `compilerOptions` - 16 edges
3. `Certified Kubernetes Administrator (CKA) Interactive Study & DevOps Lab App` - 10 edges
4. `scripts` - 5 edges
5. `🛠 Local Development & Build Guide` - 5 edges
6. `✨ Premium Native Features` - 4 edges
7. `MainActivity` - 3 edges
8. `App()` - 3 edges
9. `ExampleInstrumentedTest` - 2 edges
10. `Test` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (22 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (22): BLOCKS, C, CAT, CATEGORIES, CMD_CAT_COLOR, CMD_CATS, COMMANDS, CONCEPTS (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (18): devDependencies, autoprefixer, @capacitor/assets, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (17): 1. Self-Contained Web Audio Engine, 2. Native Device Haptic Feedback, 3. Robust Permanent State Synchronization, Certified Kubernetes Administrator (CKA) Interactive Study & DevOps Lab App, Contributing, 📱 Direct APK Installation (Recommended for Mobile), License, 🛠 Local Development & Build Guide (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, lucide-react, react, react-dom, name (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.47
Nodes (4): MainActivity, BridgeActivity, Bundle, Override

### Community 9 - "Community 9"
Cohesion: 0.67
Nodes (3): App(), micro(), useFx()

## Knowledge Gaps
- **104 isolated node(s):** `Override`, `config`, `name`, `private`, `version` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 2` to `Community 5`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `Override`, `config`, `name` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._