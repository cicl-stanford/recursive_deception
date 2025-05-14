var marplePathDrawing = (function (jspsych) {
    'use strict';
  
    const info = {
      name: 'marple-path-drawing',
      parameters: {
        trial: {
          type: jspsych.ParameterType.STRING,
          default: undefined
        },
        agent_type: {
          type: jspsych.ParameterType.STRING,
          default: undefined
        },
        image_path: {
          type: jspsych.ParameterType.STRING,
          default: undefined
        },
        prompt: {
          type: jspsych.ParameterType.STRING,
          default: undefined
        },
        grid_width: {
          type: jspsych.ParameterType.INT,
          default: undefined
        },
        grid_height: {
            type: jspsych.ParameterType.INT,
            default: undefined
        },
        agent_location: {
          type: jspsych.ParameterType.ARRAY,
          default: undefined
        },
        fridge_location: {
          type: jspsych.ParameterType.ARRAY,
          default: undefined
        },
        fridge_full_location: {
          type: jspsych.ParameterType.ARRAY,
          default: undefined
        },
        fridge_access_point: {
          type: jspsych.ParameterType.ARRAY,
          default: undefined
        },
        rooms: {
            type: jspsych.ParameterType.OBJECT,
            array: true,
            default: undefined
        },
        doors: {
            type: jspsych.ParameterType.ARRAY,
            array: true,
            default: undefined
        },
        agent_name: {
            type: jspsych.ParameterType.STRING,
            default: undefined
        },
        agent_id: {
            type: jspsych.ParameterType.INT,
            default: undefined
        },
        furniture_locations: {
            type: jspsych.ParameterType.ARRAY,
            array: true,
            default: undefined
        },
        show_previous_path: {
            type: jspsych.ParameterType.BOOL,
            default: false
        },
        previous_path: {
            type: jspsych.ParameterType.FUNCTION,
            default: () => []
        },
        is_return_path: {
            type: jspsych.ParameterType.BOOL,
            default: false
        },
        agent_door_pos: {
            type: jspsych.ParameterType.ARRAY,
            default: undefined
        },
        other_agent_door_pos: {
            type: jspsych.ParameterType.ARRAY,
            default: undefined
        }
      }
    };
  
    class MarplePathDrawingGridPlugin {
      constructor(jsPsych) {
        this.jsPsych = jsPsych;
      }
  
      trial(display_element, trial) {
        const setupGridUI = () => {
            let isMouseDown = false;
            const rows = trial.grid_height;
            const cols = trial.grid_width;
            let grid = Array(rows).fill().map(() => Array(cols).fill(0));
            let selectedTiles = [];
            let hasReachedTarget = false;
            
            if (trial.show_previous_path) {
                const previousPath = trial.previous_path();
                previousPath.forEach(tile => {
                    const $tile = $(`.grid-square[data-row="${tile.row}"][data-col="${tile.col}"]`);
                    $tile.css('background-color', 'rgba(128, 128, 128, 0.3)');
                });
            }
      
            var html = '<div class="marple-path-drawing" style="text-align: center; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif; outline: none;">';
            html += '<div style="margin-top: 20px;"></div>'; 
            html += `<h3 style="font-weight: normal;">${trial.prompt}</h3>`;
            
            html += '<div style="margin-top: 10px;"></div>';
            html += '<div id="jspsych-path-drawing-stimulus" style="position: relative; width: 500px; margin: 0 auto; display: inline-block; outline: none;">';
            html += '<img id="trial-stimulus-image" src="" style="width: 100%; display: block; outline: none;">'; 
            html += '</div>';
            html += '<div id="message-container" style="height: 10px; margin: 10px; font-size: 14px;">';
            html += '<span id="error-message" style="color: red;"></span>';
            html += '<span id="success-message" style="color: green;"></span>';
            html += '</div>';
            html += '<div style="margin: 0px 10px;">';
            html += '<button id="clear-btn" class="jspsych-btn" style="margin: 10px 40px;">Clear</button>';
            html += '<button id="submit-btn" class="jspsych-btn jspsych-btn-submit" style="margin: 10px 40px;">Submit</button>';
            html += '</div></div>';
      
            display_element.innerHTML = html;
      
            const img = display_element.querySelector('#trial-stimulus-image');
            const container = display_element.querySelector('#jspsych-path-drawing-stimulus');
      
            img.onload = function() {
              const imgHeight = img.offsetHeight;
              const imgWidth = img.offsetWidth;
              
              for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                  const gridSquare = createGridSquare(i, j, imgWidth, imgHeight, rows, cols, trial);
                  if (gridSquare) container.appendChild(gridSquare);
                }
              }
      
              $('.grid-square').on({
                mousedown: function(e) {
                    isMouseDown = true; 
                    toggleTile($(this), true, trial, grid, selectedTiles, hasReachedTarget, rows, cols);
                },
                mouseup: function(e) {
                    isMouseDown = false;
                },
              });
            };
            img.src = trial.image_path;

            function createGridSquare(i, j, imgWidth, imgHeight, rows, cols, currentTrial) {
                if (!currentTrial.rooms) {
                    return null;
                }
                if (i >= rows - 1) return null;
        
                const borderOffset = 0; 
                const verticalOffset = 30;
                const horizontalOffset = 0;
                const adjustedWidth = imgWidth - (borderOffset * 2) - horizontalOffset;
                const adjustedHeight = imgHeight - (borderOffset * 2) - verticalOffset;
                
                const square = document.createElement('div');
                square.className = 'grid-square';
                square.dataset.row = i;
                square.dataset.col = j;
              
                const isAgent = currentTrial.agent_location && currentTrial.agent_location[1] === i && currentTrial.agent_location[0] === j; 
                const isFridge = currentTrial.fridge_location && currentTrial.fridge_location[1] === i && currentTrial.fridge_location[0] === j; 
                const isFridgeFull = currentTrial.fridge_full_location && currentTrial.fridge_full_location.some(pos => pos[1] === i && pos[0] === j);
                const isFridgeAccessPoint = currentTrial.fridge_access_point && currentTrial.fridge_access_point[1] === i && currentTrial.fridge_access_point[0] === j; 
                const isDoor = currentTrial.doors && currentTrial.doors.some(door => door[1] === i && door[0] === j);

                const isRoomBoundary = currentTrial.rooms.some(room => {
                    const roomTop = room.top;
                    const roomSize = room.size;
                    
                    const isOnVerticalWall = (j === roomTop[0] - 1 || j === roomTop[0] + roomSize[0]) && 
                                            (i >= roomTop[1] - 1 && i < roomTop[1] + roomSize[1]);
                    const isOnHorizontalWall = (i === roomTop[1] - 1 || i === roomTop[1] + roomSize[1]) && 
                                                (j >= roomTop[0] - 1 && j < roomTop[0] + roomSize[0]);
                    
                    return isOnVerticalWall || isOnHorizontalWall;
                });
        
              
              let backgroundColor = 'transparent';

              if (currentTrial.show_previous_path && 
                  currentTrial.previous_path().some(tile => tile.row === i && tile.col === j)) {
                  backgroundColor = 'rgba(128, 128, 128, 0.3)';
              }

              if (!currentTrial.is_return_path) {
                  if (isAgent) {
                      backgroundColor = 'rgba(0, 255, 0, 0.4)'; 
                  } else if (isFridgeAccessPoint) {
                      backgroundColor = 'rgba(0, 255, 0, 0.4)'; 
                  }
              } else {
                  if (currentTrial.start_tile && currentTrial.start_tile[1] === i && currentTrial.start_tile[0] === j) {
                      backgroundColor = 'rgba(0, 255, 0, 0.4)'; 
                  } else if (currentTrial.target_tile && currentTrial.target_tile[1] === i && currentTrial.target_tile[0] === j) {
                      backgroundColor = 'rgba(0, 255, 0, 0.4)'; 
                  }
              }

              square.style.cssText = `
                  position: absolute;
                  width: ${adjustedWidth/cols}px;
                  height: ${adjustedHeight/rows}px;
                  left: ${borderOffset + (j * (adjustedWidth/cols))}px;
                  top: ${verticalOffset + borderOffset + (i * (adjustedHeight/rows))}px;
                  border: 1px solid rgba(200, 200, 200, 0.2);
                  box-sizing: border-box;
                  background-color: ${backgroundColor};
              `;
              return square;
            }

            function toggleTile($tile, allowToggle, currentTrial, currentGrid, currentSelectedTiles, currentHasReachedTarget, numRows, numCols) {
                const row = parseInt($tile.data('row'));
                const col = parseInt($tile.data('col'));

                const isTargetSquare = !currentTrial.is_return_path ? 
                    (row === currentTrial.fridge_access_point[1] && col === currentTrial.fridge_access_point[0]) :
                    (row === currentTrial.target_tile[1] && col === currentTrial.target_tile[0]);

                const isFurniture = currentTrial.furniture_locations && currentTrial.furniture_locations.some(furniture => 
                    furniture.tiles.some(pos => pos[1] === row && pos[0] === col)
                );

                if (isFurniture) {
                    showError("You cannot place tiles on furniture.");
                    return;
                }

                const isSpecialTile = !currentTrial.is_return_path ? 
                    ((currentTrial.agent_location[1] === row && currentTrial.agent_location[0] === col) || 
                    (currentTrial.fridge_access_point[1] === row && currentTrial.fridge_access_point[0] === col)) :

                    ((currentTrial.start_tile && currentTrial.start_tile[1] === row && currentTrial.start_tile[0] === col) || 
                    (currentTrial.target_tile && currentTrial.target_tile[1] === row && currentTrial.target_tile[0] === col));


                const isPartOfPreviousPath = currentTrial.show_previous_path && 
                    currentTrial.previous_path().some(tile => tile.row === row && tile.col === col);

                if (currentGrid[row][col] === 0) {
                    if (!isValidMove(row, col, currentTrial, currentSelectedTiles, currentHasReachedTarget)) {
                        return;
                    }
                    
                    currentGrid[row][col] = 1;
                    currentSelectedTiles.push({row: row, col: col});
                    
                    if (isPartOfPreviousPath) {
                        $tile.css('background-color', 'rgba(255, 0, 0, 0.8)');
                    } else {
                        $tile.css('background-color', 'rgba(255, 0, 0, 0.5)'); 
                    }
                    showError('');

                    if (isTargetSquare) {
                        currentHasReachedTarget = true;
                        showSuccess("Path complete! Click submit to continue.");
                    }
                } 
                else if (allowToggle) {
                    const lastTile = currentSelectedTiles.length > 0 ? currentSelectedTiles[currentSelectedTiles.length - 1] : null;
                    if (!lastTile || lastTile.row !== row || lastTile.col !== col) {
                        showError("You can only remove tiles from the end of your path.");
                        return;
                    }

                    currentGrid[row][col] = 0;
                    currentSelectedTiles.pop();
                    
                    if (isSpecialTile) {
                        $tile.css('background-color', 'rgba(0, 255, 0, 0.4)'); 
                    } else if (isPartOfPreviousPath) {
                        $tile.css('background-color', 'rgba(128, 128, 128, 0.3)'); 
                    } else {
                        $tile.css('background-color', 'transparent');
                    }
                    showError('');

                    if (isTargetSquare) {
                        currentHasReachedTarget = false;
                    }
                }
            }

            function showError(message) {
                $('#error-message').text(message);
                $('#success-message').text(''); 
            }

            function showSuccess(message) {
                $('#success-message').text(message);
                $('#error-message').text('');
            }
  
            function isValidMove(row, col, currentTrial, currentSelectedTiles, currentHasReachedTarget) {
                if (currentHasReachedTarget) {
                    showError("Path is complete. Click submit or clear to start over.");
                    return false;
                }

                const isTargetSquare = !currentTrial.is_return_path ? 
                    (row === currentTrial.fridge_access_point[1] && col === currentTrial.fridge_access_point[0]) :
                    (row === currentTrial.target_tile[1] && col === currentTrial.target_tile[0]);

                const isDoor = currentTrial.doors && 
                    currentTrial.doors.some(door => door[1] === row && door[0] === col);

                const isFridgeFull = currentTrial.fridge_full_location && 
                    currentTrial.fridge_full_location.some(pos => 
                        pos[1] === row && pos[0] === col
                    );

                const isWall = !isDoor && currentTrial.rooms.some(room => {
                    const roomTop = room.top;
                    const roomSize = room.size;
                    
                    const isOnVerticalWall = (col === roomTop[0] - 1 || col === roomTop[0] + roomSize[0]) && 
                                           (row >= roomTop[1] - 1 && row < roomTop[1] + roomSize[1]);
                    const isOnHorizontalWall = (row === roomTop[1] - 1 || row === roomTop[1] + roomSize[1]) && 
                                             (col >= roomTop[0] - 1 && col < roomTop[0] + roomSize[0]);
                    
                    return isOnVerticalWall || isOnHorizontalWall;
                });

                const isOtherAgentDoor = currentTrial.other_agent_door_pos && 
                    currentTrial.other_agent_door_pos[1] === row && 
                    currentTrial.other_agent_door_pos[0] === col;
                if (isOtherAgentDoor) {
                    showError("You cannot place tiles in the other agent's room.");
                    return false;
                }

                const isFurniture = currentTrial.rooms.some(room => 
                    room.furnitures.some(furniture => {
                        let occupiedTiles = [];
                        if (typeof furniture_dims !== 'undefined' && furniture_dims[furniture.type]) {
                            occupiedTiles = furniture_dims[furniture.type].getTiles(furniture.pos);
                        } else {
                            occupiedTiles = [[furniture.pos[0], furniture.pos[1]]]; 
                        }
                        return occupiedTiles.some(pos => pos[1] === row && pos[0] === col);
                    })
                );

                if (isWall || isFurniture || isFridgeFull) {
                    showError("You cannot place tiles on walls or furniture.");
                    return false;
                }

                if (currentSelectedTiles.length === 0) {
                    if (!currentTrial.is_return_path) {
                        if (row === currentTrial.agent_location[1] && col === currentTrial.agent_location[0]) {
                            return true;
                        } else {
                            showError("You must start from the agent's starting position (green tile).");
                            return false;
                        }
                    } else {
                        if (currentTrial.start_tile && row === currentTrial.start_tile[1] && col === currentTrial.start_tile[0]) {
                            return true;
                        } else {
                            showError("You must start from the current designated starting position (green tile).");
                            return false;
                        }
                    }
                }

                const lastTile = currentSelectedTiles[currentSelectedTiles.length - 1];
                const isHorizontal = row === lastTile.row && Math.abs(col - lastTile.col) === 1;
                const isVertical = col === lastTile.col && Math.abs(row - lastTile.row) === 1;
                
                if (!(isHorizontal || isVertical)) {
                    showError("Invalid move. Tiles must be connected horizontally or vertically.");
                    return false;
                }

                return true;
            }
  
            function isPathComplete() {
                if (selectedTiles.length === 0) {
                    showError("You must draw a path before submitting.");
                    return false;
                }
          
                let visited = new Set();
                let current = selectedTiles[0];
                visited.add(`${current.row},${current.col}`);
          
                while (true) {
                    let nextTile = selectedTiles.find(tile => 
                        !visited.has(`${tile.row},${tile.col}`) && 
                        ((Math.abs(tile.row - current.row) === 1 && tile.col === current.col) || 
                         (Math.abs(tile.col - current.col) === 1 && tile.row === current.row))  
                    );
            
                    if (!nextTile) {
                        break;
                    }
            
                    visited.add(`${nextTile.row},${nextTile.col}`);
                    current = nextTile;
                }
          
              if (visited.size !== selectedTiles.length) {
                  showError("Your path must be continuous. All tiles must be connected horizontally or vertically and non-overlapping.");
                  return false;
              }
          
              const startTile = selectedTiles[0];
              const endTile = selectedTiles[selectedTiles.length - 1];
          
              if (!trial.is_return_path) {
                  if (startTile.row !== trial.agent_location[1] || startTile.col !== trial.agent_location[0]) {
                      showError("Your path must start at the agent's starting position (green tile).");
                      return false;
                  }
                  if (endTile.row !== trial.fridge_access_point[1] || endTile.col !== trial.fridge_access_point[0]) {
                      showError("Your path must end at the fridge access point (green tile).");
                      return false;
                  }
              } else {
                  if (!trial.start_tile || startTile.row !== trial.start_tile[1] || startTile.col !== trial.start_tile[0]) {
                      showError("Your path must start from the current designated starting position (green tile).");
                      return false;
                  }
                  if (!trial.target_tile || endTile.row !== trial.target_tile[1] || endTile.col !== trial.target_tile[0]) {
                      showError("Your path must end at the agent's initial position (green tile).");
                      return false;
                  }
              }
          
              return true;
          }
  
            // Clear button 
            $('#clear-btn').on('click', () => {
                grid = Array(rows).fill().map(() => Array(cols).fill(0));
                selectedTiles = [];
                hasReachedTarget = false;
                showError('');
                showSuccess('');
                
                $('.grid-square').each(function() {
                    const $tile = $(this);
                    const r = parseInt($tile.data('row')); 
                    const c = parseInt($tile.data('col')); 

                    if (!trial.is_return_path) { 
                        const isAgent = trial.agent_location[1] === r && trial.agent_location[0] === c;
                        const isFridgeAccess = trial.fridge_access_point[1] === r && trial.fridge_access_point[0] === c;
                        
                        if (isAgent || isFridgeAccess) {
                            $tile.css('background-color', 'rgba(0, 255, 0, 0.4)'); 
                        } else if (trial.show_previous_path && 
                            trial.previous_path().some(tile => tile.row === r && tile.col === c)) {
                            $tile.css('background-color', 'rgba(128, 128, 128, 0.3)');
                        } else {
                            $tile.css('background-color', 'transparent');
                        }
                    } else {
                        const isStartTile = trial.start_tile && trial.start_tile[1] === r && trial.start_tile[0] === c;
                        const isTargetTile = trial.target_tile && trial.target_tile[1] === r && trial.target_tile[0] === c;
                        
                        if (isStartTile || isTargetTile) {
                            $tile.css('background-color', 'rgba(0, 255, 0, 0.4)');
                        } else if (trial.show_previous_path && 
                            trial.previous_path().some(tile => tile.row === r && tile.col === c)) {
                            $tile.css('background-color', 'rgba(128, 128, 128, 0.3)');
                        } else {
                            $tile.css('background-color', 'transparent');
                        }
                    }
                });
                showError('');
            });
  
            // Submit button 
            $('#submit-btn').on('click', () => {
                let orderedPath = [];  
                let remainingTiles = [...selectedTiles]; 

                if (!isPathComplete()) {
                    console.log('Path completion check failed.');
                    return;
                }

                if (remainingTiles.length === 0) { 
                    console.log('Submit button: No tiles selected or path is empty after completion check.');
                    return;
                }
                let currentSubmitTile = remainingTiles[0]; 
                orderedPath.push(currentSubmitTile);
                remainingTiles.splice(0, 1);

                while (remainingTiles.length > 0) {
                    let nextTileIndex = remainingTiles.findIndex(tile => 
                        (Math.abs(tile.row - currentSubmitTile.row) === 1 && tile.col === currentSubmitTile.col) ||
                        (Math.abs(tile.col - currentSubmitTile.col) === 1 && tile.row === currentSubmitTile.row)
                    );

                    if (nextTileIndex === -1) break; 

                    currentSubmitTile = remainingTiles[nextTileIndex];
                    orderedPath.push(currentSubmitTile);
                    remainingTiles.splice(nextTileIndex, 1);
                }

                const transformedTiles = selectedTiles.map(tile => { 
                    return {
                        row: tile.col, 
                        col: tile.row
                    };
                });

                if (!isPathComplete()) { 
                    return;
                }

                const trial_data = {
                    trial: trial.trial, 
                    agent_type: trial.agent_type, 
                    selected_path_tiles: transformedTiles, 
                    selected_tiles: selectedTiles, 
                    grid: grid, 
                    trial_type: "marple-path-drawing",
                    is_return_path: trial.is_return_path, 
                };
                
                this.jsPsych.finishTrial(trial_data);
            });
        };

        const checkDataAndSetup = (attempt = 1) => {
            let ready = false;
            if (trial.rooms && Array.isArray(trial.rooms)) {
                if (trial.is_return_path) {
                    // For return paths, we need start_tile and target_tile to be ready.
                    if (trial.start_tile && Array.isArray(trial.start_tile) && trial.start_tile.length === 2 &&
                        trial.target_tile && Array.isArray(trial.target_tile) && trial.target_tile.length === 2) {
                        ready = true;
                    }
                } else {
                    // For forward paths, we need agent_location and fridge_access_point.
                    if (trial.agent_location && Array.isArray(trial.agent_location) && trial.agent_location.length === 2 &&
                        trial.fridge_access_point && Array.isArray(trial.fridge_access_point) && trial.fridge_access_point.length === 2) {
                        ready = true;
                    }
                }
            }

            if (ready) {
                setupGridUI();
            } else if (attempt < 20) { 
                setTimeout(() => checkDataAndSetup(attempt + 1), 50);
            } else {
                console.error("MarplePathDrawing: Timeout waiting for critical trial components.", {
                    is_return_path: trial.is_return_path,
                    rooms_defined_and_array: !!(trial.rooms && Array.isArray(trial.rooms)),
                    start_tile_ok: trial.is_return_path ? !!(trial.start_tile && Array.isArray(trial.start_tile) && trial.start_tile.length === 2) : 'N/A (not a return path)',
                    target_tile_ok: trial.is_return_path ? !!(trial.target_tile && Array.isArray(trial.target_tile) && trial.target_tile.length === 2) : 'N/A (not a return path)',
                    agent_location_ok: !trial.is_return_path ? !!(trial.agent_location && Array.isArray(trial.agent_location) && trial.agent_location.length === 2) : 'N/A (is a return path)',
                    fridge_access_point_ok: !trial.is_return_path ? !!(trial.fridge_access_point && Array.isArray(trial.fridge_access_point) && trial.fridge_access_point.length === 2) : 'N/A (is a return path)',
                    current_trial_object: trial 
                });
                this.jsPsych.finishTrial({
                    error: "Failed to load trial components after timeout. Critical data (e.g., start/target locations for path drawing) might be missing or not loaded in time, possibly from an asynchronous on_start function.",
                    trial_data_at_error: { 
                        is_return_path: trial.is_return_path,
                        rooms_ok: !!(trial.rooms && Array.isArray(trial.rooms)),
                        start_tile_ok: trial.is_return_path ? !!(trial.start_tile && Array.isArray(trial.start_tile) && trial.start_tile.length === 2) : true,
                        target_tile_ok: trial.is_return_path ? !!(trial.target_tile && Array.isArray(trial.target_tile) && trial.target_tile.length === 2) : true,
                        agent_loc_ok: !trial.is_return_path ? !!(trial.agent_location && Array.isArray(trial.agent_location) && trial.agent_location.length === 2) : true,
                        fridge_acc_ok: !trial.is_return_path ? !!(trial.fridge_access_point && Array.isArray(trial.fridge_access_point) && trial.fridge_access_point.length === 2) : true
                    }
                });
            }
        };

        checkDataAndSetup();
      }
    }
 
    MarplePathDrawingGridPlugin.info = info;
    return MarplePathDrawingGridPlugin;
  })(jsPsychModule);
