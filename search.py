from numpy.matlib import empty

from map import FullMap

Max_X = 9
Max_Y = 7
board = FullMap

class Node:
	def __init__(self, state, parent):
		self.state = state
		self.x, self.y = state
		self.parent = parent
		self.tile = board[self.y][self.x]



class StackFrontier:
	def __init__(self):
		self.frontier = []
		self.explored = set()

	def add(self, state):
		self.frontier.append(state)

	# Checks if the frontier includes any nodes with a given state
	def contains_state(self, state):
		return any(node.state == state for node in self.frontier)

	def empty(self):
		return len(self.frontier) == 0

	def remove(self):
		if len(self.frontier) == 0:
			raise Exception("StackFrontier is empty")
		n = self.frontier.pop()
		self.explored.add(n.state)
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


def tile_refuels(tile):
	return True if tile.tile in [2, 'start', 'end'] else False



# Current issue: The program is creating a new node with a unique idea
# This means that it does not recognize it as a step taken before.
# It needs to check if any state in the frontier has the same x,y
# Maybe that should also check if that state has less fuel, because it could be a shorter route
def dfs(s):

	start = Node((s[0], s[1]), None)
	start.fuel = 3

	frontier = StackFrontier()
	frontier.add(start)

	counter = 0

	while True:

		counter += 1

		if frontier.empty():
			print(f"Ended at: {node.state}, {node.tile}")
			print(f"Searched: {counter} tiles")
			return False


		node = frontier.remove()
		print(f"{node.fuel}, {node.state}")



		# Check if we are at the end and return
		if node.tile == 'end':
			path = []
			while node.parent is not None:
				parent = node.parent
				path.append((parent.state, parent.tile))
				node = node.parent
			path.reverse()
			return path


		else:
			# Add neighbors to frontier
			neighbors = get_neighbors(node)
			for neighbor in neighbors:
				if not frontier.contains_state(neighbor) and neighbor not in frontier.explored:
					new_node = Node(neighbor, node)
					# Calculate fuel
					if tile_refuels(new_node):
						new_node.fuel = 3
					else:
						new_node.fuel = node.fuel - 1

					if is_passable(new_node) and new_node.fuel > 0:
						frontier.add(new_node)






def solve(board):
	#print(f"start is: ({start[0]}, {start[1]}))")
	#print(get_neighbors(start_tile))
	#print(tile_refuels(start_tile))


	print(dfs(find_start(board)))




	return 0


solve(FullMap)