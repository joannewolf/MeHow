var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var tools = require('./tools');

var dbPath = "./data.db";
var dataPath = "./public/data/";

exports.insertMemory = function(req, res){
	var data = req.body, imageURL = "", audioURL = "";
	data.date = tools.dateToString(data.date);
	data.time = tools.timeToString(data.time);

	if (data.imageData) {
		imageURL = dataPath + data.date.year + "-" + data.date.month + "-" + data.date.day + "-" + data.time.hour + "-" + data.time.minute + ".jpg";
		var base64Data = data.imageData.replace(/^data:image\/png;base64,/, "");
		fs.writeFile(imageURL, base64Data, 'base64', function(err) {
			console.log(err);
		});
		imageURL = imageURL.substring(8);
	}

	if (data.audioData) {
		audioURL = dataPath + data.date.year + "-" + data.date.month + "-" + data.date.day + "-" + data.time.hour + "-" + data.time.minute + ".webm";
		var base64Data = String(data.audioData.toString().match(/,(.*)$/)[1]);
		var decodeData = new Buffer(base64Data.toString(), 'base64');
		fs.writeFile(audioURL, decodeData, function (err){
			if (err) return console.log(err);
		});
		audioURL = audioURL.substring(8);
	}

	console.log(data.time);
	console.log(data.date);
	console.log(data.memo);
	console.log(data.emoji);
	console.log(imageURL);
	console.log(audioURL);
	
	var db = new sqlite3.Database(dbPath, function(err){
		if(err) console.log("open DB error");
	});

	var stmt = db.prepare("INSERT INTO memories(hour, minute, day, month, year, emoji, imageURL, audioURL, memo) VALUES(?,?,?,?,?,?,?,?,?)");
	stmt.run(data.time.hour, data.time.minute, data.date.day, data.date.month, data.date.year, data.emoji, imageURL, audioURL, data.memo);
	stmt.finalize();
	db.close();

	res.redirect("/index");
};

exports.deleteMemory = function(req, res){
	console.log(req.body.id);

	var db = new sqlite3.Database(dbPath, function(err){
		if(err) console.log("open DB error");
	});
	// check if image or audio exist, then delete them
	db.each("SELECT * FROM memories WHERE id=(?)", req.body.id, function(err, row) {
        if(err) console.log(err);
		if(row.imageURL)
			fs.unlinkSync("./public" + row.imageURL);
		if(row.audioURL)
			fs.unlinkSync("./public" + row.audioURL);
	});

	db.run("DELETE FROM memories WHERE id=(?)", req.body.id, function(err) {
        if(err) console.log(err);
    });
	db.close();

	res.redirect("/index");
};

exports.updateMemory = function(req, res){
	var data = req.body;
	var oldImagePath = "", newImagePath = "", oldAudioPath = "", newAudioPath = "";
	console.log(req.body.id);
	console.log(req.body.time);
	console.log(req.body.date);
	console.log(req.body.memo);
	console.log(req.body.emoji);
	console.log(req.body.imageData);
	console.log(req.body.audioData);

	var db = new sqlite3.Database(dbPath, function(err){
		if(err) console.log("open DB error");
	});

	var ImagePath = dataPath + data.date.year + "-" + tools.numToString(data.date.month) + "-" + tools.numToString(data.date.day) + "-" + tools.numToString(data.time.hour) + "-" + tools.numToString(data.time.minute) + ".jpg";
	var AudioPath = dataPath + data.date.year + "-" + tools.numToString(data.date.month) + "-" + tools.numToString(data.date.day) + "-" + tools.numToString(data.time.hour) + "-" + tools.numToString(data.time.minute) + ".webm";
	// db.each("SELECT * FROM memories WHERE id=(?)", data.id, function(err, row) {
 //        if(err) console.log(err);
 //        oldImagePath = dataPath + row.year + "-" + tools.numToString(row.month) + "-" + tools.numToString(row.day) + "-" + tools.numToString(row.hour) + "-" + tools.numToString(row.minute) + ".jpg";
	// 	newImagePath = dataPath + data.date.year + "-" + tools.numToString(data.date.month) + "-" + tools.numToString(data.date.day) + "-" + tools.numToString(data.time.hour) + "-" + tools.numToString(data.time.minute) + ".jpg";

	// 	oldAudioPath = dataPath + row.year + "-" + tools.numToString(row.month) + "-" + tools.numToString(row.day) + "-" + tools.numToString(row.hour) + "-" + tools.numToString(row.minute) + ".webm";
	// 	newAudioPath = dataPath + data.date.year + "-" + tools.numToString(data.date.month) + "-" + tools.numToString(data.date.day) + "-" + tools.numToString(data.time.hour) + "-" + tools.numToString(data.time.minute) + ".webm";
	// 	console.log(oldImagePath);
	// 	console.log(newImagePath);
	// 	console.log(oldAudioPath);
	// 	console.log(newAudioPath);

 //        // if time or date change, change the media filename
 //        if (row.year != data.date.year || row.month != data.date.month || row.day != data.date.day || row.hour != data.time.hour || row.minute != data.time.minute) {
 //        	console.log("time different!!!");

 //        	if(row.imageURL) {
	// 			fs.rename(oldImagePath, newImagePath, function (err) {
	// 				if (err) console.log(err);
	// 			});
	// 		}
	// 		if(row.audioURL) {
	// 			fs.rename(oldAudioPath, newAudioPath, function (err) {
	// 				if (err) console.log(err);
	// 			});
	// 		}
 //        }
	// });

	db.run("UPDATE memories SET memo = ? WHERE id = ?", data.memo, data.id);
	db.run("UPDATE memories SET year = ? WHERE id = ?", data.date.year, data.id);
	db.run("UPDATE memories SET month = ? WHERE id = ?", data.date.month, data.id);
	db.run("UPDATE memories SET day = ? WHERE id = ?", data.date.day, data.id);
	db.run("UPDATE memories SET hour = ? WHERE id = ?", data.time.hour, data.id);
	db.run("UPDATE memories SET minute = ? WHERE id = ?", data.time.minute, data.id);
	db.run("UPDATE memories SET emoji = ? WHERE id = ?", data.emoji, data.id);

	if (fs.existsSync(ImagePath) && !data.imageData) {
		console.log("delete exist image");
		fs.unlinkSync(ImagePath);
		db.run("UPDATE memories SET imageURL = ? WHERE id = ?", "", data.id);
	}
	else if (data.imageData.substring(0, 5) != "/data"){
		var base64Data = data.imageData.replace(/^data:image\/png;base64,/, "");
		fs.writeFile(ImagePath, base64Data, 'base64', function(err) {
			console.log(err);
		});
		db.run("UPDATE memories SET imageURL = ? WHERE id = ?", ImagePath.substring(8), data.id);
	}
	// else if (data.imageData)
	// 	db.run("UPDATE memories SET imageURL = ? WHERE id = ?", newImagePath.substring(8), data.id);

	// var audioURL = dataPath + data.date.year + "-" + tools.numToString(data.date.month) + "-" + tools.numToString(data.date.day) + "-" + tools.numToString(data.time.hour) + "-" + tools.numToString(data.time.minute) + ".webm";
	// if (fs.existsSync(audioURL)) {
	// 	if (!data.audioData) {
	// 		fs.unlinkSync(audioURL);
	// 		db.run("UPDATE memories SET audioURL = ? WHERE id = ?", "", data.id);
	// 	}
	// 	else if (data.audioData.substring(0, 5) != "/data"){
	// 		var base64Data = String(data.audioData.toString().match(/,(.*)$/)[1]);
	// 		var decodeData = new Buffer(base64Data.toString(), 'base64');
	// 		fs.writeFile(audioURL, decodeData, function (err){
	// 			if (err) return console.log(err);
	// 		});
	// 		db.run("UPDATE memories SET audioURL = ? WHERE id = ?", newAudioPath.substring(8), data.id);
	// 	}
	// }

	if (fs.existsSync(AudioPath) && !data.audioData) {
		console.log("delete exist audio");
		fs.unlinkSync(AudioPath);
		db.run("UPDATE memories SET audioURL = ? WHERE id = ?", "", data.id);
	}
	else if (data.audioData.substring(0, 5) != "/data"){
		var base64Data = String(data.audioData.toString().match(/,(.*)$/)[1]);
		var decodeData = new Buffer(base64Data.toString(), 'base64');
		fs.writeFile(AudioPath, decodeData, function (err){
			if (err) return console.log(err);
		});
		db.run("UPDATE memories SET audioURL = ? WHERE id = ?", AudioPath.substring(8), data.id);
	}

	db.close();

	// res.redirect("/index");
};