//calling google maps function initmap()
var map;
var mapMarkers = [];
window.initMap = function () {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 39.9526, lng: -75.1652 },
        zoom: 11
    });
}

$(document).ready(function () {
    console.log("theater page linked")

    //creating a loading gif to wait for all our data to be received from ajax.  Decided to use setTimeout instead of hiding the loading gif right after ajax completes because we are using two different ajax calls which has the loading gif blink quickly making it look unprofessional/janky.
    $(document).bind("ajaxSend", function(){
        $("#loadingGif").show();
    }).bind("ajaxComplete", function() {
        $("#loadingGif").hide();
    })
    // function loadingGifGone(){
    //     $("#loadingGif").hide();
    // }

    $(document).bind("ajaxSend", function () {
        $("#loadingGif").show();
    }).bind("ajaxComplete", function () {
        $("#loadingGif").hide();
    })

    // TODO: write addGoogleMaps function

    //Need this variable so that I can close all the unwanted infoWindow for maps
    var openInfoWindow;
    // Passes data from the index page to populate the search form on theaters page
    $.ajax({
        url: "/location",
        method: "GET"
    }).then(response => {
        console.log(response)
        $("#zipcode").val(response.zipcode)
        $("#date").val(response.date)
        $("#radius").val(response.radius)
        $("#movie-title").val(response.title)
        $("#movie-theater").val(response.theater)
    })

    // Routes data from server request to GraceNote API, displays to the page
    $.ajax({
        url: "/getData",
        method: "GET"
    }).then(response => getMovieData(response));

    // Handles posting data to server from secondary search form
    $("#resubmit-search").submit(function (event) {
        event.preventDefault();
        $("#movies").empty();

        var $form = $(this),
            zip = $form.find("input[name='zipcode']").val(),
            date = $form.find("input[name='date']").val(),
            radius = $form.find("input[name='radius']").val(),
            title = $form.find("input[name='title']").val(),
            theater = $form.find("input[name='theater']").val(),
            url = $form.attr("action");

        var posting = $.post(url, { zipcode: zip, date: date, radius: radius, title: title, theater: theater });
        posting.done(function (data) {
            getMovieData(data);
        })
    })

    function getMovieData(response) {
        var uniqueTheatreArray = [];
        var displayObject = new Object();
        var theaterData = [];
        var response1 = JSON.parse(response);

        for (var i = 0; i < response1.length; i++) {
            var movieTitles = response1[i].title;

            for (var j = 0; j < response1[i].showtimes.length; j++) {
                var listOfTheatreNames = response1[i].showtimes[j].theatre.name;
                var times = JSON.stringify(response1[i].showtimes[j].dateTime.match(/T.*/)).slice(3, 8);
                var timesFormat = moment(times, "H:mm").format("LT"); // Parse showtime format

                theaterData.push({ theater: listOfTheatreNames, showtime: timesFormat, title: movieTitles });
            }
        }

        for (var key in theaterData) {
            if (displayObject[theaterData[key].names] === undefined && displayObject[theaterData[key].titles] === undefined) {
                displayObject[theaterData[key].names] = theaterData[key].names + theaterData[key].titles;
            }
        }

        var holder = {};
        theaterData.forEach(function (element) {
            var identifier = element.theater;
            if (holder[identifier]) {
                holder[identifier] = element.theater;
            }
            else {
                holder[identifier] = element.theater;
            };
        });

        var theaterData2 = [];
        for (var identifier in holder) {
            theaterData2.push({ theater: holder[identifier] });
        }

        function loopThroughTheaters() {
            for (var i = 0; i < theaterData2.length; i++) {
                parse_data(theaterData2[i].theater, theaterData);
            }
        }

        loopThroughTheaters();

        function parse_data(my_theater_name, theaterData) {
            // Step 1: Build array of just movies/times at this theater
            var array_of_objects_at_my_theater = [];

            for (let i = 0; i < theaterData.length; i++) {
                if (theaterData[i]["theater"] === my_theater_name) {
                    array_of_objects_at_my_theater.push(theaterData[i]);
                }
            }

            // Step 2: Build a list of movie names
            var array_of_movie_names = [];
            for (let i = 0; i < array_of_objects_at_my_theater.length; i++) {
                if (array_of_movie_names.indexOf(array_of_objects_at_my_theater[i].title) < 0) {
                    array_of_movie_names.push(array_of_objects_at_my_theater[i].title);

                }
            }

            // Step 3: Create an array of objects for each movie playing at this theatre 
            var array_of_movies_at_this_theater_with_show_times = [];
            for (let i = 0; i < array_of_movie_names.length; i++) {
                var new_movie_object = {};
                new_movie_object.title = array_of_movie_names[i];
                new_movie_object.showtimes = [];
                array_of_movies_at_this_theater_with_show_times.push(new_movie_object);
            }

            // Step 4: Populate showtimes into that data structure 
            for (let i = 0; i < array_of_objects_at_my_theater.length; i++) {
                // figure out which movie object to put the time in
                for (let j = 0; j < array_of_movies_at_this_theater_with_show_times.length; j++) {
                    if (array_of_objects_at_my_theater[i].title === array_of_movies_at_this_theater_with_show_times[j].title) {
                        array_of_movies_at_this_theater_with_show_times[j].showtimes.push(array_of_objects_at_my_theater[i].showtime);
                    }
                }
            }

            // Step 5: Pack it into its own object why not
            var final_theater_object = {};
            final_theater_object.name = my_theater_name;
            final_theater_object.movies_with_times = array_of_movies_at_this_theater_with_show_times;

            var jumbotron = $("<div class='showtime-listings'>");

            function displayTheaterName() {
                $("#movies").append(jumbotron);
                jumbotron.append("<h3>" + my_theater_name);
            }

            function displayShowtimes() {
                for (var l = 0; l < final_theater_object.movies_with_times[k].showtimes.length; l++) {
                    jumbotron.append("<p id='showtimes'>" + final_theater_object.movies_with_times[k].showtimes[l]);
                }
            }

            // If there is input for movie theater AND movie title
            if ($("#movie-theater").val() === my_theater_name && $("#movie-title").val()) {
                removeMarkers();
                renderMap(my_theater_name);

                displayTheaterName();

                for (var k = 0; k < final_theater_object.movies_with_times.length; k++) {
                    if ($("#movie-title").val() === final_theater_object.movies_with_times[k].title) {
                        jumbotron.append("<h4>" + final_theater_object.movies_with_times[k].title);
                        displayShowtimes();
                    }
                }
            }

            // If there is input for movie theater ONLY
            else if ($("#movie-theater").val() === my_theater_name && !$("#movie-title").val()) {
                removeMarkers();
                renderMap(my_theater_name);

                displayTheaterName();

                for (var k = 0; k < final_theater_object.movies_with_times.length; k++) {
                    jumbotron.append("<h4>" + final_theater_object.movies_with_times[k].title);
                    displayShowtimes();
                }

            }

            // If there is input for movie title ONLY
            else if ($("#movie-title").val() && !$("#movie-theater").val()) {
                for (var k = 0; k < final_theater_object.movies_with_times.length; k++) {

                    if ($("#movie-title").val() === final_theater_object.movies_with_times[k].title) {
                        removeMarkers();
                        renderMap(my_theater_name);
        
                        displayTheaterName();
                        jumbotron.append("<h4>" + final_theater_object.movies_with_times[k].title);
                        displayShowtimes();
                    }

                }
            }

            // If there is no input for movie title OR movie theater
            else if (!$("#movie-title").val() && !$("#movie-theater").val()) {
                displayTheaterName();

                for (var k = 0; k < final_theater_object.movies_with_times.length; k++) {
                    jumbotron.append("<h4>" + final_theater_object.movies_with_times[k].title);
                    displayShowtimes();
                }

                renderMap(my_theater_name);
            }

            // var queryGooglePlaces = 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + myTheaterNameForGooglePlaces + '&key=AIzaSyD9hHd2f2VIqsuz_zHv5m64UXiZgom6sLY'
            //AIzaSyASKnjScxmEcAhuUUchHloDaPz3X3q7KV0
            // Tegan's API Key: AIzaSyC2pDiPtNXvox6k0Cgit7UHEEvGTjnkG8s
            // var queryGooglePlaces = 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + myTheaterNameForGooglePlaces + '&key=AIzaSyC2pDiPtNXvox6k0Cgit7UHEEvGTjnkG8s'

            // var queryGooglePlaces = 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + myTheaterNameForGooglePlaces + '&key=AIzaSyDBkZBVW-dII2-MbnRtJL8Qk99eMR-sjbs'

            // Sam's API Key: AIzaSyAsCHeUDG0zhBRHXHgYQM2dIls9fYXgy-k

            // 530e369a263ef99c35face8a2433c85f51330ca2

            // var queryGooglePlaces = 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=' + myTheaterNameForGooglePlaces + '&key=AIzaSyAsCHeUDG0zhBRHXHgYQM2dIls9fYXgy-k'

<<<<<<< HEAD
                //this will recenter the google maps to the last marker placed
                map.setCenter({ lat: event.results[0].geometry.location.lat, lng: event.results[0].geometry.location.lng });
                //adding infoWindow to display direction icons, address, and theater names
                var contentString = "<h3>" + my_theater_name + "</h3>" + '<button id="directions" style="cursor:pointer;" onClick="window.open(\'https://www.google.com/maps/dir/' + myTheaterNameForGooglePlaces + '\',\'_newtab\');">Directions</button>'
                var infoWindow = new google.maps.InfoWindow({})

                // this will have only one infowindow up at a time.
                google.maps.event.addListener(marker, 'click', (function (marker, contentString, infoWindow) {
                    return function () {

                        if (openInfoWindow){
                            openInfoWindow.close();
                        }
                        infoWindow.setContent(contentString);
                        openInfoWindow = infoWindow;
                        infoWindow.open(map, marker);

                    };
                })(marker, contentString, infoWindow));//using closures
=======
        }

        function removeMarkers(){
            for (var i = 0; i < mapMarkers.length; i++){
                mapMarkers[i].setMap(null);
            }
        }

        function renderMap(theaterName) {
            var myTheaterNameForGooglePlaces = theaterName.replace(/\s/g, "+");

            console.log(myTheaterNameForGooglePlaces);
>>>>>>> 1eba88ea4b17d1f09587941596d32e814dd58b0f

            // Query Google Maps to geocode zipcode 
            var geocoder = new google.maps.Geocoder();
            var zipcode1 = $("#resubmit-search").find("input[name='zipcode']").val()
            console.log(`zipcode1: ${zipcode1}`);
            // var geocodeQueryURL = "http://maps.googleapis.com/maps/api/geocode/json?address=" + zipcode1 + "&key=AIzaSyAsCHeUDG0zhBRHXHgYQM2dIls9fYXgy-k";

            var lat = "";
            var lng = "";
            geocoder.geocode({ 'address': zipcode1 }, function (results, status) {
                console.log("geocoder added");
                console.log(results);
                console.log(status);
                if (status == google.maps.GeocoderStatus.OK) {
                    lat = results[0].geometry.location.lat().toString();
                    lng = results[0].geometry.location.lng().toString();

                    console.log("lat: ", lat);
                    console.log("lng: ", lng);

                    // var queryGooglePlaces = 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=' + myTheaterNameForGooglePlaces + '&location=' + lat + ',' + lng + '&key=AIzaSyAsCHeUDG0zhBRHXHgYQM2dIls9fYXgy-k'
                    var queryGooglePlaces = 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=' + myTheaterNameForGooglePlaces + '&location=' + lat + ',' + lng + '&rankby=distance&key=AIzaSyC2pDiPtNXvox6k0Cgit7UHEEvGTjnkG8s'

                    // 530e369a263ef99c35face8a2433c85f51330ca2

                    $.ajax({
                        url: queryGooglePlaces,
                        type: "GET"
                    }).then(function (event) {
                        console.log(event);

                        // function to place all the markers on our theater locations
                        // Here is probably where we want to get rid of the markers we don't need after a title search
                        theaterMarkers = { lat: event.results[0].geometry.location.lat, lng: event.results[0].geometry.location.lng };
                        var marker = new google.maps.Marker({
                            position: { lat: event.results[0].geometry.location.lat, lng: event.results[0].geometry.location.lng },
                            map: map,
                        })
                        mapMarkers.push(marker);

                        //this will recenter the google maps to the last marker placed
                        map.setCenter({ lat: event.results[0].geometry.location.lat, lng: event.results[0].geometry.location.lng });
                        //adding infoWindow to display direction icons, address, and theater names
                        var contentString = "<h3>" + theaterName + "</h3>" + '<button id="directions" style="cursor:pointer;" onClick="window.open(\'https://www.google.com/maps/dir/' + myTheaterNameForGooglePlaces + '\',\'_newtab\');">Directions</button>'
                        var infoWindow = new google.maps.InfoWindow({})

                        google.maps.event.addListener(marker, 'click', (function (marker, contentString, infoWindow) {
                            return function () {

                                if (openInfoWindow)
                                    openInfoWindow.close();

                                infoWindow.setContent(contentString);
                                openInfoWindow = infoWindow;
                                infoWindow.open(map, marker);

                            };
                        })(marker, contentString, infoWindow));

                    })

                } else {
                    alert("Geocode was not successful for the following reason: " + status);
                }
                //    alert('Latitude: ' + lat + ' Logitude: ' + lng);
            })
        }

    }
})


