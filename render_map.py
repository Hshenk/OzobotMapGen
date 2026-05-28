from PIL import ImageFont, ImageDraw, Image
from matplotlib import font_manager
import os
from map import Generated_Map, FullMap3, FullMap4
from search import find_best_route
from math import hypot, ceil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, 'Outputs')
TILE_PX = 154
BORDER_OUTER = 4      # thick outer border
BORDER_INNER = 1      # grid lines
BORDER_PAGE  = 3      # page-boundary dividers
PAGE_COLS, PAGE_ROWS = 5, 4
COL_LETTERS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
# If we ever need more letters, loop back to the start of this list
START_AIRPORT_NAME = "College Park"
END_AIRPORT_NAME   = "Clover Field California"


# Tile Colors
COLOR_EMPTY = (255, 255, 255) # White
COLOR_AIRPORT = (135, 206, 235) # Sky Blue
COLOR_TAILWIND = (76, 175, 80) # Green
COLOR_HEADWIND = (255, 215, 0) # Yellow
COLOR_IMPASSABLE = (229, 57, 53) # Red
COLOR_START = (135, 206, 235) # Sky Blue
COLOR_END = (135, 206, 235) # Sky Blue
COLOR_BORDER = (0, 0, 0) # Black
COLOR_PAGE_DIV = (60, 60, 60) # Dark Grey
COLOR_COORD = (180, 180, 180) # Light Grey
COLOR_TEXT = (30, 30, 30) # Near Black
COLOR_ROUTE = (0, 80, 200) # Blue for route overlay
COLOR_META_BG = (245, 245, 245) # Off-white for meta data strip

# PDF Page variables
DPI = 150
PAGE_WIDTH  = int(11  * DPI)   # 1650 px
PAGE_HEIGHT = int(8.5 * DPI)   # 1275 px
MARGIN_TOP    = int(0.10 * DPI)   # standard
MARGIN_LEFT   = int(0.10 * DPI)   # standard
MARGIN_BOTTOM = int(0.10 * DPI)   # standard
MARGIN_RIGHT  = int(0.50 * DPI)   # larger for page number label


TILE_COLORS = {
	0 : COLOR_EMPTY,
	'airport' : COLOR_AIRPORT,
	'tailwind' : COLOR_TAILWIND,
	'headwind' : COLOR_HEADWIND,
	'impassable' : COLOR_IMPASSABLE,
	'start' : COLOR_START,
	'end' : COLOR_END
}


ICON_NAMES ={
	'airport' : 'airport.png',
	'tailwind': 'wind-solid.png',
	'headwind': 'turtle.png',
	'impassable': 'ban-solid.png',
	'start': 'plane-departure-solid.png',
	'end': 'location-dot-solid.png'
}


# Tries to load various system fonts
def _load_font(size, bold=False):
	weight = 'normal' if not bold else 'bold'
	font_path = font_manager.findfont(font_manager.FontProperties(family="Arial", weight=weight))

	# Failsafe
	try:
		font = ImageFont.truetype(font_path, size)
	except (OSError, IOError):
		font = ImageFont.load_default()

	return font


# Returns the (width, height) the text will be when drawn
def _text_size(draw, text, font):
	left, top, right, bottom = draw.textbbox((0,0), text, font=font)

	width = right - left
	height = bottom - top

	return width, height

# loads an icon from the Icons folder, resizes it and optionally recolors it.
def _load_icon(filename, size, color=None):
	icon_path = os.path.join(BASE_DIR, "Icons", filename)
	icon = Image.open(icon_path).convert("RGBA")

	icon = icon.resize((size,size), resample=Image.Resampling.LANCZOS)


	if color:
		r, g, b, a = icon.split()
		colored = Image.new("RGBA", icon.size, color)
		colored.putalpha(a)

		icon = colored

	return icon


# draws text centered on tile for start and end
def _draw_centered_text(draw, cx, cy, text, font, color):
	width, height = _text_size(draw, text, font)

	draw.text((cx - (width / 2), cy - (height / 2)), text, font=font, fill=color)

	return



# Builds and renders a single tile
def _render_tile(tile_type, col, row, tile_size,
                 start_name=START_AIRPORT_NAME,
                 row_offset=0,col_offset=0):
	background_color = TILE_COLORS[tile_type]

	image = Image.new("RGB", (tile_size, tile_size), background_color)
	draw = ImageDraw.Draw(image)

	# Writes the top left tile label
	if tile_type != 'start':
		label = COL_LETTERS[col + col_offset] + str(row + row_offset + 1)
		font = _load_font(int(tile_size * 0.14))
		draw.text((6, 4), label, font=font, fill=COLOR_COORD)


	# Load an icon and paste it if it's a special tile
	if tile_type not in [0,'end']:
		icon_size = int(tile_size * 0.55) if tile_type != 'impassable' else int(tile_size * 0.75)
		icon = _load_icon(ICON_NAMES[tile_type], icon_size)
		paste_x = (tile_size - icon_size) // 2
		paste_y = (tile_size - icon_size) // 2

		# Shift icon for start
		if tile_type == 'start':
			paste_y = int(tile_size * 0.22)

		image.paste(icon, (paste_x, paste_y), mask=icon)



	if tile_type == 'start':
		start_font = _load_font(int(tile_size * 0.14), True)

		_draw_centered_text(draw, tile_size // 2, tile_size * 0.15,
		                    start_name, start_font, COLOR_TEXT)

		_draw_centered_text(draw, tile_size // 2, tile_size * 0.85,
		                    'Start Here', start_font, COLOR_TEXT)

	return image


# Renders a 2x2 end block
def _render_end_block(tile_size, end_name=END_AIRPORT_NAME):
	background_color = TILE_COLORS['end']

	image = Image.new("RGB", (tile_size * 2, tile_size * 2), background_color)
	draw = ImageDraw.Draw(image)



	# Write Icon
	icon_size = int(tile_size)
	icon = _load_icon(ICON_NAMES['end'], icon_size)
	paste_x = (tile_size * 2 - icon_size) // 2
	paste_y = (tile_size * 2 - icon_size) // 2

	image.paste(icon, (paste_x, paste_y), mask=icon)


	# Write text
	end_font = _load_font(int(tile_size * 0.17), True)

	_draw_centered_text(draw, tile_size, tile_size * 0.15,
	                    end_name, end_font, COLOR_TEXT)

	_draw_centered_text(draw, tile_size, tile_size * 1.80,
	                    'End Here', end_font, COLOR_TEXT)

	return image


# Returns the x,y of the top left tile of the end block
def _find_end_topleft(board):
	width = len(board[0])
	height = len(board)

	for x in range(width):
		for y in range(height):
			if board[y][x] == 'end':
				return x,y

	raise ValueError('No end found')



# Creates a compiled map to be printed together as a single file
def compose_full_map(board, metadata,
                     row_offset=0, col_offset=0):

	# Unpack metadata
	start_name = metadata['start_name']
	end_name = metadata['end_name']
	tile_size = metadata['tile_size']

	# Dynamic height and width
	columns = len(board[0])
	rows = len(board)

	image_width = columns * tile_size + 2 * BORDER_OUTER
	image_height = rows * tile_size + 2 * BORDER_OUTER

	image = Image.new("RGB", (image_width,image_height), COLOR_BORDER)



	for col in range(columns):
		for row in range(rows):
			tile_type = board[row][col]
			if tile_type == 'end':
				continue

			# Render tile and paste at desired location
			tile_img = _render_tile(tile_type, col, row, tile_size,
			                        start_name=start_name, row_offset=row_offset,col_offset=col_offset)

			px = BORDER_OUTER + col * tile_size
			py = BORDER_OUTER + row * tile_size

			image.paste(tile_img, (px, py))


	# Draw border lines
	draw = ImageDraw.Draw(image)

	for col in range(1, columns):
		x_pos = BORDER_OUTER + col * tile_size
		draw.line((x_pos, 0, x_pos, image_height), fill=COLOR_BORDER, width=BORDER_INNER)

	for row in range(1, rows):
		y_pos = BORDER_OUTER + row * tile_size
		draw.line((0, y_pos, image_width, y_pos), fill=COLOR_BORDER, width=BORDER_INNER)



	# Render and paste the end block
	e_col, e_row = _find_end_topleft(board)

	ex = BORDER_OUTER + e_col * tile_size
	ey = BORDER_OUTER + e_row * tile_size

	end_img = _render_end_block(tile_size,end_name=end_name)
	image.paste(end_img, (ex, ey))


	# Draw outer border
	draw.rectangle([0, 0, image_width - 1, image_height - 1],
	               outline=COLOR_BORDER, width=BORDER_OUTER)


	return image

# Creates a complied map with a route overlay and text describing the best route
def overlay_route(base_image, board, metadata):
	seed = metadata['seed']
	tile_size = metadata['tile_size']

	draw = ImageDraw.Draw(base_image)

	score, flight_eff, path = find_best_route(board)

	dash_length = int(tile_size * 0.15)
	gap_length = int(tile_size * 0.10)


	for i in range(len(path)-1):
		x1, y1 = path[i]
		x2, y2 = path[i+1]

		# Converts to pixel values
		cx1 = BORDER_OUTER + x1 * tile_size + tile_size // 2
		cy1 = BORDER_OUTER + y1 * tile_size + tile_size // 2
		cx2 = BORDER_OUTER + x2 * tile_size + tile_size // 2
		cy2 = BORDER_OUTER + y2 * tile_size + tile_size // 2


		dx = cx2 - cx1
		dy = cy2 - cy1

		distance = hypot(dx, dy)

		ux = dx / distance
		uy = dy / distance

		position = 0
		drawing = True


		while position < distance:
			if drawing:
				segment_end = min(position + dash_length, distance)
				start_point = (cx1 + ux * position, cy1 + uy * position)
				end_point = (cx1 + ux * segment_end, cy1 + uy * segment_end)

				draw.line((start_point, end_point), fill=COLOR_ROUTE, width=3)


			else:
				# We don't need to worry about overshooting since this is blank
				segment_end = position + gap_length

			position = segment_end
			drawing = not drawing


	# Adds dots to each traversed tile on route
	for tile in path:
		x, y = tile
		cx = BORDER_OUTER + x * tile_size + tile_size // 2
		cy = BORDER_OUTER + y * tile_size + tile_size // 2
		r = int(tile_size * 0.06)
		draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=COLOR_ROUTE)



	# Creates a new, large image so we can display text bellow the map
	extra_space = 80
	new_image_width = base_image.width
	new_image_height = base_image.height + extra_space

	large_image = Image.new("RGB", (new_image_width,
	                          new_image_height), COLOR_EMPTY)
	large_image.paste(base_image, (0, 0))

	draw_new = ImageDraw.Draw(large_image)

	# Fill the bottom margin with score and flight efficiency
	font = _load_font(int(tile_size * 0.18), True)
	label = f'Route Final Score: {score}       Best Flight Efficiency: {flight_eff:.2f}%'
	if seed is not None:
		label += f'       Map Seed: {seed}'


	_draw_centered_text(draw_new, new_image_width // 2, base_image.height + 28,
	                    label, font, COLOR_TEXT)


	return large_image


# Returns a list of page dicts in reading order and (pages wide, pages tall)
def _split_pages(board):
	num_rows = len(board)
	num_cols = len(board[0])

	pages_wide = ceil(num_cols / PAGE_COLS)
	pages_tall = ceil(num_rows / PAGE_ROWS)


	page_list = []

	for page_row in range(pages_tall):
		for page_col in range(pages_wide):
			col_start = page_col * PAGE_COLS
			row_start = page_row * PAGE_ROWS

			# Populate a list PAGE_COLS x PAGE_ROWS
			page = []
			for local_row in range(PAGE_ROWS):
				row = []
				for local_col in range(PAGE_COLS):

					# Calculates the actual tile position for the whole board
					# If out of range, we want to use a 0 instead
					actual_col = col_start + local_col
					actual_row = row_start + local_row

					if actual_col < num_cols and actual_row < num_rows:
						row.append(board[actual_row][actual_col])
					else:
						row.append(0)
				page.append(row)

			page_data = {
				'board' : page,
				'col_offset' : col_start,
				'row_offset' : row_start,
				'page_number' : len(page_list) + 1
			}
			page_list.append(page_data)

	return page_list, (pages_wide, pages_tall)


# Used to generate a single page for printing
# Returns the PL image
def _render_page(page_dict, metadata, last=False):

	# Unpack metadata
	seed = metadata['seed']
	tile_size = metadata['tile_size'] * 2 # The tiles are far too small when printed to a standard page
	start_name = metadata['start_name']
	end_name = metadata['end_name']

	# Unpack the dictionary
	board_slice = page_dict['board']
	col_offset = page_dict['col_offset']
	row_offset = page_dict['row_offset']
	page_number = page_dict['page_number']


	columns = len(board_slice[0])
	rows = len(board_slice)

	# Make sure we have a 4x5 grid
	if columns != PAGE_COLS or rows != PAGE_ROWS:
		raise ValueError('Tried to generate PDF with non-standard tile count')


	# Create a white, page-sized image
	image_height = PAGE_HEIGHT
	image_width = PAGE_WIDTH
	image = Image.new("RGB", (image_width,image_height), COLOR_EMPTY)



	# Draw lines
	for col in range(columns):
		for row in range(rows):
			tile_type = board_slice[row][col]
			if tile_type == 'end':
				continue

			# Render tile and paste at desired location
			tile_img = _render_tile(tile_type, col, row, tile_size,
			                        start_name=start_name, row_offset=row_offset,col_offset=col_offset)

			px = MARGIN_LEFT + col * tile_size
			py = MARGIN_TOP + row * tile_size

			image.paste(tile_img, (px, py))


	# Draw border lines
	grid_width = PAGE_COLS * tile_size + 2 * BORDER_OUTER
	grid_height = PAGE_ROWS * tile_size + 2 * BORDER_OUTER
	draw = ImageDraw.Draw(image)

	for col in range(1, columns):
		x_pos = MARGIN_LEFT + col * tile_size
		draw.line((x_pos, MARGIN_TOP, x_pos, MARGIN_TOP + grid_height - 5), fill=COLOR_BORDER, width=BORDER_INNER)

	for row in range(1, rows):
		y_pos = MARGIN_TOP + row * tile_size
		draw.line((MARGIN_LEFT, y_pos, MARGIN_LEFT + grid_width - 5, y_pos), fill=COLOR_BORDER, width=BORDER_INNER)


	# Handle the end block, if applicable
	try:
		e_col, e_row = _find_end_topleft(board_slice)

		ex = MARGIN_LEFT + e_col * tile_size
		ey = MARGIN_TOP + e_row * tile_size

		end_img = _render_end_block(tile_size, end_name=end_name)
		image.paste(end_img, (ex, ey))


	except ValueError:
		pass


	# Draw a border around the whole image
	draw.rectangle([MARGIN_LEFT, MARGIN_TOP,
	                MARGIN_LEFT + grid_width - 5,
	                MARGIN_TOP + grid_height - 5],
	               outline=COLOR_BORDER, width=BORDER_OUTER)


	# Add page number to top right
	p_index_x = MARGIN_LEFT + grid_width + int(MARGIN_RIGHT / 2)
	p_index_y = MARGIN_TOP + int(grid_height * 0.05)
	font = _load_font(int(tile_size * 0.35), True)
	label = str(page_number)
	draw = ImageDraw.Draw(image)
	_draw_centered_text(draw, p_index_x, p_index_y,
	                    label, font, COLOR_TEXT)


	# We only want to add the seed label to the last page
	if last:
		s_index_x = grid_width
		s_index_y = MARGIN_TOP * 1.1 + int(grid_height)
		font = _load_font(int(tile_size * 0.08), False)
		label = f"Seed: {str(seed)}"
		_draw_centered_text(draw, s_index_x, s_index_y,
		                    label, font, COLOR_TEXT)

	return image




# Renders and saves a number of pdf pages,
# containing the board split up into printable pages
def save_pdf(board, output_path, metadata):

	# Creates a dictionary with pages
	pages, (pages_wide, pages_tall) = _split_pages(board)


	# Creates PIL renders of each page
	page_images = []
	last = False
	for i,page in enumerate(pages):
		if i == len(pages) - 1:
			last = True
		page_images.append(_render_page(page, metadata, last))



	page_images[0].save(output_path, format="PDF", save_all=True, append_images=page_images[1:], resolution=DPI)

	return pages_wide, pages_tall





def render_all(board, output_dir=OUTPUT_DIR, seed=None,
				tile_size=TILE_PX,
				start_name=START_AIRPORT_NAME, end_name=END_AIRPORT_NAME,
				pdf_filename="Printable Map.pdf",
				fullmap_filename="Full Map.png",
				routemap_filename="Route Map.png",
				assembly_filename="Assembly Instructions.png"):

	metadata = {
		'seed' : seed,
		'start_name' : start_name,
		'end_name' : end_name,
		'tile_size' : tile_size
	}

	# Starts with generating the fully assembled map
	full_map_path = os.path.join(output_dir, fullmap_filename)
	board_img = compose_full_map(board, metadata)
	board_img.save(full_map_path)

	# Adds a 'best route' to the full map and saves as a separate file
	map_with_route = overlay_route(board_img.copy(), board, metadata)
	out_route_path = os.path.join(output_dir, routemap_filename)
	map_with_route.save(out_route_path)

	# Split the full map into 4x5 grids and create printable pdf files
	out_pdf_path = os.path.join(output_dir, pdf_filename)
	pages_wide, pages_tall = save_pdf(board,out_pdf_path, metadata)



	return



if __name__ == '__main__':
	render_all(board=FullMap3,seed=429991)
