var tw2gc = (function($) {
    
    var selectedCalendarId;
    var mainDiv;
    
    function init() {
        this.mainDiv = $("<div id='tw2gc' style='top:0;left:0;position:fixed;background-color:#FFF;border:10px solid black'><a id='startLink' href='#'>Loading Google Calendar API...</a></div>");
        this.mainDiv.appendTo($("body"));
        $.getScript("https://apis.google.com/js/client.js?onload=loadCal");
    }
    function auth() {
        var self = this;
        var config = {
            'client_id': '435870864551.apps.googleusercontent.com',
            'scope': 'https://www.googleapis.com/auth/calendar'
        };
        gapi.auth.authorize(config, function() {
            console.log('login complete');
            console.log(gapi.auth.getToken());
            listCalendars.apply(self);
        });
    }
    function listCalendars() {
        var self = this;
        gapi.client.calendar.calendarList.list().execute(function (calendars) {
            self.mainDiv.html("<h3>Add events to which calendar?</h3><ul>");
            $.each(calendars.items, function(index, calendar) {
                if (calendar.accessRole !== "writer" && calendar.accessRole !== "owner") {
                    return;
                }
                $("<li><a style='cursor:pointer'>" + calendar.summary + "</a></li>")
                    .click(function () {
                        chooseCalendar.apply(self, [calendar.id, calendar.summary]);
                    })
                    .appendTo(self.mainDiv);
            });
            self.mainDiv.append("</ul>");
            
        });
    }
    function chooseCalendar(id, name) {
        this.selectedCalendarId = id;
        $("#tw2gc").html("<p>Selected \"" + name + "\"</p><p>Finding events...</p>");
        findEvents.apply(this);
    }
    function findEvents() {
        var events = $("p.event");
        //events.css("border", "3px solid red");
        postEvent.apply(this, [events, 0]);
    }
    
    function postEvent(events, index) {
	var self = this;
        if (index >= events.length) {
            alert("All done!")
            return;
        }
        var thisEvent = events[index];
        $(thisEvent).css("border", "3px dashed yellow")
        var name = $("span[itemprop='name']", thisEvent).text();
        var startDate = $("span[itemprop='startDate']", thisEvent).text();
        startDate = startDate.replace(/\s/g, "") + ":00.000-05:00";
        var startHour = parseInt(startDate.substr(11,2));
        var endHour = startHour + 2;
        var endHourString = endHour + startDate.substr(13);
        if (endHour > 23) {
            endHourString = "23:59:00.000-05:00";
        }
        var endDate = startDate.substr(0,11) + endHourString;
        var resource = {
            "summary" : name,
            "start" : {
                "dateTime" : startDate
            },
            "end" : {
                "dateTime" : endDate
            }
        }
	this.mainDiv.append("<p>" + name + "</p>")
        //if (confirm("Post event with name '" + name + "', start time '" + startDate + "', end time '" + endDate + "?")) {
            var request = gapi.client.calendar.events.insert({
		calendarId: this.selectedCalendarId,
		resource: resource
            });
            request.execute(function(resp) {
                if (resp.error) {    
                    console.log(resp);
                    $(thisEvent).css("border", "3px solid red")
                } else {
                    $(thisEvent).css("border", "3px solid green")
                }
                postEvent.apply(self, [events, index + 1]);
            });
        //}
    }
    return {
        init: init,
        auth: auth,
        mainDiv: mainDiv,
        selectedCalendarId: selectedCalendarId
    }
})(jQuery);
function loadCal() {
    gapi.client.setApiKey('AIzaSyCkaO1K-vnzYz-Umhev8rjgY39Qp3YXZYE');
    gapi.client.load('calendar', 'v3', function() {
        jQuery("a#startLink")
            .text("Select Calendar")
            .click(function() {
                tw2gc.auth.apply(tw2gc);
            });
    });
}