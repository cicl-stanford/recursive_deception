async function loadTrialData(trialName, agentIndex) {
    try {
        const response = await fetch(`../exp1/trials/json/${trialName}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        let all_furniture_locations = [];
        data.Grid.rooms.initial.forEach(room => {
            room.furnitures.initial.forEach(furniture => {
                const furnitureConfig = furniture_dims[furniture.type];
                const furniture_tiles = furnitureConfig ? 
                    furnitureConfig.getTiles(furniture.pos) : 
                    [[furniture.pos[0], furniture.pos[1]]];
                
                all_furniture_locations.push({
                    type: furniture.type,
                    tiles: furniture_tiles
                });
            });
        });

        const agent = data.Grid.agents.initial[agentIndex];
        const otherAgentIndex = agentIndex === 0 ? 1 : 0;
        const fridgeData = data.Grid.rooms.initial
            .find(room => room.type === "Kitchen")
            .furnitures.initial
            .find(f => f.type === "electric_refrigerator");

        return {
            grid_width: data.Grid.width,
            grid_height: data.Grid.height,
            agent_location: agent.pos,
            agent_name: agent.name,
            agent_id: agent.id,
            rooms: data.Grid.rooms.initial.map(room => ({
                type: room.type,
                top: room.top,
                size: room.size,
                furnitures: room.furnitures.initial
            })),
            fridge_location: fridgeData.pos,
            fridge_full_location: furniture_dims.electric_refrigerator.getTiles(fridgeData.pos),
            fridge_access_point: [fridgeData.pos[0] - 1, fridgeData.pos[1] + 2],
            doors: data.Grid.doors.initial.map(door => door.pos),
            agent_door_pos: findClosestDoor(data.Grid.doors.initial, agent.pos),
            other_agent_door_pos: findClosestDoor(data.Grid.doors.initial, data.Grid.agents.initial[otherAgentIndex].pos),
            furniture_locations: all_furniture_locations,
            initial_pos: agent.initial_pos
        };
    } catch (error) {
        console.error('Error loading trial data:', error);
        return null;
    }
}

function findClosestDoor(doors, agentPos) {
    return doors.reduce((closest, door) => {
        const dist = Math.abs(door.pos[0] - agentPos[0]) + Math.abs(door.pos[1] - agentPos[1]);
        if (!closest || dist < closest.dist) {
            return { pos: door.pos, dist };
        }
        return closest;
    }, null).pos;
} 
