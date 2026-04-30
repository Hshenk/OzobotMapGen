t = 1   # Tailwind
h = -1  # Headwind
e = "end"   # End
i = "impassable"   # Impassable
s = "start"   # Start

FullMap = [
	[0, h, 0, 0, 2,     t, t, t, e, e],
	[0, t, 2, i, h,     2, 0, i, e, e],
	[0, 0, h, 0, 2,     0, 0, i, i, 0],
	[2, 0, i, i, h,     0, 0, 2, h, 0],

	[0, t, 0, i, t,     0, 2, i, i, 2],
	[2, 0, 0, h, 0,     0, 0, 0, 0, 0],
	[0, 0, h, 0, 0,     t, h, h, h, t],
	[0, 0, s, 0, 2,     0, 0, 0, 2, 0]
]