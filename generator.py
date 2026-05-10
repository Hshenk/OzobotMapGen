from search import dfs, find_start
from collections import deque
import random, math

Length = 10
Height = 8

# This prevents the start and end tiles from generating within a certain distance of each other
Min_Start_Dis = 10

# Input: Seed, num airports, num tailwinds, num headwinds, num impassable
# Output: A list[list] containing the 8x10 gameboard
def generate_map(seed: int, n_airports: int, n_tailwinds: int,
               n_headwinds: int, n_impassable:int):
	_validate_inputs(n_airports, n_tailwinds, n_headwinds, n_impassable)

	rng = random.Random(seed)
	board = _init_board()


	# Start and End lines
	end, end_block = _get_corner_config(rng)
	_place_start_end(rng, end_block, board)
	start = find_start(board)

	paths = [_bfs_path(start, tile) for tile in end_block]
	paths = [p for p in paths if p is not None]
	shortest = min(paths, key = len)

	min_airports = math.ceil((len(shortest) - 1) / 4) - 1


	if min_airports > n_airports:
		raise Exception("Not enough airports")

	airport_chain = _generate_airport_chain(start, end_block, min_airports, rng)


	# Place down the main chain of airports
	for airport in airport_chain:
		board[airport[1]][airport[0]] = 'airport'


	if not _is_solvable(board):
		raise Exception("Something went wrong placing main chain of airports")


	protected_chain = _compute_protected_corridor(start, airport_chain, end_block)



	#TODO
	# Protected Chain is done. Move on to placing special tiles.


	_print_board(board)

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


def _print_board(board):
	for line in board:
		print(line)


# Picks a 2x2 block to be the end tiles
def _get_corner_config(rng):
	# Return tuple[tuple,set]
	corners = [(0,0), (Length-1, 0), (Length-1, Height-1), (0, Height-1)]


	diagonal = {(0,0): (1,1),
	            (Length-1,0): (Length-2, 1),
	            (Length-1,Height-1): (Length-2, Height-2),
	            (0, Height-1): (1, Height-2)}


	end = rng.choice(corners)
	square = [end]
	for t in get_neighbors(end[0],end[1]):
		square.append(t)


	square.append(diagonal[end])

	return end, square


# Picks a random corner, generates an end block and places the start somewhere on the opposite corner
def _place_start_end(rng, end_block, board):
	start_options = {(0,0): (Length-1, Height-1),
	         (Length-1,0): (0, Height-1),
	         (Length-1,Height-1): (0,0),
	         (0, Height-1): (Length-1, 0)}

	# This is storing the opposite corner as a reference
	start_corner = start_options[end_block[0]]

	x_ranges = {0: range(0, Length // 2), Length - 1: range(Length // 2, Length)}
	y_ranges = {0: range(0, Height // 2), Height - 1: range(Height // 2, Height)}

	x_range = x_ranges[start_corner[0]]
	y_range = y_ranges[start_corner[1]]

	# # Populate a list of coordinates in our starting region
	start_region = []
	for x in x_range:
		for y in y_range:
			start_region.append((x,y))


	start_options = []
	for tile in start_region:
		if _manhattan(tile, end_block[0]) > Min_Start_Dis:
			start_options.append(tile)
	start = rng.choice(start_options)


	# Place start and end tiles
	for tile in end_block:
		board[tile[1]][tile[0]] = 'end'

	if board[start[1]][start[0]] == 'end':
		raise Exception('Tried to place start tile on end tile')
	board[start[1]][start[0]] = 'start'


	return


# Generates a chain of airports from the start to finish
def _generate_airport_chain(start, end_block, n_spine, rng):
	current = start
	chain = []

	while True:
		paths = []
		for end_tile in end_block:
			paths.append(_manhattan(current, end_tile))
		closest_path = min(paths)
		if closest_path <= 4:
			# Placeholder for return value
			return chain


		candidates = []
		for y in range(Height):
			for x in range(Length):
				pos = (x,y)
				dis = _manhattan(pos, current)
				if 2 <= dis <= 4 and pos not in chain:
					# Make sure it is not already a start or end tile
					if pos != start and pos not in end_block:

						# Check candidate distance compared to current distance
						new_paths = []
						for end_tile in end_block:
							new_paths.append(_manhattan(pos, end_tile))
						new_closest = min(new_paths)

						if new_closest < closest_path:
							candidates.append(pos)

		# fallback, breaks the loop to reach fallback method
		if len(candidates) == 0:
			break



		next = rng.choice(candidates)
		chain.append(next)
		current = next



	# Fallback method using bfs
	print("Using fallback to generate chain")
	paths = []
	chain = [] # Clear any partial chain

	for end_tile in end_block:
		paths.append(_manhattan(start, end_tile))
	closest_path = min(paths)
	closest_end = end_block[paths.index(closest_path)]

	path = _bfs_path(start, closest_end)


	for i, tile in enumerate(path):
		if i > 0 and i % 3 == 0:
			chain.append(tile)



	return chain

# Returns a list of all tiles following the airport chain from start to finish
def _compute_protected_corridor(start, spine_airports, end_block):
	protected_chain = set()



	# Handles a very small board with no airport chain
	if len(spine_airports) == 0:
		closest_end = ()
		closest_dis = 10
		for end_tile in end_block:
			dis = _manhattan(start, end_tile)
			if dis < closest_dis:
				closest_end = end_tile
				closest_dis = dis

		protected_chain.add(closest_end)
		protected_chain.add(start)

		chain = _bfs_path(start, closest_end)
		for tile in chain:
			protected_chain.add(tile)
		return protected_chain


	# Find the end tile that is closest to the last airport in the line
	closest_end = ()
	closest_dis = 10 # Placeholder, but it should never be more than 4 regardless
	for end_tile in end_block:
		dis = _manhattan(spine_airports[-1], end_tile)
		if dis < closest_dis:
			closest_end = end_tile
			closest_dis = dis

	# Creates an ordered list, just of known waypoints on the chain
	# At the same time it adds those to the final output set
	full_chain = [start]
	protected_chain.add(start)
	for airport in spine_airports:
		full_chain.append(airport)
		protected_chain.add(airport)
	full_chain.append(closest_end)
	protected_chain.add(closest_end)


	for i, tile1 in enumerate(full_chain):
		if i == len(full_chain) - 1:
			break
		tile2 = full_chain[i + 1]
		new_tiles = _bfs_path(tile1, tile2)
		for new_tile in new_tiles:
			protected_chain.add(new_tile)

	return protected_chain

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
	return True if dfs(find_start(board), board) else False

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
# rng = random.Random(42)
# corner, square = _get_corner_config(rng)
# print(corner)
# print(square)


# Small version for testing
# generate_map(42, 4, 1, 1, 1)

generate_map(42, 2, 4, 3, 10)
