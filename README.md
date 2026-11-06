# tursim

## Ruleset

Follows the Monash University FIT2014 definition of a Turing machine:

- Tape is infinite to the right
- You can "fall off" the tape if you go too far left
- Output ends at leftmost blank cell
- Blank cells denoted by an `_`

## Features

### Implemented

- Infinite canvas that's pannable, zoomable, scrollable, and lockable.
- Simple node connections (just click on one, drag to another, then release, exactly like tuatara)
- Adjustable tape length
- Character specifications on edges, with replacements and tape direction
- Animated playback of the tape (including where it is on the diagram and a moving head)
- Execution speed control (implemented in intervals)
- Output of edge connections in JSON format for automated validation
- Ability for nodes to redirect back to themselves
- Import from text encoding and create a clean layout automatically
- Dynamic edges for readability
- Light/dark mode
- Saving/loading tapes
- Saving/loading machines
- Keyboard shortcuts
- Undo / redo
- Stepping through the tape

### Planned

- Nothing at the moment, feel free to add a GitHub issue if something's missing.
