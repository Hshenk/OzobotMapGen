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
def get_neighbors (tile):
	row = tile.x
	col = tile.y
	pos_neighbors = [(row-1, col), (row+1, col), (row, col-1), (row, col+1)]
	neighbors = []
	for x,y in pos_neighbors:
		if x < 0 or x > Max_X or y < 0 or y > Max_Y:
			continue
		else:
			neighbors.append((x,y))

	return neighbors


# Note currently used
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
			neighbors = get_neighbors(node)
			for neighbor in neighbors:
				tile_val = board[neighbor[1]][neighbor[0]]
				new_fuel = 3 if tile_val in ['start',2,'end'] else node.fuel - 1

				if (neighbor, new_fuel) not in frontier.explored and not any(
						(n.state, n.fuel) == (neighbor,new_fuel) for n in frontier.frontier
				):
					new_node = Node(neighbor, node, tile_val)
					new_node.fuel = new_fuel

					if is_passable(new_node) and new_node.fuel >= 0:
						frontier.add(new_node)




def solve(b):



	result = dfs(find_start(b), b)

	if result:
		print (f"Found the end in {len(result)} tiles")
		print(f"Route: {result}")




	return 0


solve(FullMap)