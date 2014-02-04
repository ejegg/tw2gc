var tw2gc = (function($) {
    
    function init() {
        this.mainDiv = $("<div id='tw2gc' style='top:0;left:0;position:fixed;background-color:#FFF;border:10px solid black'><a id='startLink' href='#'>Loading Google Calendar API...</a></div>");
        this.mainDiv.appendTo($("body"));
        this.venueName = $(".artist-text h1").text();
        var addressElement = $(".artist-text div[itemprop='address']").clone();
        var coords = $("span[itemprop='geo']", addressElement);
        var latitude = $("span[itemprop='latitude']", coords).text();
        var longitude = $("span[itemprop='longitude']", coords).text();
        coords.remove();
        this.address = addressElement.text().replace(/\s+/g, ' ').replace(/^\s*/, '').replace(/\s*$/, '');
        $.getScript("https://apis.google.com/js/client.js?onload=loadCal");
    }
    
    function supports_html5_storage() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
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
            self.listCalendars();
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
                        self.chooseCalendar(calendar.id, calendar.summary, calendar.timeZone);
                    })
                    .appendTo(self.mainDiv);
            });
            self.mainDiv.append("</ul>");
        });
    }
    
    function chooseCalendar(id, name, timeZone) {
        this.selectedCalendarId = id;
        this.timeZone = timeZone;
        $("#tw2gc").html("<p>Selected \"" + name + "\"</p><p>Finding events...</p>");
        var events = $("p.event");
        this.postEvent(events, 0);
    }
    
    function postEvent(events, index) {
        var self = this;
        if (index >= events.length) {
            alert("All done!")
            return;
        }
        var thisEvent = $(events[index]);
        thisEvent.css("border", "3px dashed yellow");
        $("a", thisEvent).each(function(index, link){
            var href = $(link).attr("href");
            if (href.substr(0,4).toLowerCase() !== "http") {
                $(link).attr("href", "http://www.ticketweb.com" + href);
            }
        });
        
        var name = $("span[itemprop='name']", thisEvent).text();
        var startDateElement = $("span[itemprop='startDate']", thisEvent);
        startDate = startDateElement.text().replace(/\s/g, "") + ":00.000";
        
        var startHour = parseInt(startDate.substr(11,2));
        var endHour = startHour + 2;
        var endHourString = endHour + startDate.substr(13);
        if (endHour > 23) {
            endHourString = "23:59:00.000";
        }
        var endDate = startDate.substr(0,11) + endHourString;
        var resource = {
            "summary" : name,
            "start" : {
                "dateTime" : startDate,
                "timeZone" : this.timeZone
            },
            "end" : {
                "dateTime" : endDate,
                "timeZone" : this.timeZone
            },
            "location" : this.venueName + ", " + this.address
        };
        
        this.mainDiv.append("<p>" + name + "</p>")

        var request = gapi.client.calendar.events.insert({
            calendarId: this.selectedCalendarId,
            resource: resource
        });
        request.execute(function(resp) {
            if (resp.error) {    
                console.log(resp);
                thisEvent.css("border", "3px solid red");
            } else {
                thisEvent.css("border", "3px solid green");
            }
            self.postEvent(events, index + 1);
        });
    }
    
    return {
        init: init,
        auth: auth,
        listCalendars: listCalendars,
        chooseCalendar: chooseCalendar,
        postEvent: postEvent
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