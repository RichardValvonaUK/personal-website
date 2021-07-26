var TextInserter = function(textToModify, selectionStart, selectionEnd, textToInsert) {
	//var cursorPos = $(this)[0].selectionStart;
	//var textBefore = $(this).val();
	//var charBeforeCursor = cursorPos == 0 ? "" : textBefore.substring(cursorPos-1, cursorPos);


	var textToInsertLength = textToInsert.length;

	var newTextStart = textToModify.substring(0, selectionStart);
	var newTextFinish = textToModify.substring(selectionEnd);

	var cursorPos = selectionStart;
	var modified = false;

	for (var i=0; i<textToInsertLength; i++) {

		var c = textToInsert.substring(i, i+1);
		var cLower = c.toLowerCase();

		// An English letter or apostrophy was entered
		if (charsToWatch.has(cLower)) {
			var startLength = newTextStart.length;
			var numberOfPrevCharsToReplace = 0;
			var prevChar = startLength == 0 ? null : newTextStart.substring(newTextStart.length-1, newTextStart.length);
			var prevCharLower = prevChar == null ? prevChar : prevChar.toLowerCase();

			var convLookupKey;

			if (prevCharLower == null) {
				convLookupKey = cLower;
			}
			else if (prevCharLower == ".") {
				numberOfPrevCharsToReplace = 1;
				convLookupKey = cLower;
			}
			else {
				convLookupKey = prevCharLower + cLower;

				if (cyrillicConversions[convLookupKey]) {
					numberOfPrevCharsToReplace = 1;
				}
				else {
					numberOfPrevCharsToReplace = 0;
					convLookupKey = cLower;
				}
			}

			if (cyrillicConversions[convLookupKey]) {
				var n = cyrillicConversions[convLookupKey]; // Cyrillic text to add

				// If an uppercase character was entered then add an uppercase letter to the end
				if (c != cLower || (prevChar != prevCharLower && numberOfPrevCharsToReplace > 0)) {
					n = n.toUpperCase();
				}

				cursorPos = cursorPos + n.length - numberOfPrevCharsToReplace;
				newTextStart = newTextStart.substring(0, newTextStart.length-numberOfPrevCharsToReplace) + n;
				modified = true;
			}
		}
		// Another character was entered
		else {
			cursorPos++;
			newTextStart += c;
			modified = true;
		}
	}

	this.isModified = modified;
	this.finalText = newTextStart + newTextFinish;
	this.finalCursorPos = cursorPos;
};


var insertText = function(textBox, s) {
	var sStart = textBox[0].selectionStart;
	var sEnd = textBox[0].selectionEnd;

	var textBefore = textBox.val();

	var tInserter = new TextInserter(textBox.val(), sStart, sEnd, s);

	if (tInserter.isModified) {
		textBox.val(tInserter.finalText);
		textBox[0].setSelectionRange(tInserter.finalCursorPos, tInserter.finalCursorPos);
		return true;
	}

	return false;
};

var searchTextType = function(textBox, e, isPaste) {

	if ((event.keyCode >= 65 && event.keyCode <= 90) || (event.keyCode >= 97 && event.keyCode <= 122) || event.keyCode == 39 || isPaste ) {
		e.preventDefault();
		var c = isPaste ? window.event.clipboardData.getData("text") : String.fromCharCode(event.keyCode);

		return insertText(textBox, c);
	}

	return false;
};

$('input[type=radio][name=searchTextOption]').on('change', function() {
	var radioValue = $("input[type=radio][name=searchTextOption]:checked"). val();

	if (radioValue == "russian") {
		$("#searchTextRussian").removeClass("hidden");
		$("#searchTextEnglish").addClass("hidden");
	}
	else if (radioValue == "english") {
		$("#searchTextRussian").addClass("hidden");
		$("#searchTextEnglish").removeClass("hidden");
	}

	doSearch();
});

$( "#searchTextEnglish" ).on('input', function(e){
	doSearch();
});

$( "#searchTextRussian" ).on('keypress', function(e) {
	searchTextType($(this), e, false);
	doSearch();
});

$( "#searchTextRussian" ).on('input', function(e){
	searchTextType($(this), e, false);
	doSearch();
});

$( "#searchTextRussian" ).on('change', function(e){
	searchTextType($(this), e, false);
	doSearch();
});

$( "#searchTextRussian" ).on('paste', function(e){
	searchTextType($(this), e, true);
	doSearch();
});




$("body").addClass("no-refresh-scroll");


$( "#transliteration" ).mousedown(function(e){
	//e.preventDefault();
});

$( "#transliteration .key-to-press" ).click(function(e){
	insertText($("#searchTextRussian"), $(this).text());
});

$( "#variantsCheckBox" ).change(function() {
	doSearch();
});

$("#searchButton").click(function(){


	/*
	$.ajax({url: "demo_test.txt", success: function(result){
		$("#div1").html(result);
	}});
	*/
});

$("#randomButton").on('click', function(e) {
	setSearchWordFromId("random");
});

$(document).ready(function() {
	//enableButtons("#nounTable");
	//enableButtons("#adjectiveTable");
	//enableButtons("#verbTable");
});

$(document).keyup(function(e) {
	if (e.keyCode === 27) {
		$('.closable-window').addClass("hidden");
	}
});
