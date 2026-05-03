from map import FullMap, FullMap2


Max_X = 9
Max_Y = 7


class Node:
	def __init__(self, state, parent, tile):
		self.state = state
		self.x, self.y = state
		self.parent = parent
		self.tile = tile



class StackFrontier:
	def __init__(self):
		self.frontier = []
		self.explored = set()

	def add(self, state):
		self.frontier.append(state)

	def empty(self):
		return len(self.frontier) == 0

	def remove(self):
		if len(self.frontier) == 0:
			raise Exception("StackFrontier is empty")
		n = self.frontier.pop()
		self.explored.add((n.state, n.fuel))
		return n



def find_start(board):
	for y in range(Max_Y+1):
		for x in range(Max_X+1):
			if board[y][x] == "start":
				return x, y

	raise Exception("start not found")


# Returns neighbors, excluding out of bounds
# Only checks Max_X and Max_Y for boundry
def get_neighbors (x,y):
	pos_neighbors = [(x-1, y), (x+1, y), (x, y-1), (x, y+1)]
	neighbors = []
	for nx,ny in pos_neighbors:
		if nx < 0 or nx > Max_X or ny < 0 or ny > Max_Y:
			continue
		else:
			neighbors.append((nx,ny))

	return neighbors



def is_passable(tile):
	return True if tile.tile != 'impassable' else False



def dfs(s, board):

	start = Node((s[0], s[1]), None, 'start')
	start.fuel = 3

	frontier = StackFrontier()
	frontier.add(start)

	counter = 0

	while True:

		counter += 1

		if frontier.empty():
			print(f"Failed search at: {node.state}, {node.tile}")
			print(f"Searched: {counter} tiles")
			return False


		node = frontier.remove()

		# Check if we are at the end and return
		if node.tile == 'end':
			path = []
			while node.parent is not None:
				parent = node.parent
				path.append(parent.state)
				node = node.parent
			path.reverse()
			return path


		else:
			# Add neighbors to frontier
			neighbors = get_neighbors(node.x, node.y)
			for neighbor in neighbors:
				tile_val = board[neighbor[1]][neighbor[0]]
				new_fuel = 3 if tile_val in ['start','airport','end'] else node.fuel - 1

				if (neighbor, new_fuel) not in frontier.explored and not any(
						(n.state, n.fuel) == (neighbor,new_fuel) for n in frontier.frontier
				):
					new_node = Node(neighbor, node, tile_val)
					new_node.fuel = new_fuel

					if is_passable(new_node) and new_node.fuel >= 0:
						frontier.add(new_node)


def score(tile_list, board):
	tailwind_tiles = set()
	airport_tiles = set()
	headwind_tiles = set()
	tile_count = 0

	for tile in tile_list:
		tile_type = board[tile[1]][tile[0]]
		match tile_type:
			case "headwind":
				headwind_tiles.add(tile)
			case "tailwind":
				tailwind_tiles.add(tile)
			case "airport":
				airport_tiles.add(tile)
			case _:
				pass
		if tile_type not in ['start','end']:
			tile_count += 1


	airports = len(airport_tiles)
	headwinds = len(headwind_tiles)
	tailwinds = len(tailwind_tiles)

	final_score = (airports * 2) + (tailwinds - headwinds)
	efficiency = (final_score/tile_count) * 100

	return final_score, efficiency





def solve(b):

	result = dfs(find_start(b), b)

	if result:
		print (f"Found the end in {len(result)} tiles")
		print(f"Route: {result}")

		final_score, efficiency = score(result, b)
		print(f"Final Score: {final_score}")
		print(f"Flight Efficiency: {efficiency}")



	return 0


solve(FullMap)