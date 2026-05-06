from search import dfs, find_start

Length = 10
Width = 8

# Input: Seed, num airports, num tailwinds, num headwinds, num impassable
# Output: A list[list] containing the 8x10 gameboard
def generate_map(seed: int, n_airports: int, n_tailwinds: int,
               n_headwinds: int, n_impassable:int):
	_validate_inputs(n_airports, n_tailwinds, n_headwinds, n_impassable)

	board = _init_board()

	raise NotImplementedError



# Returns a blank board of Length x Width tiles populated just with '0's
def _init_board():
	out = []
	for i in range(Width):
		row = []
		for j in range(Length):
			row.append(0)
		out.append(row)
	return out




def _get_corner_config(rng):
	# Return tuple[tuple,set]
	raise NotImplementedError


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

def _bfs_path(start, goal, blocked=frozenset()):
	# Return list | None
	raise NotImplementedError


# Needs to return the distance between point a and b
# This int should be a measure constrained to game rules (So no diagonals)
def manhattan(a, b):

	#TODO
	# I think you can just use abs(a1-b1) + abs(a2-b2), but test


	# Return int
	raise NotImplementedError


# Does not return, but raises an error if the input is invalid
def _validate_inputs(n_airports, n_tailwinds, n_headwinds, n_impassable):
	total = 0
	for n in [n_airports, n_tailwinds, n_headwinds, n_impassable]:
		if not n >= 0:
			raise ValueError('Enter a positive number of tiles')
		total += n
	if total > ((Length * Width) - 5):
		raise ValueError('Too many special tiles listed')





generate_map(42, 8, 4, 3, 10)
