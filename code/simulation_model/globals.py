import argparse

args = argparse.Namespace()

def update_globals(parsed_args):
    global args
    args = parsed_args

simple_path_cutoff = lambda: args.simple_path_cutoff
naive_temp = lambda: args.naive_temp
sophisticated_temp = lambda: args.sophisticated_temp
w = lambda: args.w

seed = 42
sample_paths_suspect = 50
sample_paths_detective = 1000

furniture_size = {
    'bed': [3, 2],
    'sofa': [3, 2],
    'light': [1, 2],
    'table': [3, 2],
    'side_table': [1, 1],
    'electric_refrigerator': [2, 3],
    'tv': [2, 2]
}

