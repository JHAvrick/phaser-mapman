# MapMan
**This project was primarly an experiment/learning exercise and is not in active development.**

MapMan is a scene editor for [Phaser](https://github.com/photonstorm/phaser) with tools to modify position/scale/orientation and properties of phaser display
objects. Each scene graph is exported as a json and parsed via a MapMan plugin for Phaser. Optionally, MapMan can also handle basic loading
of image assets for each scene.

## Development

### Motivation
Phaser lacks any robust tools for scene-building. The tools that do exist are not very modular, and require that your project be structured to accomodate.

### Goal
Create a scene editor that outputs a JSON representation of a scene to be parsed by a Phaser plugin at runtime.

### Lessons Learned
- Use a design framework: 
    - The workload for building a desktop-like UI from stratch is cumbersome. I spent way too much time repeating myself and redesigning tools that already exist.
- Use state management (like flux, or redux): 
    - As the program's complexity grew, reconciling state between multiple different areas became increasingly difficult, refactoring became a nightmare 
- Clamp down on scope creep





