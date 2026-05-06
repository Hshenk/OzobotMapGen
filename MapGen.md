# Ozobot Map Generation

## Concept:
This program should take a series of numbers, one for each tile type that defines how many of those
tiles we want generated as well as some sort of seed for randomization.
It should then output a matrix similar to what is stored in map.py which represents the game board.

## Constraints:
The outputted board should always be 8x10 as it will eventually be printable onto 4 pages with
4x5 tiles on each page to make the larger game board. 

### Start and End:
There should only be 1 starting tile and 
4 end tiles in a 2x2 grid. These should only be on opposite sides of the board and no closer than,
say, 10 tiles to maintain complexity.

### Special tiles:
There should be a number of each special tile placed sudo-randomly on the board. The number of each 
will be based on the given parameter provided by the user. Tailwinds and Headwinds can be placed
completely at random. Impassable tiles can mostly be random so long as the board is possible.
Airports are more complicated. There should always be some route to the finish line and,
preferably, it should be possible to reach every airport (So they can't be further than
4 tiles from each other and that chain must connect to the start and finish).

## Seeding:
I would like for this randomization to always be consistent with a given seed. If the user
provides a seed to the program it should regenerate the same map. That way we can later have
the seed and the flight efficiency printed on the physical map and we can regenerate that
same map if we need more copies.