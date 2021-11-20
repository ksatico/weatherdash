/* Get a Google Sheet as JSON using opensheet API 
	
	@source: https://benborgers.com/posts/google-sheets-json
	@spreadsheet: https://docs.google.com/spreadsheets/d/1VNvUUIxn2cvwioMEX30uXqll6sT2MD15qG7JkoHFLig/edit

*/	

/* Current Conditions */
fetch('https://opensheet.vercel.app/1VNvUUIxn2cvwioMEX30uXqll6sT2MD15qG7JkoHFLig/Current+Conitions')
	.then(res => res.json())
	.then(data => {
		data.forEach(row => {
			// Do something with each row here
			document.getElementById("last_time_updated").innerHTML = `${row.last_time_updated}`;
			
			document.getElementById("temperature").innerHTML = `${row.temperature}`;
			document.getElementById("feels_like").innerHTML = `${row.feels_like}`;
			document.getElementById("rain").innerHTML = `${row.rain}`;
			document.getElementById("symbol").innerHTML = `${row.symbol}`;
			document.getElementById("wind").innerHTML = `${row.wind}`;
			document.getElementById("phrase").innerHTML = `${row.phrase}`;
		})
	});