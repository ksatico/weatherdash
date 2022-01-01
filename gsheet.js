/* Get a Google Sheet as JSON using opensheet API
	
	@source: https://benborgers.com/posts/google-sheets-json
	@spreadsheet: https://docs.google.com/spreadsheets/d/1VNvUUIxn2cvwioMEX30uXqll6sT2MD15qG7JkoHFLig/edit

*/	

/* Current Conditions */
fetch('https://opensheet.vercel.app/1VNvUUIxn2cvwioMEX30uXqll6sT2MD15qG7JkoHFLig/Current+Conitions')
	.then(res => res.json())
	.then(data => {
		data.forEach(row => {
			document.getElementById("last_time_updated").innerHTML = `Last time updated at ${row.last_time_updated}`;
			
			document.getElementById("temperature").innerHTML = `${row.temperature}`;
			document.getElementById("feels_like").innerHTML = `feels like ${row.feels_like}`;
			document.getElementById("notification_title").innerHTML = `${row.notification_title}`;
			document.getElementById("symbol").innerHTML = `${row.symbol}`;
			document.getElementById("phrase").innerHTML = `${row.phrase}`;
		})
	});

/* Today's Forecast */
fetch('https://opensheet.vercel.app/1VNvUUIxn2cvwioMEX30uXqll6sT2MD15qG7JkoHFLig/Today')
	.then(res => res.json())
	.then(data => {
		data.forEach(row => {
			document.getElementById("min_max").innerHTML = `${row.high_low_temperature}`;
			document.getElementById("wind").innerHTML = `wind ${row.wind}`; // for Current Conditions
			document.getElementById("wind2").innerHTML = `${row.wind}`;
			document.getElementById("sunrise_sunset").innerHTML = `${row.sunrise_sunset_times}`;
			document.getElementById("humidity").innerHTML = `${row.humidity}`;
		})
	});
	
/* Daily Data */
fetch('https://opensheet.vercel.app/1VNvUUIxn2cvwioMEX30uXqll6sT2MD15qG7JkoHFLig/Daily+Data')
	.then(res => res.json())
	.then(data => {
		data.forEach(row => {
			// Detected active column
			var now = `${row.times_of_day}`;
			if ( now == 'morning' ) {
				document.getElementById("morning_data").className += " text-body";
				document.getElementById("afternoon_data").className += " text-muted";
				document.getElementById("evening_data").className += " text-muted";
				document.getElementById("night_data").className += " text-muted";
			} else if ( now == 'afternoon' ) {
				document.getElementById("morning_data").className += " text-muted";
				document.getElementById("afternoon_data").className += " text-body";
				document.getElementById("evening_data").className += " text-muted";
				document.getElementById("night_data").className += " text-muted";
			} else if ( now == 'evening' ) {
				document.getElementById("morning_data").className += " text-muted";
				document.getElementById("afternoon_data").className += " text-muted";
				document.getElementById("evening_data").className += " text-body";
				document.getElementById("night_data").className += " text-muted";
			} else if ( now == 'night' ) {
				document.getElementById("morning_data").className += " text-muted";
				document.getElementById("afternoon_data").className += " text-muted";
				document.getElementById("evening_data").className += " text-muted";
				document.getElementById("night_data").className += " text-body";
			} else {}
			
			// Morning
			document.getElementById("morning_data").innerHTML = `
				<h3 class="h5 fw-normal">Morning</h3>
				<span class="fs-1">${row.morning_tempterature}</span>
				<span class="fs-1 mb-1">${row.morning_icon}</span>
				<span class="fs-6"><i class="fs-6 fst-normal">🔽</i> ${row.morning_precipitation}</span>
			`;
			// Afternoon
			document.getElementById("afternoon_data").innerHTML = `
				<h3 class="h5 fw-normal">Afternoon</h3>
				<span class="fs-1">${row.afternoon_tempterature}</span>
				<span class="fs-1 mb-1">${row.afternoon_icon}</span>
				<span class="fs-6"><i class="fs-6 fst-normal">🔽</i> ${row.afternoon_precipitation}</span>
			`;
			// Evening
			document.getElementById("evening_data").innerHTML = `
				<h3 class="h5 fw-normal">Evening</h3>
				<span class="fs-1">${row.evening_tempterature}</span>
				<span class="fs-1 mb-1">${row.evening_icon}</span>
				<span class="fs-6"><i class="fs-6 fst-normal">🔽</i> ${row.evening_precipitation}</span>
			`;
			// Overnight
			document.getElementById("night_data").innerHTML = `
				<h3 class="h5 fw-normal">Overnight</h3>
				<span class="fs-1">${row.night_tempterature}</span>
				<span class="fs-1 mb-1">${row.night_icon}</span>
				<span class="fs-6"><i class="fs-6 fst-normal">🔽</i> ${row.night_precipitation}</span>
			`;
		})
	});
	
