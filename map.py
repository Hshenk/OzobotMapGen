t = 'tailwind' # Tailwind
h = 'headwind'  # Headwind
e = "end"   # End
i = "impassable"   # Impassable
s = "start"   # Start
A = 'airport'


FullMap = [
	[0, h, 0, 0, A,     t, t, t, e, e],
	[0, t, A, i, h,     A, 0, i, e, e],
	[0, 0, h, 0, A,     0, 0, i, i, 0],
	[A, 0, i, i, h,     0, 0, A, h, 0],

	[0, t, 0, i, t,     0, A, i, i, A],
	[A, 0, 0, h, 0,     0, 0, 0, 0, 0],
	[0, 0, h, 0, 0,     t, h, h, h, t],
	[0, 0, s, 0, A,     0, 0, 0, A, 0]
]

FullMap2 = [
	[0, h, 0, 0, A,     i, t, t, e, e],
	[0, t, A, i, h,     i, 0, i, e, e],
	[0, 0, h, 0, A,     i, 0, i, i, 0],
	[A, 0, i, i, h,     i, 0, A, h, 0],

	[0, t, 0, i, t,     i, A, i, i, A],
	[A, 0, 0, h, 0,     i, 0, 0, 0, 0],
	[0, 0, h, 0, 0,     i, A, h, h, t],
	[0, 0, s, 0, A,     i, 0, 0, A, 0]
]

FullMap3 = [
	[0, A, i, i, A,     t, t, t, e, e],
	[0, 0, 0, 0, 0,     A, 0, i, e, e],
	[t, h, h, h, t,     0, 0, i, i, 0],
	[0, 0, 0, A, 0,     0, 0, A, h, 0],

	[0, 0, t, i, t,     0, h, 0, 0, A],
	[A, 0, A, h, 0,     0, t, A, i, t],
	[0, 0, h, 0, 0,     0, 0, h, i, A],
	[0, 0, s, 0, A,     A, 0, 0, 0, h]
]


FullMap4 = [
	[A, A, i, i,     t, t, e, e],
	[0, 0, 0, 0,     0, i, e, e],
	[t, h, h, h,     0, i, i, 0],
	[0, 0, 0, A,     0, A, h, 0],

	[0, 0, t, i,     h, 0, 0, A],
	[A, 0, A, h,     t, A, i, t],
	[0, 0, h, 0,     0, h, i, A],
	[0, 0, s, 0,     0, 0, 0, h]
]

Generated_Map =[
['end', 'end', 0, 0, 0, 'impassable', 'impassable', 'impassable', 'tailwind', 0],
['end', 'end', 0, 0, 'airport', 0, 0, 'impassable', 0, 0],
[0, 0, 0, 'airport', 0, 0, 'airport', 'impassable', 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 'impassable', 0],
['airport', 0, 0, 0, 0, 0, 0, 'impassable', 0, 0],
[0, 'tailwind', 'airport', 0, 'headwind', 0, 0, 0, 'impassable', 0],
[0, 'tailwind', 0, 'headwind', 'airport', 'start', 'headwind', 0, 0, 'impassable'],
['tailwind', 0, 0, 0, 0, 'impassable', 0, 0, 0, 0]
]
# (Seed: 42, Airports: 6, Tailwinds: 4, Headwinds: 3, Impassable: 10)