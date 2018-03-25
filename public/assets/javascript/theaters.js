$(document).ready(function () {
    console.log("theater page linked")

    // TODO: write addGoogleMaps function

    // Passes data from the index page to populate the serach form on theaters page
    $.ajax({
        url: "/location",
        method: "GET"
    }).then(response => {
        console.log(response)
        $("#zipcode").val(response.zipcode)
        $("#date").val(response.date)
        $("#radius").val(response.radius)
    })

    // Routes data from server request to GraceNote API, displays to the page
    $.ajax({
        url: "/getData",
        method: "GET"
    }).then(response => getMovieData(response));

    // Allows user to resubmit search from theaters display page
    $("#start").on("click", function (event) {
        $.ajax({
            url: "/getData",
            method: "GET"
        }).then((response) => getMovieData(response))
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

        // Call addGoogleMaps function here, passing theaterData

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
            $("#movies").append(jumbotron);
            jumbotron.append("<h3>" + my_theater_name);

            for (var k = 0; k < final_theater_object.movies_with_times.length; k++) {
                console.log(final_theater_object.movies_with_times[k].title);
                jumbotron.append("<h4>" + final_theater_object.movies_with_times[k].title)

                for (var l = 0; l < final_theater_object.movies_with_times[k].showtimes.length; l++) {
                    console.log(final_theater_object.movies_with_times[k].showtimes[l]);
                    jumbotron.append("<p id='showtimes'>" + final_theater_object.movies_with_times[k].showtimes[l]);
                }
            }
        }
    }
})