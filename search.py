from map import FullMap

Max_X = 9
Max_Y = 7

def find_start(board):
	for y in range(Max_Y+1):
		for x in range(Max_X+1):
			if board[y][x] == "start":
				return x, y

	raise Exception("start not found")


def get_neighbors (row, col):
	pos_neighbors = [(row-1, col), (row+1, col), (row, col-1), (row, col+1)]
	neighbors = []
	print(pos_neighbors)
	for x,y in pos_neighbors:
		if x < 0 or x > Max_X or y < 0 or y > Max_Y:
			continue
		else:
			neighbors.append((x,y))



	return neighbors


def is_passable(tile):
	return True


def tile_refuels(tile):
	return False


def dfs(row, col, fuel, visited):
	return 0


def solve():
	board = FullMap

	start = find_start(board)
	print(f"start is: ({start[0]}, {start[1]}))")


	print(get_neighbors(start[0], start[1]))

	return 0


solve()