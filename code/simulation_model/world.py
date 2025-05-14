import json
import networkx as nx
import numpy as np
import time
import logging
import os
from joblib import Parallel, delayed
from globals import *
from utils import softmax_list_vals


def get_shortest_paths(graph, source, target):
    """Finds all shortest paths between source and target in graph."""
    try:
        return list(nx.all_shortest_paths(graph, source, target))
    except nx.NetworkXNoPath:
        logger = logging.getLogger(__name__)
        logger.warning(f"No path found between {source} and {target}")
        return []

def get_simple_paths(graph, source, target, simple_path_cutoff):
    """Finds all simple paths up to cutoff length."""
    try:
        return list(nx.all_simple_paths(graph, source, target, cutoff=simple_path_cutoff))
    except nx.NetworkXNoPath:
        logger = logging.getLogger(__name__)
        logger.warning(f"No path found between {source} and {target}")
        return []


class World():
    """
    World representation:
    - Uses path sequences (lists of world tuples) internally for logic.
    - Generates numbered 2D arrays (kitchen coords) for output/saving.
    - Calculates likelihood only based on the middle sequence, i.e. path from fridge --> door.
    """
    def __init__(self, info):
        self.width = 0
        self.height = 0
        self.info = info
        self.graph = nx.Graph()
        self.kitchen_info = None
        self.kitchen_width = 0
        self.kitchen_height = 0
        self.kitchen_top_x = 0
        self.kitchen_top_y = 0
        self.start_coords = {}
        self.mission = None
        self._valid_kitchen_crumb_coords_world = None 
        self.create_world()


    def create_world(self):
        """Builds the NetworkX graph and stores key info."""
        self.width = self.info['width']
        self.height = self.info['height']
        self.mission = self.info['agents']['initial'][0]['cur_mission']

        self.kitchen_info = next((r for r in self.info['rooms']['initial'] if r['type'] == 'Kitchen'), None)
        if self.kitchen_info is None:
            raise ValueError("Kitchen room information not found.")

        self.kitchen_width = self.kitchen_info['size'][0]
        self.kitchen_height = self.kitchen_info['size'][1]
        self.kitchen_top_x = self.kitchen_info['top'][0]
        self.kitchen_top_y = self.kitchen_info['top'][1]

        self.start_coords = {
            'A': tuple(self.info['agents']['initial'][0]['pos']),
            'B': tuple(self.info['agents']['initial'][1]['pos'])
        }

        # Create graph
        for r in self.info['rooms']['initial']:
            room_graph = nx.grid_2d_graph(
                range(r['top'][0], r['top'][0] + r['size'][0]),
                range(r['top'][1], r['top'][1] + r['size'][1]),
                create_using=nx.Graph
            )
            nodes_to_remove = {loc for loc in room_graph.nodes if self._is_furniture_at(loc)}
            room_graph.remove_nodes_from(nodes_to_remove)
            for node in room_graph.nodes:
                 room_graph.nodes[node]['is_door'] = False
                 room_graph.nodes[node]['room'] = r['type']
            self.graph = nx.compose(self.graph, room_graph)

        for d in self.info['doors']['initial']:
            door_pos = tuple(d['pos'])
            self.graph.add_node(door_pos, is_door=True, state=d['state'], room=None)
            potential_neighbors = []
            if d['dir'] == 'horz':
                potential_neighbors = [(door_pos[0], door_pos[1]-1), (door_pos[0], door_pos[1]+1)]
            elif d['dir'] == 'vert':
                potential_neighbors = [(door_pos[0]-1, door_pos[1]), (door_pos[0]+1, door_pos[1])]
            for neighbor_pos in potential_neighbors:
                if self.graph.has_node(neighbor_pos):
                    self.graph.add_edge(door_pos, neighbor_pos)


    def _is_furniture_at(self, location_tuple):
        """Checks if world coord tuple is occupied by furniture (excluding crumbs)."""
        loc_x, loc_y = location_tuple
        for r in self.info['rooms']['initial']:
            for f in r['furnitures']['initial']:
                if f['type'] == 'crumbs': continue
                f_x, f_y = f['pos']
                f_w, f_h = furniture_size.get(f['type'], (1, 1))
                if (f_x <= loc_x < f_x + f_w and f_y <= loc_y < f_y + f_h):
                    return True
        return False


    def get_initial_door_states(self):
        """Returns a dictionary of initial door states {door_pos_tuple: state_string}."""
        return {tuple(d['pos']): d['state'] for d in self.info['doors']['initial']}


    def get_fridge_access_point(self):
        """Returns the world coordinate tuple for the fridge access point."""
        if self.mission != 'get_snack': return None
        fridge_info = next((f for f in self.kitchen_info['furnitures']['initial'] if f['type'] == 'electric_refrigerator'), None)
        if fridge_info is None: raise ValueError("Refrigerator not found for access point calculation.")
        fp = fridge_info['pos']
        fridge_access_point = (fp[0] - 1, fp[1] + 2)
        if not self.graph.has_node(fridge_access_point): raise ValueError(f"Calculated Fridge access point {fridge_access_point} is not a valid node in the graph.")
        return fridge_access_point


    def world_to_kitchen_coords(self, world_x, world_y):
        """Convert world coordinates (wx, wy) to kitchen array coordinates (kx, ky)."""
        if (self.kitchen_top_x <= world_x < self.kitchen_top_x + self.kitchen_width and
            self.kitchen_top_y <= world_y < self.kitchen_top_y + self.kitchen_height):
            # kx = col index, ky = row index
            return int(world_x - self.kitchen_top_x), int(world_y - self.kitchen_top_y)
        return None 


    def kitchen_to_world_coords(self, kitchen_x, kitchen_y):
        """Convert kitchen array coords (kx, ky) to world coords (wx, wy)."""
        return int(kitchen_x + self.kitchen_top_x), int(kitchen_y + self.kitchen_top_y)


    def get_valid_kitchen_crumb_coords_world(self):
        """Returns list of valid world coord tuples (wx, wy) for crumbs in kitchen."""
        if self._valid_kitchen_crumb_coords_world is not None:
            return self._valid_kitchen_crumb_coords_world
        valid_coords = []
        kx, ky = self.kitchen_info['top']
        kw, kh = self.kitchen_info['size']
        for world_y in range(ky, ky + kh):
            for world_x in range(kx, kx + kw):
                coord_tuple = (world_x, world_y)
                if self.graph.has_node(coord_tuple) and not self.graph.nodes[coord_tuple].get('is_door', False):
                    valid_coords.append(coord_tuple)
        self._valid_kitchen_crumb_coords_world = sorted(valid_coords)
        # print(f"length of valid kitchen crumb coords: {len(self._valid_kitchen_crumb_coords_world)}")
        return self._valid_kitchen_crumb_coords_world


    def _get_closest_door_to_agent(self, agent_id):
        """Finds closest door node to agent start (world coords)."""
        agent_start_pos = self.start_coords.get(agent_id)
        if not agent_start_pos: return None
        door_nodes = [n for n, data in self.graph.nodes(data=True) if data.get('is_door')]
        if not door_nodes: return None
        closest_door = None
        min_dist = float('inf')
        for door_pos in door_nodes:
            try:
                dist = nx.shortest_path_length(self.graph, source=agent_start_pos, target=door_pos)
                if dist < min_dist:
                    min_dist = dist
                    closest_door = door_pos
            except nx.NetworkXNoPath: continue
        return closest_door


    def get_subgoals(self, agent_id):
        """Get subgoals sequence (world coords tuples) for an agent."""
        start_pos = self.start_coords.get(agent_id)
        if not start_pos: raise ValueError(f"Start pos not found for agent {agent_id}")
        subgoals = [start_pos]
        if self.mission == 'get_snack':
            fridge_info = next((f for f in self.kitchen_info['furnitures']['initial'] if f['type'] == 'electric_refrigerator'), None)
            if fridge_info is None: raise ValueError("Refrigerator not found.")
            fp = fridge_info['pos']
            fridge_access_point = (fp[0] - 1, fp[1] + 2)
            if not self.graph.has_node(fridge_access_point): raise ValueError(f"Fridge access point {fridge_access_point} invalid.")
            door_node = self._get_closest_door_to_agent(agent_id)
            if door_node is None: raise ValueError(f"No reachable door found for agent {agent_id}.")
            subgoals.extend([fridge_access_point, door_node])
        subgoals.append(start_pos)
        return subgoals


    def get_subgoal_simple_path_sequences(self, agent_id, max_steps_middle):
        """Get simple path sequences (lists of world coord tuples) for subgoals."""
        start_time = time.time(); logger = logging.getLogger(__name__)
        try:
            subgoals = self.get_subgoals(agent_id)
            logger.info(f"Subgoals for agent {agent_id}: {subgoals}")
            if len(subgoals) < 4: raise ValueError("Insufficient subgoals.")
        except ValueError as e: logger.error(f"Error getting subgoals for {agent_id}: {e}"); return [[], [], []]
        results = Parallel(n_jobs=-1)(
            [delayed(get_shortest_paths)(self.graph, subgoals[0], subgoals[1]),
             delayed(get_simple_paths)(self.graph, subgoals[1], subgoals[2], max_steps_middle),
             delayed(get_shortest_paths)(self.graph, subgoals[2], subgoals[3])]
        )
        sequences_p1 = sorted(results[0]) if results[0] else []
        sequences_p2 = sorted(results[1]) if results[1] else []
        sequences_p3 = sorted(results[2]) if results[2] else []
        logger.info(f"Paths per segment {agent_id}: {len(sequences_p1)}, {len(sequences_p2)}, {len(sequences_p3)}")
        logger.info(f"Pathfinding time ({agent_id}): {time.time() - start_time:.2f}s")
        return [sequences_p1, sequences_p2, sequences_p3]


    def get_sample_paths(self, agent_id, simple_path_sequences, num_sample_paths,
                         agent_type='naive', w=0.1, temp=0.01,
                         naive_predictions_dict=None):
        """Samples full agent paths, returning sequences, middle sequences, and numbered 2D arrays."""
        start_time = time.time()
        logger = logging.getLogger(__name__)

        # set seed
        np.random.seed(seed)

        sequences_p1, sequences_p2, sequences_p3 = simple_path_sequences

        if not sequences_p1 or not sequences_p2 or not sequences_p3:
            logger.error(f"Cannot sample paths for agent {agent_id}: empty sequence list.")
            return {'full_sequences': [], 'middle_sequences': [], 'numbered_arrays': []}

        # Initialize results
        sampled_full_sequences = []
        sampled_middle_sequences = []
        sampled_numbered_arrays = []

        # Compute likelihoods
        likelihoods = None
        if agent_type != 'uniform':
            middle_path_lengths = np.array([len(seq) for seq in sequences_p2])
            min_len, max_len = np.min(middle_path_lengths), np.max(middle_path_lengths)
            rescaled_lengths = np.zeros_like(middle_path_lengths, dtype=float)  # note these are len(middle_path)
            if max_len > min_len:
                rescaled_lengths = (middle_path_lengths - min_len) / (max_len - min_len)  # rescale to [0, 1]

            if agent_type == 'sophisticated':
                if naive_predictions_dict is None: raise ValueError("Sophisticated agent needs predictions_dict.")
                avg_preds_for_each_seq = []
                # print(f"len(sequences_p2): {len(sequences_p2)}")
                for seq in sequences_p2:
                    valid_locs = [loc for loc in seq if loc in naive_predictions_dict]
                    # print(f"len(seq): {len(seq)}")
                    # print(f"seq: {seq}")
                    # print(f"len(valid_locs): {len(valid_locs)}")
                    # print(f"valid_locs: {valid_locs}")
                    avg_pred = 0.0
                    preds = [naive_predictions_dict[loc] for loc in valid_locs if valid_locs]
                    # print("preds: ", preds)
                    avg_pred = np.mean(preds)
                    avg_preds_for_each_seq.append(avg_pred / 100.0)  # rescale to [-0.5, 0.5]

                avg_preds_array = np.array(avg_preds_for_each_seq)
                # Path utilities / costs
                # Lower slider prediction values --> agent A more likely
                utilities = w * (1 - rescaled_lengths) + (1 - w) * avg_preds_array if agent_id == 'A' \
                    else w * (1 - rescaled_lengths) - (1 - w) * avg_preds_array
                
                costs = w * rescaled_lengths + (1 - w) * (1 - avg_preds_array) if agent_id == 'A' \
                    else w * rescaled_lengths + (1 - w) * avg_preds_array
            
            else:  # Naive
                utilities = w * (1 - rescaled_lengths)
                costs = w * rescaled_lengths

            # likelihoods = softmax_list_vals(utilities, temp=temp)
            likelihoods = softmax_list_vals(-costs, temp=temp)

        # Sample paths
        num_first = len(sequences_p1)
        num_middle = len(sequences_p2)
        num_last = len(sequences_p3)

        for _ in range(num_sample_paths):
            # Sample indices
            idx1 = np.random.randint(0, num_first)
            idx3 = np.random.randint(0, num_last)
            if agent_type == 'uniform':
                idx2 = np.random.randint(0, num_middle)  # uniform sampling
            else:
                idx2 = np.random.choice(num_middle, p=likelihoods)  # weighted sampling according to likelihoods

            # Retrieve paths
            p1_seq = sequences_p1[idx1]
            p2_seq = sequences_p2[idx2]
            p3_seq = sequences_p3[idx3]

            # Store middle path (fridge --> door)
            sampled_middle_sequences.append(p2_seq)

            # Construct full path
            full_sequence = p1_seq[:-1] + p2_seq[:-1] + p3_seq  # remove last element from each sequence (duplicates)
            sampled_full_sequences.append(full_sequence)

            # Generate numbered 2D array (kitchen coords)
            numbered_grid = np.zeros((self.kitchen_height, self.kitchen_width), dtype=np.int16)
            for step, world_coord in enumerate(full_sequence, 1):
                kitchen_coord = self.world_to_kitchen_coords(world_coord[0], world_coord[1])
                if kitchen_coord is not None:
                    kx, ky = kitchen_coord # kx = column, ky = row
                    numbered_grid[ky, kx] = step 
            sampled_numbered_arrays.append(numbered_grid)

        logger.info(f"Time taken for {num_sample_paths} samples ({agent_type} agent {agent_id}): {time.time() - start_time:.2f} seconds")

        return {
            'full_sequences': sampled_full_sequences,  
            'middle_sequences': sampled_middle_sequences,   
            'numbered_arrays': sampled_numbered_arrays    
        }


def initialize_world_start(filename):
    """Initializes World from trial JSON."""
    json_path = f'../trials/exp1_suspect/json/{filename}'
    if not os.path.exists(json_path):
         raise FileNotFoundError(f"Trial JSON file not found: {json_path}")
    with open(json_path, 'r') as f:
        trial_info = json.load(f).get('Grid')
        if trial_info is None: raise KeyError("Expected 'Grid' key not found.")
        return World(trial_info)
