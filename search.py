from map import FullMap, FullMap2, FullMap3


# Max_X = 9
# Max_Y = 7



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
	rows = len(board)
	cols = len(board[0])


	for y in range(rows):
		for x in range(cols):
			if board[y][x] == "start":
				return x, y

	raise Exception("start not found")


# Returns neighbors, excluding out of bounds
# Only checks Max_X and Max_Y for boundry
def get_neighbors (x,y,board):
	columns = len(board[0])
	rows = len(board)

	pos_neighbors = [(x-1, y), (x+1, y), (x, y-1), (x, y+1)]
	neighbors = []
	for nx,ny in pos_neighbors:
		if nx < 0 or nx > columns - 1 or ny < 0 or ny > rows - 1:
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
			neighbors = get_neighbors(node.x, node.y, board)
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

# Finds the highest Flight Efficiency possible on the map
def best_route_dfs(pos, fuel, board, current_path, visited, best):

	# Decide max path based on the size of the board
	max_path = len(board) + len(board[0]) + 2
	x, y = pos
	tile_type = board[y][x]

	# Cap our route
	if len(current_path) > max_path:
		return best

	# Score and return if at end
	if tile_type == 'end':
		points, efficiency = score(current_path, board)
		if efficiency > best['score']:
			best['path'] = list(current_path)
			best['score'] = efficiency
			return best

	# Refuel if at airport
	if tile_type in ['airport','start']:
		fuel = 3

	neighbors = get_neighbors(x, y, board)
	new_fuel = fuel - 1
	for neighbor in neighbors:
		neighbor_type = board[neighbor[1]][neighbor[0]]

		new_fuel = 3 if neighbor_type in ['start','end','airport'] else fuel - 1

		if neighbor_type == 'impassable' or (neighbor, new_fuel) in visited:
			continue
		if new_fuel < 0:
			continue

		visited.add((neighbor, new_fuel))
		current_path.append(neighbor)
		best_route_dfs(neighbor, new_fuel, board, current_path, visited, best)
		current_path.pop()
		visited.remove((neighbor, new_fuel))



# Finds and prints the best route
# Returns int:score, float:flight_efficiency, list:path
def find_best_route(board):
	start = find_start(board)
	best = {'score': float('-inf'), 'path':None}
	visited = set()
	visited.add((start, 3))

	best_route_dfs(start, 3, board, [start], visited, best)


	if best['path']:
		final_score, efficiency = score(best['path'], board)
		#print(f"Best route score: {final_score}, efficiency: {efficiency:.2f}%")
		#print(f"Path: {best['path']}")
		return final_score, efficiency, best['path']
	else:
		#print("No valid route found")
		raise Exception("No path found")



def solve(b):

	result = dfs(find_start(b), b)

	if result:
		print (f"Found the end in {len(result)} tiles")
		print(f"Route: {result}")

		final_score, efficiency = score(result, b)
		print(f"Final Score: {final_score}")
		print(f"Flight Efficiency: {efficiency}")



	return 0


if __name__ == "__main__":
	f_score, eff, path = find_best_route(FullMap3)

	print (f_score, eff)
	print(path)