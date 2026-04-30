
# Ozobot Map Activity Guide and rules

## Description:
In this activity, students use block coding to program a robot,
known as an "ozobot" to travel from one airport to another across a grid map.
The map is comprised of different types of tiles which each have different scores.
The goal of the activity is to score points by passing through airports (blue) and
tailwinds (green) while avoiding headwinds (yellow) and impassable tiles (red).
These are put together into a formula to calculate final score and flight efficiency:
[(Airports * 2) + (tailwinds - headwinds) = Final Score]
[(Final Score / Total Spaces Traveled) * 100 = Flight Efficiency]
You must remain within the grid map, no traveling diagonally.
Total Spaces Traveled includes retraced tiles, but when recording special tiles like airports
we only count them once. The Start and End tiles do not count as tiles traversed. 


### Types of tiles:
Impassable - These tiles are restricted. You are not allowed to pass through them.
Tailwinds - You can pass through these tiles and they add to your final score.
Headwinds - Subtract from your final score if you pass through them.
Airports - Add to your final score and allow refuelling.
Start - The Ozobot must start on this tile
End - This is the only 2x2 tile. You may end anywhere within those 4 tiles.

### Fuel:
The ozobot can only travel 3 tiles before it needs to refuel. Count down from three 
with each tile traveled. If you reach 0 and are not on an airport you crash.
In practice, this really means you can travel 4 tiles as it starts counting on the tile
after you leave an airport and reaching 0 while on an airport tile is fine. 