from search import dfs, find_start
from collections import deque
import random

Length = 10
Height = 8

# Input: Seed, num airports, num tailwinds, num headwinds, num impassable
# Output: A list[list] containing the 8x10 gameboard
def generate_map(seed: int, n_airports: int, n_tailwinds: int,
               n_headwinds: int, n_impassable:int):
	_validate_inputs(n_airports, n_tailwinds, n_headwinds, n_impassable)

	rng = random.Random(seed)
	board = _init_board()



	raise NotImplementedError



# Returns a blank board of Length x Width tiles populated just with '0's
def _init_board():
	out = []
	for i in range(Height):
		row = []
		for j in range(Length):
			row.append(0)
		out.append(row)
	return out



# Picks a 2x2 block to be the end tiles
def _get_corner_config(rng):
	# Return tuple[tuple,set]
	corners = [(0,0), (Length-1, 0), (Length-1, Height-1), (0, Height-1)]


	diagonal = {(0,0): (1,1),
	            (Length-1,0): (Length-2, 1),
	            (Length-1,Height-1): (Length-2, Height-2),
	            (0, Height-1): (1, Height-2),}


	end = rng.choice(corners)
	square = set(get_neighbors(end[0],end[1]))
	square.add(end)
	square.add(diagonal[end])

	return end, square



def _place_start_end(rng, end_block, board):
	# Return tuple[tuple,tuple]
	raise NotImplementedError

def _generate_airport_chain(start, end_block, n_spine, rng):
	# Return list[tuple]
	raise NotImplementedError

def _compute_protected_corridor(start, spine_airports, end_block):
	# Return set
	raise NotImplementedError

def _place_extra_airports(spine_airports, end_block, n_extra, board, rng):
	# Return list[tuple]
	raise NotImplementedError


def _place_winds(n_tailwinds, n_headwinds, board, rng):
	# No return
	raise NotImplementedError

def _place_impassable(n_impassable, board, protected, rng):
	# return int
	raise NotImplementedError


def _is_solvable(board):
	# Return bool
	raise NotImplementedError

# Returns the shortest path as a list. Optional argument allows for blocked tiles
def _bfs_path(start, goal, blocked=frozenset()):
	frontier = deque([start])
	visited = set()
	visited.add(start)
	parents = {start:None}


	while frontier:
		current = frontier.popleft()

		# Check if we're at the goal and retrace path
		if current == goal:

			path = [current]

			while parents[current] is not None:
				current = parents[current]
				path.append(current)

			path.reverse()

			return path

		# If not, we look at the neighbors
		for neighbor in get_neighbors(current[0], current[1]):
			if neighbor not in visited and neighbor not in blocked:
				frontier.append(neighbor)
				visited.add(neighbor)
				parents[neighbor] = current

	return None



# Modified version of get_neighbors that works off of Length and Height globals
def get_neighbors (x,y):
	pos_neighbors = [(x-1, y), (x+1, y), (x, y-1), (x, y+1)]
	neighbors = []
	for nx,ny in pos_neighbors:
		if nx < 0 or nx > Length-1 or ny < 0 or ny > Height-1:
			continue
		else:
			neighbors.append((nx,ny))

	return neighbors



def _manhattan(a, b):
	return abs(a[0] - b[0]) + abs(a[1] - b[1])


# Does not return, but raises an error if the input is invalid
def _validate_inputs(n_airports, n_tailwinds, n_headwinds, n_impassable):
	total = 0

	if n_airports < 1:
		raise ValueError('Not enough airports')

	for n in [n_airports, n_tailwinds, n_headwinds, n_impassable]:
		if not n >= 0:
			raise ValueError('Enter a positive number of tiles')
		total += n
	if total > ((Length * Height) - 5):
		raise ValueError('Too many special tiles listed')



# Test corner
rng = random.Random(42)
corner, square = _get_corner_config(rng)
print(corner)
print(square)




#generate_map(42, 8, 4, 3, 10)
