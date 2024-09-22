# Inspiration
I dislike Tuatara.

# General Turing Machine Rules
Follows the Monash University FIT2014 definition of a Turing machine:
- Tape is infinite to the right
- You can "fall off" the tape if you go too far left
- Output ends at leftmost blank cell
- Blank cells denoted by an `_`

# Roadmap
- Multiple connections between a set of two nodes. Currently it only supports 1 connection.
- Ability for nodes to redirect back to themselves

# Implemented Features
- Infinite canvas that's pannable, zoomable, scrollable, lockable, full-screen-able
- Simple node connections (just click on one, drag to another, then release, exactly like tuatara)
- Move-able nodes (just drag them by the lil gray circle)
- X character tape (X can be as high as you want, but you might suffer performance issues)
- Ability to add new nodes (I might change this to be if you create an edge and release over nothing it'll create a new node for you, then I can get rid of the button)
- Character specifications on edges, with replacements and tape direction
- Animated playback of the tape (including where it is on the diagram and a moving head).
- Being able to use the tape in correspondence with the machine when running
- Execution speed control (implemented in intervals 20%, 40%, 60%, 80%, 100%)
- Output of machine in JSON format so it can be validated by scripts