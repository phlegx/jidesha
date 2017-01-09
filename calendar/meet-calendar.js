var meetingId = "";
var BASE_URL = "https://meet.jit.si/";
var APP_NAME = "Jitsi";
// Numbers used to access the service, will be listed in the autogenerated
// description of the event when adding a meeting to an event.
var NUMBERS = [];
var generateRoomNameAsDigits = false;

/**
 * Checks for the button on current page
 */
function isButtonPresent() {
    return ($('#jitsi_button').length >= 1);
}

/**
 * Checks if there is meetingId, if not generate it, otherwise return it.
 * @returns {string} the meeting id to use.
 */
function getMeetingId() {
    var meetingId = "";
    var inviteText = $('[id*=location].ep-dp-input input').val();

    var ix = inviteText.indexOf(BASE_URL);
    var url;
    if (ix != -1 && (url = inviteText.substring(ix)) && url.length > 0) {
        meetingId = url.substring(BASE_URL.length);

        // there can be ',' after the meeting, normally added when adding
        // physical rooms to the meeting
        var regexp = /([a-zA-Z]+).*/g;
        var match = regexp.exec(meetingId);
        if (match && match.length > 1)
            meetingId = match[1];
    }
    else {
        if (generateRoomNameAsDigits) {
            meetingId = randomDigitString(10);
        }
        else
            meetingId = generateRoomWithoutSeparator();
    }

    return meetingId;
}

/**
 * Returns the node id.
 */
function getNodeID(name) {
    var inputNodePrefix = '';
    var labelNode = $("[id*='location-label']");
    if (labelNode.length >= 1) {
        inputNodePrefix = labelNode[0].id.split('.')[0];
    }
    return '#\\' + inputNodePrefix + '\\.' + name;
}

/**
 * Returns an event object that can be used to be simulated
 */
function getKeyboardEvent(event) {
    var keyboardEvent = document.createEvent('KeyboardEvent');
    var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ?
        'initKeyboardEvent' : 'initKeyEvent';
    keyboardEvent[initMethod](
        event // event type (keydown, keyup, or keypress)
        , true // bubbles
        , true // cancel-able
        , window // viewArg (window)
        , false // ctrlKeyArg
        , false // altKeyArg
        , false // shiftKeyArg
        , false // metaKeyArg
        , 32 // keyCodeArg
        , 0 // charCodeArg
    );

    return keyboardEvent;
}

/**
 * Generates description text used for the invite.
 * @returns {String}
 */
function getInviteText() {
    var inviteText =
        "Click the following link to join the meeting from your computer: "
        + BASE_URL + meetingId;

    if (NUMBERS.length > 0) {
        inviteText += "\n\n=====";
        inviteText +="\n\nJust want to dial in on your phone? ";
        inviteText += " \n\nCall one of the following numbers: ";
        NUMBERS.forEach(function (num) {
            inviteText += "\n" + num;
        });
        inviteText += "\n\nSay your conference name: '" + meetingId
            + "' and you will be connected!";
    }

    return inviteText;
}

/**
 * Updates the url for the button.
 */
function updateButtonURL() {
    try {
        var container = $(getNodeID('rtc'));
        container.find('div.ui-sch').addClass('hangouts_button');

        $('#jitsi_button').addClass('join');
        var button = $('#jitsi_button a');
        button.html("Join " + meetingId + " now");
        button.off('click');
        button.attr('href', BASE_URL + meetingId);
        button.attr('target', '_new');
        button.attr('style', '{color:blue}');
    } catch (e) {
        console.log(e);
    }
}

/**
 * Updates event and the button state based on whether the user had already
 * clicked the jitsi button and there is a change in the location and in the
 * description of the event.
 * @param description the description element.
 */
function updateEvent(description) {

    var descriptionContainsURL = false;
    var isDescriptionUpdated = false;

    if (description != undefined) {
        // checks whether there is an url in the description
        descriptionContainsURL =
            (description.value.length >= 1
                && description.value.indexOf(BASE_URL) !== -1);
        isDescriptionUpdated =
            descriptionContainsURL ||
            // checks whether there is the generated name in the location input
            ($('[id*=location].ep-dp-input input').val()
                .indexOf(APP_NAME + ' Video Conference') != -1)
    }

    if(isDescriptionUpdated) {
        updateButtonURL();
    } else {
        var button = $('#jitsi_button a');
        button.html('Add a ' + APP_NAME + ' Meeting');
        button.attr('href', '#');
        button.on('click', function(e) {
            e.preventDefault();
            $(getNodeID('rtc'))
                .find('div.ui-sch').addClass('hangouts_button');

            if (!isDescriptionUpdated) {
                // Build the invitation content
                description.dispatchEvent(getKeyboardEvent('keydown'));
                description.value = description.value + getInviteText();
                description.dispatchEvent(getKeyboardEvent('input'));
                description.dispatchEvent(getKeyboardEvent('keyup'));
                var changeEvt1 = document.createEvent("HTMLEvents");
                changeEvt1.initEvent('change', false, true);
                description.dispatchEvent(changeEvt1);
                updateButtonURL();

                // Set the location if there is content
                var locationNode = $(getNodeID('location input'))[0];
                if (locationNode) {
                    var locationText =
                        APP_NAME + ' Conference - '
                            + $('#jitsi_button a').attr('href');
                    locationNode.dispatchEvent(getKeyboardEvent('keydown'));
                    locationNode.value = locationNode.value == '' ?
                        locationText : locationNode.value + ', ' + locationText;
                    locationNode.dispatchEvent(getKeyboardEvent('input'));
                    locationNode.dispatchEvent(getKeyboardEvent('keyup'));
                    var changeEvt2 = document.createEvent("HTMLEvents");
                    changeEvt2.initEvent('change', false, true);
                    locationNode.dispatchEvent(changeEvt2);
                }
            }
            updateEvent(description);
        });
    }
}

/**
 * Adds the button that will add description and url.
 */
function addsJitsiButton() {
    var container = $(getNodeID('rtc'));
    if(container.length == 0)
        return;

    var description = $(getNodeID('descript textarea'))[0];
    var descriptionRow = $(getNodeID('descript-row'));

    if (descriptionRow.find('textarea').length === 0)
        return;

    container.addClass('button_container');

    if(isButtonPresent()) {
        updateEvent(description);
    } else {
        container.find('div.ui-sch').addClass('hangouts_button');
        container.append('<div id="jitsi_button"><a href="#" style="color: white"></a></div>');
        updateEvent(description);
    }

    var rtcRow = $(getNodeID('rtc-row'));
    if(rtcRow.is(':visible') == false && description.length != 0) {
        rtcRow.show();
        container.addClass('solo');
    }
}

/**
 * Checks whether it is ok to add the button to current page and add it.
 */
function checkAndUpdateCalendar() {
    var MutationObserver
        = window.MutationObserver || window.WebKitMutationObserver;
    var eventEditPage = document.querySelector('#maincell #coverinner');
    if (eventEditPage) {
        new MutationObserver(function(mutations) {
            try {
                mutations.every(function() {
                    if ($('table.ep-dp-dt').is(":visible")) {
                        meetingId = getMeetingId();
                        if(!isButtonPresent())
                            addsJitsiButton();
                        return false;
                    }
                    return true;
                });
            } catch(e) {
                console.log(e);
            }
        }).observe(eventEditPage, {
            childList: true, attributes: true, characterData: false });
    }
}

checkAndUpdateCalendar();
