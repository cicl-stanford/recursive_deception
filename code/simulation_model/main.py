import argparse
import numpy as np
import os
import pandas as pd
import logging
import json
import ast
import time
import random

from globals import * 
from utils import normalized_slider_prediction, load_simple_path_sequences, create_param_dir, get_json_files, save_sampled_paths_to_csv
from world import initialize_world_start 
from visual_evidence import get_visual_evidence_likelihood


def simulate_suspect(w_t0, trial_name, log_dir_base, param_log_dir,
                     simple_paths_A_seqs, simple_paths_B_seqs,
                     agent_type, num_sample_paths, params,
                     naive_predictions_dict=None):  # pass naive detective preds if sophisticated
    """Simulates suspect paths by sampling from simple paths according to the agents' cost functions."""
    logger = logging.getLogger(__name__)
    logger.info(f"Sampling {num_sample_paths} paths for {agent_type} suspect (Trial: {trial_name}).")
    sampled_data = {}
    for agent in ['A', 'B']:
        simple_sequences = simple_paths_A_seqs if agent == 'A' else simple_paths_B_seqs

        path_sampling_args = {
            'agent_id': agent,
            'simple_path_sequences': simple_sequences,
            'num_sample_paths': num_sample_paths,
            'agent_type': agent_type
        }

        if agent_type != 'uniform':
            path_sampling_args['w'] = params['w']
            path_sampling_args['temp'] = params['soph_temp'] if agent_type == 'sophisticated' else params['naive_temp']
            if agent_type == 'sophisticated':
                path_sampling_args['naive_predictions_dict'] = naive_predictions_dict

        result = w_t0.get_sample_paths(**path_sampling_args)
        sampled_data[agent] = result
        
    return sampled_data


def simulate_detective(w_t0, trial_name, sampled_data, agent_type, params, param_log_dir, source_data_type=None, mismatched_run=None):
    """
    Simulates detective predictions using simulated suspect paths. 
    Computes a slider prediction value ([-50, 50])for each possible crumb location in the kitchen.
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Calculating detective predictions based on {agent_type} behavior (Trial: {trial_name}) using detailed simulation.")
    predictions_dict = {}
    crumb_data_for_json = []

    possible_crumb_coords = w_t0.get_valid_kitchen_crumb_coords_world()
    if not possible_crumb_coords:
        logger.error(f"No valid crumb locations for {trial_name}. Cannot calculate predictions.")
        return {}
    logger.info(f"Evaluating {len(possible_crumb_coords)} possible crumb locations...")
    start_pred_time = time.time(); processed_crumbs = 0

    door_close_prob = params.get('door_close_prob', 0) 

    for crumb_tuple in possible_crumb_coords:
        processed_crumbs += 1
        if processed_crumbs % 20 == 0: 
            elapsed = time.time() - start_pred_time
            rate = processed_crumbs / elapsed if elapsed > 0 else 0
            logger.info(f"  Processed {processed_crumbs}/{len(possible_crumb_coords)} crumbs... ({rate:.1f}/sec)")

        visual_evidence_likelihood_vals = []
        for agent in ['A', 'B']:
            agent_data = sampled_data.get(agent)
            full_sequences = agent_data.get('full_sequences')
            middle_sequences = agent_data.get('middle_sequences')

            likelihood_value = get_visual_evidence_likelihood(
                crumb_coord_tuple=crumb_tuple,
                agent_full_sequences=full_sequences,   
                agent_middle_sequences=middle_sequences,   
                world_state=w_t0,
                door_close_prob=door_close_prob          
            )
            visual_evidence_likelihood_vals.append(likelihood_value)

        likelihood_A, likelihood_B = visual_evidence_likelihood_vals
        slider_prediction = normalized_slider_prediction(likelihood_A, likelihood_B)
        predictions_dict[crumb_tuple] = slider_prediction

        crumb_data_for_json.append({
            "trial": trial_name, "evidence": "visual", "agent_type": agent_type,
            "crumb_location_world_coords": list(crumb_tuple),
            "slider_prediction": float(slider_prediction),
            "evidence_likelihood_A": float(likelihood_A),
            "evidence_likelihood_B": float(likelihood_B)
        })

        if source_data_type is not None:
            crumb_data_for_json[-1]['source_data_type'] = source_data_type
        if mismatched_run is not None:
            crumb_data_for_json[-1]['mismatched_run'] = mismatched_run

    end_pred_time = time.time()
    logger.info(f"Finished evaluating crumbs in {end_pred_time - start_pred_time:.2f} seconds.")

    safe_agent_type_tag = agent_type.replace(" ", "_").replace("/", "_")
    json_filename = os.path.join(param_log_dir, f'detective_preds_{trial_name}_{safe_agent_type_tag}.json')
    try:
        with open(json_filename, 'w') as f: json.dump(crumb_data_for_json, f, indent=4)
        logger.info(f"Saved detailed detective predictions ({agent_type}) to {json_filename}")
    except Exception as e: logger.error(f"Failed to save detective predictions JSON: {e}")

    return predictions_dict


#### Main Simulation Runner ####
def run_simulation_model(log_dir_base, param_log_dir, trial_list, params):
    """Runs the full hybrid simulation model."""
    logger = logging.getLogger(__name__)
    all_results = []

    num_sample_paths_suspect, num_sample_paths_for_detective = sample_paths_suspect, sample_paths_detective  

    logger.info(f"Simulating {num_sample_paths_suspect} suspect paths per agent type.")
    logger.info(f"Simulating {num_sample_paths_for_detective} suspect paths for detective calculation.")

    max_steps = params.get('max_steps', 25)

    for trial_file in trial_list:
        trial_name = trial_file.split('_A1.json')[0]
        logger.info(f"===== Running RSM for Trial: {trial_name} =====")
        try:
            w_t0 = initialize_world_start(trial_file)

            simple_paths_A_seqs, simple_paths_B_seqs = load_simple_path_sequences(log_dir_base, trial_name, w_t0, max_steps)
            if simple_paths_A_seqs is None or simple_paths_B_seqs is None:
                logger.error(f"Failed to load or compute simple paths for {trial_name}. Skipping.")
                continue

            ## Naive
            logger.info("--- Simulating Level 1 (Naive Agent) ---")
            # 1. Suspect paths
            logger.info(f"Simulating {num_sample_paths_suspect} paths for suspect (naive)...")
            sampled_data_naive = simulate_suspect(
                w_t0, trial_name, log_dir_base, param_log_dir,
                simple_paths_A_seqs, simple_paths_B_seqs, 'naive',
                num_sample_paths_suspect, params
            )
            save_sampled_paths_to_csv(sampled_data_naive, trial_name, param_log_dir, 'naive')

            # 2. Detective simulated paths  
            logger.info(f"Simulating {num_sample_paths_for_detective} paths for detective (naive)...")
            sampled_data_naive_detective = simulate_suspect(
                w_t0, trial_name, log_dir_base, param_log_dir,
                simple_paths_A_seqs, simple_paths_B_seqs, 'naive',
                num_sample_paths_for_detective, params 
            )
            naive_predictions_dict = simulate_detective(
                w_t0, trial_name, sampled_data_naive_detective, 'naive', params, param_log_dir
            )
            if not naive_predictions_dict:
                logger.warning(f"Skipping sophisticated agent for {trial_name} due to empty naive predictions.")
                continue

            ## Sophisticated
            logger.info("--- Simulating Level 2 (Sophisticated) ---")
            # 1. Suspect paths
            logger.info(f"Simulating {num_sample_paths_suspect} paths for suspect (sophisticated)...")
            sampled_data_soph = simulate_suspect(
                w_t0, trial_name, log_dir_base, param_log_dir,
                simple_paths_A_seqs, simple_paths_B_seqs, 'sophisticated',
                num_sample_paths_suspect, params, naive_predictions_dict 
            )
            save_sampled_paths_to_csv(sampled_data_soph, trial_name, param_log_dir, 'sophisticated')

            # 2. Detective simulated paths  
            logger.info(f"Simulating {num_sample_paths_for_detective} paths for detective (sophisticated)...")
            sampled_data_soph_detective = simulate_suspect(
                w_t0, trial_name, log_dir_base, param_log_dir,
                simple_paths_A_seqs, simple_paths_B_seqs, 'sophisticated',
                num_sample_paths_for_detective, params, naive_predictions_dict
            )
            soph_predictions_dict = simulate_detective(
                w_t0, trial_name, sampled_data_soph_detective, 'sophisticated', params, param_log_dir 
            )

            all_results.append({
                "trial": trial_name, 
                "naive_predictions": naive_predictions_dict, 
                "sophisticated_predictions": soph_predictions_dict
            })
            logger.info(f"===== Finished Trial: {trial_name} =====")
       
        except Exception as e:
            logger.error(f"##### ERROR processing trial {trial_name}: {e} #####")
            import traceback; traceback.print_exc()
    
    return all_results


#### Empirical Model Runner ####
def run_empirical_model(log_dir_base, param_log_dir, trials_to_run, empirical_path_file, sim_params, mismatched=False):
    """Runs the analysis based on empirical path data, optionally mismatched."""
    logger = logging.getLogger(__name__)
    logger.info(f"Loading empirical paths from: {empirical_path_file}")
    logger.info(f"Mismatched analysis: {mismatched}")

    try:
        all_empirical_paths_df = pd.read_csv(empirical_path_file)
        required_cols = ['trial', 'agent', 'agent_type', 'full_sequence_world_coords', 'middle_sequence_world_coords']
        missing_cols = [col for col in required_cols if col not in all_empirical_paths_df.columns]
        if missing_cols:
            logger.error(f"Empirical CSV missing required columns for detailed simulation: {missing_cols}")
            exit()

        full_path_col = 'full_sequence_world_coords'
        middle_path_col = 'middle_sequence_world_coords' 
        all_empirical_paths_df[full_path_col] = all_empirical_paths_df[full_path_col].apply(ast.literal_eval)
        all_empirical_paths_df[middle_path_col] = all_empirical_paths_df[middle_path_col].apply(ast.literal_eval) # Parse middle sequence too
        logger.info(f"Successfully loaded and parsed {len(all_empirical_paths_df)} empirical paths.")

    except FileNotFoundError:
        logger.error(f"Empirical path file not found at: {empirical_path_file}")
        exit()

    all_trial_results = []
    for trial_file in trials_to_run:
        trial_name = trial_file.split('_A1.json')[0]
        logger.info(f"===== Running Empirical Analysis for Trial: {trial_name} (Mismatched: {mismatched}) =====")
        try:
            w_t0 = initialize_world_start(trial_file)
            trial_df_all = all_empirical_paths_df[all_empirical_paths_df['trial'] == trial_name]

            if trial_df_all.empty:
                logger.warning(f"No empirical paths found for trial {trial_name} in the CSV. Skipping.")
                continue

            path_data_by_type = {
                'naive': {'A': {'full_sequences': [], 'middle_sequences': []}, 'B': {'full_sequences': [], 'middle_sequences': []}},
                'sophisticated': {'A': {'full_sequences': [], 'middle_sequences': []}, 'B': {'full_sequences': [], 'middle_sequences': []}}
            }
            has_data = {'naive': False, 'sophisticated': False}

            for agent_type_in_data in ['naive', 'sophisticated']:
                type_df = trial_df_all[trial_df_all['agent_type'] == agent_type_in_data]
                if not type_df.empty:
                    has_data[agent_type_in_data] = True
                    for _, row in type_df.iterrows():
                        agent = row['agent']
                        full_sequence = row[full_path_col]
                        middle_sequence = row[middle_path_col]
                        if agent in path_data_by_type[agent_type_in_data]:
                            path_data_by_type[agent_type_in_data][agent]['full_sequences'].append(full_sequence)
                            path_data_by_type[agent_type_in_data][agent]['middle_sequences'].append(middle_sequence) 
                        else:
                            logger.warning(f"Unknown agent '{agent}' found in {agent_type_in_data} data for trial {trial_name}. Skipping row.")

            trial_results = {"trial": trial_name, "predictions": {}}
            for prediction_type in ['naive', 'sophisticated']:
                if mismatched:
                    source_data_type = 'sophisticated' if prediction_type == 'naive' else 'naive'
                else:
                    source_data_type = prediction_type

                logger.info(f"Calculating {prediction_type.capitalize()} predictions using {source_data_type.capitalize()} empirical paths --- ")

                if not has_data[source_data_type]:
                    logger.warning(f"Source data type '{source_data_type}' needed for {prediction_type} prediction is missing for trial {trial_name}. Skipping.")
                    trial_results["predictions"][prediction_type] = {}
                    continue

                data_for_detective = path_data_by_type[source_data_type]

                logger.info(f"Using paths: Agent A (Full: {len(data_for_detective['A']['full_sequences'])}, Middle: {len(data_for_detective['A']['middle_sequences'])}) "
                            f"Agent B (Full: {len(data_for_detective['B']['full_sequences'])}, Middle: {len(data_for_detective['B']['middle_sequences'])}) from {source_data_type} data.")

                output_agent_type_tag = f"empirical_{prediction_type}{"_mismatched" if mismatched else ""}"
                predictions_dict = simulate_detective(
                    w_t0, trial_name, data_for_detective, output_agent_type_tag,
                    sim_params, param_log_dir,
                    source_data_type=source_data_type,
                    mismatched_run=mismatched
                )
                trial_results["predictions"][prediction_type] = predictions_dict

            all_trial_results.append(trial_results)
            logger.info(f"===== Finished Empirical Analysis for Trial: {trial_name} =====")

        except Exception as e:
            logger.error(f"ERROR processing trial {trial_name} for empirical analysis: {e}")
            import traceback; traceback.print_exc()

    logger.info("Empirical analysis completed.")
    return all_trial_results


#### Uniform Model Runner ####
def run_uniform_model(log_dir_base, param_log_dir, trials_to_run, sim_params):
    """Runs the simulation using uniform path selection."""
    logger = logging.getLogger(__name__)

    num_uniform_samples_suspect, num_uniform_samples_detective = sample_paths_suspect, sample_paths_detective

    max_steps = sim_params.get('max_steps', 25)

    all_uniform_results = []
    for trial_file in trials_to_run:
        trial_name = trial_file.split('_A1.json')[0]
        logger.info(f"===== Running Uniform Simulation for Trial: {trial_name} =====")
        try:
            w_t0 = initialize_world_start(trial_file)
            simple_paths_A_seqs, simple_paths_B_seqs = load_simple_path_sequences(log_dir_base, trial_name, w_t0, max_steps)

            if simple_paths_A_seqs is None or simple_paths_B_seqs is None:
                logger.error(f"Simple path sequences not found or failed to load for {trial_name}. Skipping uniform trial.")
                continue

            logger.info(f"Simulating {num_uniform_samples_suspect} paths for suspect (uniform)...")
            sampled_data_uniform_save = simulate_suspect(
                w_t0, trial_name, log_dir_base, param_log_dir,
                simple_paths_A_seqs, simple_paths_B_seqs, 'uniform',
                num_uniform_samples_suspect, {}  # no w or temp params for uniform
            )
            save_sampled_paths_to_csv(sampled_data_uniform_save, trial_name, param_log_dir, 'uniform')

            logger.info(f"Simulating {num_uniform_samples_detective} paths for detective (uniform)...")
            sampled_data_uniform_detective = simulate_suspect(
                w_t0, trial_name, log_dir_base, param_log_dir,
                simple_paths_A_seqs, simple_paths_B_seqs, 'uniform',
                num_uniform_samples_detective, {}
            )

            uniform_predictions_dict = simulate_detective(w_t0, trial_name, sampled_data_uniform_detective, 'uniform', sim_params, param_log_dir)

            all_uniform_results.append({
                "trial": trial_name,
                "uniform_predictions": uniform_predictions_dict
            })
            logger.info(f"===== Finished Uniform Simulation for Trial: {trial_name} =====")

        except Exception as e:
            logger.error(f"ERROR processing trial {trial_name} for uniform simulation: {e}")
            import traceback; traceback.print_exc()

    logger.info("Uniform simulation completed.")
    return all_uniform_results


def parse_arguments():
    parser = argparse.ArgumentParser("Simulation argument parser")
    subparser = parser.add_subparsers(dest="command")

    # RSM
    simulate = subparser.add_parser("simulate", help="Run recursive simulation model")
    simulate.add_argument('--trial', type=str, default='snack1', help='which trial to run (default: `snack1`)')
    simulate.add_argument('--w', type=float, default=0.1, help='weight parameter (default: 0.1)')
    simulate.add_argument('--n-temp', type=float, default=0.01, help='softmax temperature parameter for naive agent (default: 0.01)')
    simulate.add_argument('--s-temp', type=float, default=0.01, help='softmax temperature parameter for sophisticated agent (default: 0.01)')
    simulate.add_argument('--max-steps', type=int, default=25, help='maximum number of steps for subgoal simple paths (default: 25)')
    simulate.add_argument('--log-dir', type=str, default='../../results', help='data logging directory for model (default: `../../results`)')

    # Empirical
    empirical = subparser.add_parser("empirical", help="Run empirical model")
    empirical.add_argument('--trial', type=str, default='snack1', help='which trial to run (default: `snack1`)')
    empirical.add_argument('--paths', type=str, default='../../data/exp1_suspect/humans/human_paths.csv', help='Path to CSV containing empirical paths (default: `../../data/exp1_suspect/humans/human_paths.csv`)')
    empirical.add_argument('--log-dir', type=str, default='../../results', help='data logging directory for model (default: `../../results`)')
    empirical.add_argument('--mismatched', action='store_true', help='Calculate naive preds using soph paths, and vice versa (default: False)')

    # Uniform
    uniform = subparser.add_parser("uniform", help="Run uniform model")
    uniform.add_argument('--trial', type=str, default='snack1', help='which trial to run (default: `snack1`)')
    uniform.add_argument('--max-steps', type=int, default=25, help='maximum number of steps for subgoal simple paths (default: 25)')
    uniform.add_argument('--log-dir', type=str, default='../../results', help='data logging directory for model (default: `../../results`)')

    return parser.parse_args()


if __name__ == '__main__':
    arglist = parse_arguments()
    update_globals(arglist) 
    np.random.seed(seed)
    random.seed(seed)

    log_dir_base = arglist.log_dir
    if not os.path.exists(log_dir_base): os.makedirs(log_dir_base)

    trial_id_for_log = arglist.trial if arglist.trial != 'all' else "all_trials"

    if arglist.command == 'simulate':
        param_log_dir = create_param_dir(
            log_dir_base, trial_id_for_log,
            arglist.w, arglist.n_temp, arglist.s_temp, arglist.max_steps,
            model_type="simulate"
        )
        log_filename = os.path.join(param_log_dir, 'simulation.log')
        sim_params = {
            'w': arglist.w, 'naive_temp': arglist.n_temp,
            'soph_temp': arglist.s_temp, 'max_steps': arglist.max_steps,
            'door_close_prob': 0   # assume door is always open 
        }

    elif arglist.command == 'empirical':
        param_log_dir = create_param_dir(log_dir_base, trial_id_for_log, model_type="empirical")
        log_filename = os.path.join(param_log_dir, 'empirical.log')
        if not os.path.exists(arglist.paths):
            print(f"Error: Empirical path file not found: {arglist.paths}")
            exit(1)
        sim_params = {'door_close_prob': 0}

    elif arglist.command == 'uniform':
        param_log_dir = create_param_dir(
            log_dir_base, trial_id_for_log,
            max_steps=arglist.max_steps,
            model_type="uniform"
        )
        log_filename = os.path.join(param_log_dir, 'uniform_simulation.log')
        sim_params = {'door_close_prob': 0}

    else:
        print(f"Unknown command: {arglist.command}")
        exit(1)

    # Setup logging
    if os.path.exists(log_filename): open(log_filename, 'w').close()
    logging.basicConfig(
        level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        handlers=[logging.FileHandler(log_filename), logging.StreamHandler()]
    )
    logger = logging.getLogger(__name__)

    try: trials_to_run = get_json_files(arglist.trial)
    except (FileNotFoundError, IOError) as e: logger.error(f"Fatal: {e}"); exit(1)

    logger.info(f"Starting {arglist.command} process...")
    logger.info(f"Results directory: {param_log_dir}")
    logger.info(f"Trials: {', '.join(t.split('_A1.json')[0] for t in trials_to_run)}")
    logger.info(f"Simulation parameters: {sim_params}")

    if arglist.command == 'simulate':
        logger.info(f"Running RSM ...")
        simulation_results = run_simulation_model(log_dir_base, param_log_dir, trials_to_run, sim_params)

    elif arglist.command == 'empirical':
        logger.info(f"Running empirical analysis ...")
        logger.info(f"Using empirical path file: {arglist.paths}")
        logger.info(f"Mismatched run: {arglist.mismatched}")
        empirical_results = run_empirical_model(
            log_dir_base, param_log_dir, trials_to_run,
            arglist.paths, sim_params,
            mismatched=arglist.mismatched
        )

    elif arglist.command == 'uniform':
        logger.info(f"Running uniform simulation ...")
        uniform_results = run_uniform_model(log_dir_base, param_log_dir, trials_to_run, sim_params)