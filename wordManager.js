var fs = require('fs');

fs.readFile('wordList', function (err, logData) {
	if (err) {
        throw err;
    }
	var text = logData.toString();
	wordList = text.split('\n');
	wordList.splice(wordList.length - 1 , 1);
});

exports.getWord = function() {

    if (typeof wordList === "undefined") {
        // FIXME: Should throw exception instead
        return "NOT";
    }

    return wordList[Math.floor(Math.random() * wordList.length)];
};
