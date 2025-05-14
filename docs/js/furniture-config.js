const furniture_dims = {
    table: {
        dimensions: [3, 2],
        getTiles: (pos) => {
            const tiles = [];
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 2; y++) {
                    tiles.push([pos[0] + x, pos[1] + y]);
                }
            }
            return tiles;
        }
    },
    sofa: {
        dimensions: [3, 2],
        getTiles: (pos) => {
            const tiles = [];
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 2; y++) {
                    tiles.push([pos[0] + x, pos[1] + y]);
                }
            }
            return tiles;
        }
    },
    bed: {
        dimensions: [3, 2],
        getTiles: (pos) => {
            const tiles = [];
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 2; y++) {
                    tiles.push([pos[0] + x, pos[1] + y]);
                }
            }
            return tiles;
        }
    },
    electric_refrigerator: {
        dimensions: [2, 3],
        getTiles: (pos) => {
            const tiles = [];
            for (let x = 0; x < 2; x++) {
                for (let y = 0; y < 3; y++) {
                    tiles.push([pos[0] + x, pos[1] + y]);
                }
            }
            return tiles;
        }
    },
    light: {
        dimensions: [1, 2],
        getTiles: (pos) => {
            return [[pos[0], pos[1]], [pos[0], pos[1] + 1]];
        }
    }
}; 
