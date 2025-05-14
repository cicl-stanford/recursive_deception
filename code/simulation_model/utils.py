import os
import pandas as pd
import numpy as np
import logging
import pickle
import random

from globals import * 
from numpy.random import rand


def normalized_slider_prediction(value_A, value_B):
    if sum([value_A, value_B]) == 0: return 0
    else: return round(100 * (value_B / (value_A + value_B)) - 50, 0)


def softmax_list_vals(vals, temp):
    return np.exp(np.array(vals) / temp) / np.sum(np.exp(np.array(vals) / temp), axis=0)


def create_param_dir(log_dir, trial_name, w="NA", naive_temp="NA", soph_temp="NA", max_steps="NA", model_type="simulate"):
    """Creates parameter-specific log directory."""
    if model_type == "simulate":
        param_subdir = f'w{w}_ntemp{naive_temp}_stemp{soph_temp}_steps{max_steps}'
    elif model_type == "uniform":
        param_subdir = f'uniform_steps{max_steps}'
    elif model_type == "empirical":
         param_subdir = 'empirical'
    else:
        param_subdir = 'unknown_model'

    param_log_dir = os.path.join(log_dir, trial_name, param_subdir)
    os.makedirs(param_log_dir, exist_ok=True)
    return param_log_dir


def get_json_files(trial):
    trial_json_path = '../trials/exp1_suspect/json'
    if not os.path.isdir(trial_json_path):
        raise FileNotFoundError(f"Trial JSON directory not found: {trial_json_path}")
    try:
        if trial == 'all':
            return sorted([f for f in os.listdir(trial_json_path) if f.endswith('A1.json')])
        else:
            filename = f'{trial}_A1.json'
            full_path = os.path.join(trial_json_path, filename)
            if os.path.exists(full_path): return [filename]
            else: raise FileNotFoundError(f"Trial file not found: {full_path}")
    except Exception as e: raise IOError(f"Error accessing trial JSON files: {e}")


def load_simple_path_sequences(log_dir_base, trial_name, world, max_steps):
    """
    Loads simple path sequences from .pkl files if they exist.
    If not found, computes them using world.get_subgoal_simple_path_sequences, saves them, and then returns them.
    """
    logger = logging.getLogger(__name__)
    paths_dir = os.path.join(log_dir_base, 'simple_paths')
    os.makedirs(paths_dir, exist_ok=True)

    path_file_A = os.path.join(paths_dir, f'{trial_name}_simple_paths_A.pkl')
    path_file_B = os.path.join(paths_dir, f'{trial_name}_simple_paths_B.pkl')

    sequences_A, sequences_B = None, None

    # Try loading cached simple paths
    if os.path.exists(path_file_A) and os.path.exists(path_file_B):
        try:
            with open(path_file_A, 'rb') as f: sequences_A = pickle.load(f)
            with open(path_file_B, 'rb') as f: sequences_B = pickle.load(f)
            logger.info(f"Loaded cached simple path sequences for {trial_name}.")

        except Exception as e:
            logger.warning(f"Error loading cached sequences for {trial_name}: {e}. Recomputing.")
            sequences_A, sequences_B = None, None 

    # If simple path loading failed or files don't exist, compute simple paths
    if sequences_A is None or sequences_B is None:
        logger.info(f"Computing simple path sequences for {trial_name} (max_steps={max_steps})...")
        try:
            logger.info("Computing paths for Agent A...")
            sequences_A = world.get_subgoal_simple_path_sequences('A', max_steps)
            logger.info("Computing paths for Agent B...")
            sequences_B = world.get_subgoal_simple_path_sequences('B', max_steps)

            try:
                with open(path_file_A, 'wb') as f: pickle.dump(sequences_A, f)
                with open(path_file_B, 'wb') as f: pickle.dump(sequences_B, f)
                logger.info(f"Saved computed sequences to {paths_dir}")
            except Exception as e:
                logger.error(f"Error saving computed sequences for {trial_name}: {e}")

        except Exception as e:
            logger.error(f"Fatal error computing simple path sequences for {trial_name}: {e}")
            return None, None 

    if not (isinstance(sequences_A, list) and len(sequences_A) == 3 and
            isinstance(sequences_B, list) and len(sequences_B) == 3):
        logger.error(f"Computed sequence data for {trial_name} has incorrect structure.")
        return None, None

    return sequences_A, sequences_B
    

def combine_return_paths(fridge_to_door_paths, door_to_start_paths, max_combinations=None):
    """Combine paths from fridge to door with paths from door to start to create complete return paths."""
    logger = logging.getLogger(__name__)
    
    combined_paths = []
    path_combinations = len(fridge_to_door_paths) * len(door_to_start_paths)
    
    if max_combinations and path_combinations > max_combinations:
        logger.info(f"Sampling {max_combinations} return paths from {path_combinations} possible combinations")
        for _ in range(max_combinations):
            mid_path = random.choice(fridge_to_door_paths)
            last_path = random.choice(door_to_start_paths)
            combined_path = [tuple(coord) for coord in (mid_path[:-1] + last_path)]
            combined_paths.append(combined_path)
    else:
        logger.info(f"Creating all {path_combinations} return paths")
        for mid_path in fridge_to_door_paths:
            for last_path in door_to_start_paths:
                combined_path = [tuple(coord) for coord in (mid_path[:-1] + last_path)]
                combined_paths.append(combined_path)
                
    return combined_paths


def save_sampled_paths_to_csv(sampled_data, trial_name, param_log_dir, agent_type):
    """Saves the sampled paths (numbered 2D arrays) to a CSV file."""
    logger = logging.getLogger(__name__)
    paths_data_to_save = []

    for agent in ['A', 'B']:
        agent_data = sampled_data.get(agent)
        if not agent_data or 'numbered_arrays' not in agent_data:
            logger.warning(f"No 'numbered_arrays' data for agent {agent} ({agent_type}) in {trial_name}.")
            continue

        numbered_arrays = agent_data['numbered_arrays']
        full_sequences = agent_data.get('full_sequences', [])
        # crumb_locations = agent_data.get('crumb_locations', [])

        for i, grid in enumerate(numbered_arrays):
            path_str = '\n'.join([' '.join(map(str, row)) for row in grid])
            paths_data_to_save.append({
                'trial': trial_name,
                'agent': agent,
                'agent_type': agent_type,
                'path': path_str, 
                'full_sequence_str': str(full_sequences[i]) if i < len(full_sequences) else "N/A",
            })

    if not paths_data_to_save:
        logger.warning(f"No numbered array data generated to save for {trial_name} ({agent_type}).")
        return

    df = pd.DataFrame(paths_data_to_save)
    csv_path = os.path.join(param_log_dir, f'{trial_name}_sampled_paths_{agent_type}.csv')
    df.to_csv(csv_path, index=False)
    logger.info(f"Saved {len(df)} numbered path arrays to {csv_path}")


furniture_size = {
    'bed': [3, 2],
    'sofa': [3, 2],
    'light': [1, 2],
    'table': [3, 2],
    'side_table': [1, 1],
    'electric_refrigerator': [2, 3],
    'tv': [2, 2]
}

def flip(p):
    if rand() < p:
        return True
    return False