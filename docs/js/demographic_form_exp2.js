const demographic_form = {
    type: jsPsychSurveyHtmlForm,
    html: '<div style="max-width:700px; text-align:center;">' +
        '<style>.required { color: red; }</style>' +
        '<p>Explain, in 1-2 sentences, what factors contributed to your predictions about which agent took the snack. <span class="required">*</span></p>' +
        '<textarea name="prediction_factors" cols="50" rows="3" required></textarea>' +
        '<p>Do you have any questions or comments regarding the experiment?</p>' +
        '<textarea name="feedback" cols="50" rows="4"></textarea>' +
        '<p>Please provide the following information to complete the study.</p>' +
        '<div style="text-align:center;"> <div style="text-align:left; display:' +
        'inline-block; margin-right:20px; line-height:1.8em;"> <ol>' +
        '<li>Age: <span class="required">*</span></li> <br>' +
        '<li>Gender: <span class="required">*</span></li> <br><br>' +
        '<li>Race: <span class="required">*</span></li> <br><br><br><br><br><br>' +
        '<li>Ethnicity: <span class="required">*</span></li>' +
        '</ol> </div>' +
        '<div style="text-align:left; display: inline-block;' +
        ' line-height:1.8em;">' +
        // age text box
        '<input name="age" type="number" min="18" max="100" required /> <br> <br>' +
        // gender options
        '<input name="gender" type="radio" id="female" value="Female" required /> <label for="female"> Female </label>' +
        '<input name="gender" type="radio" id="male" value="Male" required /> <label for="male"> Male </label>' +
        '<input name="gender" type="radio" id="nonbinary" value="Non-binary" required /> <label for="nonbinary"> Non-binary </label> <br>' +
        '<input name="gender" type="radio" id="other_gender" value="other_gender" required /> <label for="other_gender"> Other: <input' +
        ' type="text" name="other_gender" /> </label> <br><br>' +
        // race options
        '<input name="race" type="radio" id="white" value="White" required /> <label for="white"> White </label> <br>' +
        '<input name="race" type="radio" id="black" value="Black/African American" required /> <label for="black">' +
        ' Black/African American </label> <br>' +
        '<input name="race" type="radio" id="am_ind" value="American Indian/Alaska Native" required /> <label for="am_ind">' +
        ' American Indian/Alaska Native </label> <br>' +
        '<input name="race" type="radio" id="asian" value="Asian" required /> <label for="asian"> Asian </label> <br>' +
        '<input name="race" type="radio" id="pac_isl" value="Native Hawaiian/Pacific Islander" required /> <label for="pac_isl">' +
        ' Native Hawaiian/Pacific Islander </label> <br>' +
        '<input name="race" type="radio" id="other_race" value="other_race" required />' +
        '<label for="other_race"> Other: <input type="text" name="other_race" /> </label> <br><br>' +
        // ethnicity options
        '<input name="ethnicity" type="radio" id="hisp" value="Hispanic" required /> <label for="hisp"> Hispanic </label>' +
        '<input name="ethnicity" type="radio" id="nonhisp" value="Non-Hispanic" required /> <label for="nonhisp"> Non-Hispanic' +
        ' </label>' +
        '</div> </div>' +
        '<p> Please press the finish button to complete the experiment. </p> </div>',
    button_label: 'Finish',
    on_finish: function(data) {
        let response = {};
        response.prediction_factors = data.response.prediction_factors;
        response.feedback = data.response.feedback;
        response.age = parseInt(data.response.age);
        if (data.response.gender == 'other_gender' || typeof data.response.gender == 'undefined') {
            response.gender = data.response.other_gender;
        } else {
            response.gender = data.response.gender;
        }
        if (data.response.race == 'other_race' || typeof data.response.race == 'undefined') {
            response.race = data.response.other_race;
        } else {
            response.race = data.response.race;
        }
        if (typeof data.response.ethnicity == 'undefined') {
            response.ethnicity = '';
        } else {
            response.ethnicity = data.response.ethnicity;
        }
        data.response = response;
    }
};
