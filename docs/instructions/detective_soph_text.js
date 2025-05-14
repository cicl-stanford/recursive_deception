var starter = '<div style="height: 443px; text-align: center;">';
var end_starter = '</div>'

var narrow_div = '<div style="max-width: 600px; margin: 6em auto 2em;"';
var end_narrow_div = '</div>';

// PART 1: Suspect (sophisticated)

var page1 =
    starter +
        '<img src="../instructions/demo_path1.gif" style="margin-top: 2em; width: 360px;"></img>' +
    end_starter +
    '<p>' +
        'In this experiment, you will see people living in apartments like the one above.' +
        '<br>These people love to snack.' +
    '</p>';

var page2 =
    starter +
    '<img src="../instructions/demo_steal_think.png" style="margin-top: 2em; width: 360px;"></img>' +
    end_starter +
    '<p>' +
        'The residents love to snack so much that sometimes they steal their third roommate\'s snacks when the roommate isn\'t home. ' +
    '</p>';

var page3 =
    starter +
        '<img src="../instructions/demo_path2.gif" style="margin-top: 2em; width: 360px;"></img>' +
    end_starter +
    '<p>' +
        'The residents are a little messy and spill crumbs while they\'re walking.' +
    '</p>';

var page4 =
    starter +
        '<img src="../instructions/demo_steal_crumb.png" style="margin-top: 2em; width: 360px;"></img>' +
    end_starter +
    '<p>' +
        'The residents know that their snacking will leave behind evidence, but they don\'t know where. When they steal their roommate\'s snacks, they don\'t want it to be obvious that it was them.' +
    '</p>';

var page5 =
    starter +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/A.png" style="width: 60px; margin-top: 10em;"></img>' +
        '</div>' +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/B.png" style="width: 60px; margin-top: 10em;"></img>' +
        '</div>' +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/C.png" style="width: 60px; margin-top: 10em;"></img>' +
        '</div>' +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/D.png" style="width: 60px; margin-top: 10em;"></img>' +
        '</div>' +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/E.png" style="width: 60px; margin-top: 10em;"></img>' +
        '</div>' +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/F.png" style="width: 60px; margin-top: 10em;"></img>' +
        '</div>' +
    end_starter +
    '<p>' +
        'Your job is to help these people steal the snack without their missing third roommate finding out that it was them.' +
        '<br>You\'ll be shown a number of characters like these, all living in different apartments. ' +
    '</p>';

var page6 =
    starter +
        '<div style="position: relative; width: 360px; margin: 2em auto;">' +
            '<img src="trials/images/snack4_A1.png" style="width: 100%; display: block;"></img>' +
            '<div style="position: absolute; top: 10px; left: -10px; width: 100%; height: calc(100% - 30px);">' +
                '<div style="position: absolute; width: 40px; height: 40px; left: 20%; top: 33.33%; border: 3px solid red; border-radius: 50%;"></div>' +
            '</div>' +
        '</div>' +
    end_starter +
    '<p>' +
        'In each trial, you\'ll be shown a new apartment layout and one of the apartment\'s residents who wants to steal a snack and bring it back to their room.' +
    '</p>';       

var page7 =
    starter +
        '<div style="position: relative; width: 360px; margin: 2em auto;">' +
            '<img src="trials/images/snack4_A1.png" style="width: 100%; display: block;"></img>' +
            '<div class="grid-overlay" style="position: absolute; top: 25px; left: 0; width: 100%; height: calc(100% - 30px);">' +
                '<div class="tile-highlight pulse-highlight" style="position: absolute; width: 6.67%; height: 6.67%; left: 20%; top: 33.33%;"></div>' + // Agent starting position [3,5]
                '<div class="tile-highlight pulse-highlight" style="position: absolute; width: 6.67%; height: 6.67%; left: 46.67%; top: 86.67%;"></div>' + // Fridge access point [7,13]
            '</div>' +
        '</div>' +
    end_starter + 
    '<p>' +
        'The green squares above highlight the resident\'s current location in the apartment and the spot where they can open the fridge to steal the snack.' + 
    '</p>';

var page8 =
    starter +
        '<img src="../instructions/draw-path-demo.gif" style="margin-top: 2em; margin-bottom: 2em; width: 800px; display: block;"></img>' +
    end_starter +
    '<p>' +
        'For the first part of each trial, your task will be to draw a path from the resident to the highlighted location by the fridge.' +
        '<br>You can do this by clicking on the squares one after the other.' +
    '</p>';
    
var page9 = 
    starter +
        '<img src="../instructions/no-walls-demo.gif" style="margin-top: 2em; margin-bottom: 2em; width: 800px; display: block;"></img>' +
    end_starter +
    '<p>' +
        'Just like in the real world, you won\'t be able to move through furniture or walls.' +
    '</p>';

var page10 =
    starter +
        '<img src="../instructions/clear-path-demo.gif" style="margin-top: 2em; margin-bottom: 2em; width: 800px; display: block;"></img>' +
    end_starter +
    '<p>' +
        "To de-select a tile, click on it again." + 
        "<br>You can also click on the <em>Clear</em> button to clear your path and restart." +
    '</p>';

var page11 =
    starter +
        '<img src="../instructions/submit-path-demo.gif" style="margin-top: 2em; margin-bottom: 2em; width: 800px; display: block;"></img>' +
    end_starter +
    '<p>' +
        'Once your path to the fridge is complete, press the <em>Submit</em> button to lock it in.' +
        '<br>On the next page, we\'ll do an example.' +
    '</p>';


// PART 2: Detective (sophisticated)

var page12 =
    starter +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/A.png" style="width: 60px; margin-top: 15em;"></img>' +
        '</div>' +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/B.png" style="width: 60px; margin-top: 15em;"></img>' +
        '</div>' +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/C.png" style="width: 60px; margin-top: 15em;"></img>' +
        '</div>' +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/D.png" style="width: 60px; margin-top: 15em;"></img>' +
        '</div>' +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/E.png" style="width: 60px; margin-top: 15em;"></img>' +
        '</div>' +
        '<div style="width: 16.5%; float:left;">' +
            '<img src="../instructions/agents/F.png" style="width: 60px; margin-top: 15em;"></img>' +
        '</div>' +
    end_starter +
    '<p>' +
        'Nice work!' +
    '</p>' + 
    '<p>' +
        'Let\'s switch gears.' +
    '</p>' + 
    '<p>' +
        'Now, your job will be to act like a detective and figure out which resident in the apartment stole a snack.' +
    '</p>';

        
var page13 =
    starter +
        '<div style="width: 100%; height: 420px;">' +
            '<img src="trials/images/example.png" style="margin-top: 2em; width: 360px;"></img>' +
        '</div>' +
    end_starter +
    '<p>' +
        'You\'ll be shown an image of the apartment after one of the residents stole a snack.' +
        '<br>Look! They dropped some crumbs on the way back to their room.' +
        '<br>Like before, the green square highlights the spot where the resident opened the fridge and stole the snack.' +
    '</p>'; 

var page14 =
    starter +
    '<div style="width: 100%; padding-top:8em;">' +
        '<div style="width: 20%; margin-left: 20%; float:left;">' +
            '<img src="../instructions/agents/A.png" style="width: 60px;"></img>' +
        '</div>' +
        '<div style="width:20%; height:7em; float:left; line-height:150px;">OR</div>' +
        '<div style="width: 20%; margin-right: 20%; float:left;">' +
            '<img src="../instructions/agents/D.png" style="width: 60px;"></img>' +
        '</div>' +
    '</div>' +
    end_starter +
    '<p>' +
        'Your job is to figure out who stole the snack from the fridge.' +
    '</p>';

var page15 =
    starter +
        '<div style="width: 100%; padding-top:8em;">' +
            '<div style="width: 20%; margin-left: 20%; float:left;">' +
                '<img src="../instructions/agents/A.png" style="width: 60px;"></img>' +
            '</div>' +
            '<div style="width:20%; height:7em; float:left; line-height:150px;">OR</div>' +
            '<div style="width: 20%; margin-right: 20%; float:left;">' +
                '<img src="../instructions/agents/D.png" style="width: 60px;"></img>' +
            '</div>' +
            '<div style="width: 100%; margin-top: 2em;">' +
                '<img src="../instructions/demo_slider.png" style="width: 100%;"></img>' +
            '</div>' +
        '</div>' +
    end_starter +
    '<p>' +
        'Use the slider to indicate how strongly you think it was one resident versus the other. Once you\'ve submitted your answer, you will not be able to go back.' +
        "<br>Let's practice." +
    '</p>';


var instruction_pages_suspect = [
    page1,
    page2,
    page3,
    page4,
    page5,
    page6,
    page7,
    page8,
    page9,
    page10,
    page11
];

var instruction_pages_detective = [
    page12,
    page13,
    page14,
    page15
];


for (var i = 0; i < instruction_pages_suspect.length; i++) {
    instruction_pages_suspect[i] = '<div style="width: 700px; min-width: 300px; margin:' +
        'auto 5em;">' + instruction_pages_suspect[i] + '</div>';
}

for (var i = 0; i < instruction_pages_detective.length; i++) {
    instruction_pages_detective[i] = '<div style="width: 700px; min-width: 300px; margin:' +
        'auto 5em;">' + instruction_pages_detective[i] + '</div>';
}

var instructions_last_page_suspect =
    narrow_div +
        '<p>' +
            'Nice job! Before we get started, let\'s make sure these instructions were clear.' + 
        '</p>' +
        '<p>' +
            'On the next page, there are several questions about the task.' +
            '<br>Please answer them carefully. You will not be able to proceed to the experiment until you have answered them all correctly.' +
        '</p>' +
    end_narrow_div;

var instructions_last_page_detective =
    narrow_div +
        '<p>' +
            "In this experiment, you'll be asked to figure out who stole the snack in a range of apartments like the one you just saw." +
            "<br>Put on your sleuthing hat and let's get started!" +
        '</p>' +
        '<p>' +
            "On the next page, there are several questions about the instructions. " +
            '</br>Please answer them carefully. You will not be able to proceed until you have answered them all correctly.' +
        '</p>' +
    end_narrow_div;


var comprehension_suspect1 =
    '<p>' +
        "In every trial, you will be asked to (1) draw a path from the resident's starting location to the fridge, and " +
        "(2) draw a path from the fridge back to the resident's starting location."
    '</p>';
var options_suspect1 = ['True', 'False']

var comprehension_suspect2 =
    '<p>' +
        "If the resident is careful, there won't be any evidence left behind from the stolen snack."
    '</p>';
var options_suspect2 = ['True', 'False'];

var comprehension_suspect3 =
    '<p>' +
        'The residents know exactly where they leave crumbs on their way back.'
    '</p>';
var options_suspect3 = ['True', 'False']


var comprehension_detective1 =
    '<p>' +
        'In every trial, you will be asked which one of two people stole a snack from the fridge.'
    '</p>';
var options_detective1 = ['True', 'False']

var comprehension_detective2 =
    '<p>' +
        'In every trial, you will be shown what the apartment looked like after someone stole a snack.'
    '</p>';
var options_detective2 = ['True', 'False']

var comprehension_detective3 =
    '<p>' +
        'The residents are not worried about getting caught stealing the snacks.'
    '</p>';
var options_detective3 = ['True', 'False'];


var start_prompt_suspect =
    narrow_div +
        '<p>' +
            'Correct! On the next page, the experiment will begin.' +
        '</p>' +
        '<p>' +
            'Please do not refresh the page or you may not be credited correctly.' +
        '</p>' +
        '<p>' +
            "Click the <em>Start</em> button whenever you're ready." +
        '</p>' +
    end_narrow_div;

var start_prompt_detective =
    narrow_div +
        '<p>' +
            'Correct! On the next page, the experiment will begin.' +
        '</p>' +
        '<p>' +
            'Please do not refresh the page or you may not be credited correctly.' +
        '</p>' +
        '<p>' +
            "Click the <em>Start</em> button whenever you're ready." +
        '</p>' +
    end_narrow_div;

var preload_images = [
        '../instructions/agents/A.png',
        '../instructions/agents/B.png',
        '../instructions/agents/C.png',
        '../instructions/agents/D.png',
        '../instructions/agents/E.png',
        '../instructions/agents/F.png',
        '../instructions/demo_path1.gif',
        '../instructions/demo_path2.gif',
        '../instructions/demo_before.png',
        '../instructions/demo_after.png',
        '../instructions/demo_slider.png',
        '../instructions/draw-path-demo.gif',
        '../instructions/no-walls-demo.gif',
        '../instructions/clear-path-demo.gif',
        '../instructions/submit-path-demo.gif',
        '../instructions/demo_steal_think.png',
        '../instructions/demo_steal_crumb.png',
        'trials/images/example_2.png',
        'trials/images/snack4_A1.png',
        'trials/images/snack4_A2.png',
        'trials/images/snack2_B1.png',
        'trials/images/snack2_B2.png',
        'trials/images/snack3_A1.png',
        'trials/images/snack3_A2.png',
        'trials/images/snack9_A1.png',
        'trials/images/snack9_A2.png'
];
