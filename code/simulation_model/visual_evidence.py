import logging
from globals import *
import random 


def get_visual_evidence_likelihood(crumb_coord_tuple, agent_full_sequences, agent_middle_sequences, world_state, door_close_prob=0):
    """
    Calculates the likelihood of observing a crumb at crumb_coord_tuple, given the agent's sampled full path sequences (world coords).
    This involves simulating each full path to determine where crumbs would drop.
    Likelihood for a path is 1 / len(middle_path_segment) if the simulation path generates the crumb, 0 otherwise.
    The final likelihood is averaged over all sampled paths.
    """

    total_likelihood = 0.0
    num_sequences = len(agent_full_sequences)
    fridge_access_point = world_state.get_fridge_access_point()
    initial_door_states = world_state.get_initial_door_states()

    middle_sequence_lengths = [len(seq) for seq in agent_middle_sequences]

    for i, sequence in enumerate(agent_full_sequences):
        if not sequence: continue 

        current_middle_len = middle_sequence_lengths[i]

        simulated_door_states = initial_door_states.copy()
        on_return = False
        generated_crumbs_for_this_path = set()
        
        # Simulate full path
        for coord in sequence:
            node_data = world_state.graph.nodes.get(coord, {})
            is_kitchen = node_data.get('room') == 'Kitchen'
            is_door = node_data.get('is_door', False)

            if coord == fridge_access_point:
                on_return = True

            # Simulate door
            if is_door and coord in simulated_door_states:
                simulated_door_states[coord] = 'open'
                # if random.random() < door_close_prob:
                #     simulated_door_states[coord] = 'closed'

            # Track generated crumbs
            if on_return:
                if is_kitchen and not is_door:
                    generated_crumbs_for_this_path.add(coord)

        # Calculate likelihood for this single path simulation
        likelihood_for_sequence = 0.0
        if crumb_coord_tuple in generated_crumbs_for_this_path:
            # Likelihood is inverse of the path length from fridge --> door
            likelihood_for_sequence = 1.0 / current_middle_len
            
        total_likelihood += likelihood_for_sequence

    average_likelihood = total_likelihood / num_sequences
    return average_likelihood
