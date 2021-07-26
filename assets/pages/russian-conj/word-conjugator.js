var buttonSelected = function(button, currentlySelected) {

	var successful = false;
	
	successful |= detectNounButtons(button, currentlySelected);
	successful |= detectAdjectiveButtons(button, currentlySelected);
	
	return successful;
};

var mergeStressMarks = function(spelling, stressPositions) {
	var stressPositionsSplit = stressPositions.split(",");

	var newSpelling = "";

	if (stressPositions == "") {
		newSpelling = spelling;
	}
	else {
		for (var i=0; i<stressPositionsSplit.length; i++) {
			var lastStressPos = i==0 ? 0 : stressPositionsSplit[i-1];
			var nextStressPos = stressPositionsSplit[i];
			newSpelling += spelling.slice(lastStressPos, nextStressPos) + "&#769;" + (i+1 == stressPositionsSplit.length ? spelling.substring(nextStressPos) : "");
		}
	}

	return newSpelling;
};

var getAspectWord = function(aspect) {
	switch(aspect) {
		case 'i' : return "im";
		case 'p' : return "pf";
		case 'b' : return "im/pf";
		default: return "";
	}
};

var setResults = function(results) {

	var resultObj = $.parseJSON(results);

	var data = resultObj == null ? [] : resultObj.data;

	if (data.length > 0) {

		var resultsDisplay = $("#resultsList");

		$("#resultsList tbody.result-group").remove();

		var usedWordIds = {};
		var prevWordId = null;

		var currentDivElement = null;
		var divElements = new Object();

		var wordsToRowClasses = new Array();
		var wordsToCases = new Array();

		if (data.length == 0) {
			$("#resultsList .title").html("No results found");
		}
		else {
			$("#resultsList .title").html("Results");
		}
		
		for (var i=0; i<data.length; i++) {
			var currentResult = data[i];
			var currentWordId = currentResult['word_id'];
			var nextWordId = i==data.length-1 ? null : data[i+1]['word_id'];

			var isNewWordId = false;

			// Is the first item of a word group
			if (prevWordId != currentWordId) {
		
				// Same word id has appeared before then use that word group.
				if (divElements[currentWordId]) {
					currentDivElement = divElements[currentWordId];
				}
				// Otherwise, create a new word group.
				else {
					isNewWordId = true;
					currentDivElement = $("<tbody class='result-group'/>");
					divElements[currentWordId] = currentDivElement;
					resultsDisplay.append(currentDivElement);

					if (currentResult["type"] == "verb") {
						var verbIDsToUse = currentResult["v_partner_id"] == null ? currentWordId : "" + currentWordId + "," + currentResult["v_partner_id"].split("|").join(",");
					
						$(currentDivElement).on('click', {'verbIDsToUse': verbIDsToUse, 'resultEntryToShowOnly': currentResultDisplayTop}, function(e) {
							showResultFromId(e.data.verbIDsToUse);
						});
					}
					else {
						$(currentDivElement).on('click', {'nextId': currentWordId, 'resultEntryToShowOnly': currentResultDisplayTop}, function(e) {
							showResultFromId(e.data.nextId);
						});
					}
				}
			}
		
			// The current row information is hebuttonSelectedre.

			var currentResultDisplay = $("#resultsListTemplate .result-entry").clone();

			// Remove the last column when it's not the first word-form in a word-block
			if (isNewWordId) {
				currentResultDisplay.children("td").addClass("top-border-only");
			
				var desc = "";
			
				// For verbs, their partners are also included within the resultsss
				if (currentResult["type"] == "verb") {
					var verbSpellings = currentResult["v_partner_spelling"] == null ? new Array() : currentResult["v_partner_spelling"].split("|");
					var stressPoses = currentResult["v_partner_stress_pos"] == null ? new Array() : currentResult["v_partner_stress_pos"].split("|");
					var aspects = currentResult["v_partner_aspect"] == null ? new Array() : currentResult["v_partner_aspect"].split("|");
				
					verbSpellings.push(currentResult["dict_form_spelling"]);
					stressPoses.push(currentResult["dict_form_stress_pos"]);
					aspects.push(currentResult["aspect"]);
				
					for (var aspectCounter=0; aspectCounter<3; aspectCounter++) {
						for (var pI=0; pI<verbSpellings.length; pI++) {
							if ((aspectCounter === 0 && aspects[pI] === "b") || (aspectCounter === 1 && aspects[pI] === "i")
								|| (aspectCounter === 2 && aspects[pI] === "p")) {
								if (desc !== "") {
									desc += " / ";
								}
								desc += "<b>" + mergeStressMarks(verbSpellings[pI], stressPoses[pI]) + "</b> <i>" + getAspectWord(aspects[pI]) + "</i>";
							}
						}
					}
				}
				else {
					desc += "<b>" + mergeStressMarks(currentResult["dict_form_spelling"], currentResult["dict_form_stress_pos"]) + "</b>";
				}
			
				desc += " (<i>" + currentResult["type"] + "</i>)";
				desc += "<br/><br/>";
				desc += processEnglishDesc(currentResult["english_words"]);

				currentResultDisplay.find(".desc").html(desc);
			}
			else {
				currentResultDisplay.find(".desc").remove();
			}
		
			var currentWordStressPos = currentResult["stress_pos"];

			var currentWord = mergeStressMarks(currentResult.spelling, currentWordStressPos);

			var rowClassIdentifierValue = "row-index-" + i;
			var rowClassIdentifierKey = currentWordId + "-" + currentResult.spelling;

			// If this word already exists, add case for this word and add to this row later.
			if (wordsToCases[rowClassIdentifierKey]) {
				wordsToCases[rowClassIdentifierKey] += ", " + decClasses[currentResult["dec_class"]];
			}
			// Otherwise, add row now.
			else {
				wordsToCases[rowClassIdentifierKey] = decClasses[currentResult["dec_class"]];
				wordsToRowClasses[rowClassIdentifierKey] = rowClassIdentifierValue;

				currentResultDisplay.find(".word").html(currentWord);
			
				currentResultDisplay.addClass(rowClassIdentifierValue);
				currentDivElement.append(currentResultDisplay);
			}
		
			// Is the last item of a word group and that 
			if (nextWordId != currentWordId && !divElements[currentWordId]) {
				var currentResultDisplayTop = $("#resultsListTemplate .result-entry").clone();
				currentResultDisplayTop.children("td").addClass("bottom-border-only");
				//currentResultDisplayTop.find(".desc").html(processEnglishDesc(currentResult["english_words"]) + "<br/>");
				currentDivElement.append(currentResultDisplayTop);
			}

			prevWordId = currentWordId;
		};
	
		if (resultObj.searchbyenglishwords) {
		
			$(".english-word-entry").each(function(index) {
				var values = $(this).attr("value").split('-').join(' ').split('|').join(' ').split(' ');
				for (var i=0; i<values.length; i++) {
					$(this).addClass("value-" + values[i].toLowerCase());
				}
			});
		
			$(".english-word-entry").css("font-weight","bold");
			
			var eWords = resultObj.searchbyenglishwords;
			for (var i=0; i<eWords.length; i++) {
				$(".english-word-entry.value-" + eWords[i]).css("color", "red").css("text-decoration","underline");
			}
		}
		else {
			$(".english-word-entry").css("font-weight","bold");
		}
	
		/*
	, data.searchbyenglishwords
	english-word-entry
	*/
	
		// Each word-block needs the end column to span across all of its rows.
		$("#resultsList tbody.result-group").each(function(i) {
			$(this).find(".desc").attr("rowspan", $(this).find(".result-entry").length + 1);
		});
	}
};

var showResultFromId = function(idToSelect) {

	$.ajax({ type: 'GET', url: '/ajax/russian-lab/search-word', data: {'searchbyid': idToSelect} }).done(function(result) {
		displayResult($.parseJSON(result));
	});
};


var setSearchWordFromId = function(idToSelect) {

	$.ajax({ type: 'GET', url: '/ajax/russian-lab/search-word', data: {'searchbyid': idToSelect} }).done(function(result) {
		var resultData = $.parseJSON(result).data[0];
		$("#searchTextRussian").val(resultData[0]['spelling']);
		doSearch();
	});
};

var displayResult = function(result) {
	var data = result.data[0];

	if (data.length > 0) {

		var firstRow = data[0];

		var wordType = firstRow.type;

		var tableId;
		var tableIdTemplate;

		if (wordType == "verb") {
			displayVerbResult(result);
		}
		else if (wordType == "noun") {
			displayNounResult(result);
		}
		else if (wordType == "adjective") {
			displayAdjectiveResult(result);
		}

	}

};

var processEnglishDesc = function(desc) {
	var newDesc = desc.trim();

	if (newDesc == "") return "";

	var newLineCounter = 0;

	if (newDesc.startsWith("~~")) {
		newLineCounter++;
		newDesc = newDesc.replace("~~", newLineCounter + ". ");
	}
	else {
		newLineCounter++;
		newDesc = newLineCounter + ". " + newDesc;
	}

	while (newDesc.indexOf("~~") !== -1) {
		newLineCounter++;
		newDesc = newDesc.replace("~~", "<br/>" + newLineCounter + ". ");
		if (newLineCounter == 30) break;
	}

	var regSquareBrackets = /\[\[([^\]]+)\]\]/g;
	
	newDesc = newDesc.replace(regSquareBrackets, "<span class=\"english-word-entry\" value=\"$1\">$1</span>");

	return newDesc;
};

var doSearch = function() {
	
	var searchTextOptionSelected = $("input[name = \"searchTextOption\"]:checked").val();
	
	if (searchTextOptionSelected == "russian") {
		$.ajax({ type: 'GET', url: '/ajax/russian-lab/search-word', data: {'searchword': $('#searchTextRussian').val()} }).done(function(result) {
			setResults(result);
		});
	}
	else if (searchTextOptionSelected == "english") {
		$.ajax({ type: 'GET', url: '/ajax/russian-lab/search-word', data: {'searchbyenglishwords': $('#searchTextEnglish').val()} }).done(function(result) {
			setResults(result);
		});
	}
};



var decClasses = new Object();

decClasses['dec_acc_f'] = "feminine accusative";
decClasses['dec_gen_f'] = "feminine genitive, dative, instrumental and prepositional";
decClasses['dec_ins_alt_f'] = "feminine instrumental";
decClasses['dec_nom_f'] = "feminine nominative";
decClasses['dec_dat_m'] = "masculine dative";
decClasses['dec_gen_m'] = "masculine genitive and accusative";
decClasses['dec_ins_m'] = "masculine instrumental";
decClasses['dec_nom_m'] = "masculine nominative and accusative";
decClasses['dec_pre_m'] = "masculine prepositional";
decClasses['dec_nom_n'] = "neuter nominative";
decClasses['dec_dat_p'] = "plural dative";
decClasses['dec_gen_p'] = "plural genitive, accusative and prepositional";
decClasses['dec_ins_p'] = "plural instrumental";
decClasses['dec_nom_p'] = "plural nominative and accusative";
decClasses['dec_comp'] = "comparative";
decClasses['dec_p_d'] = "dative plural";
decClasses['dec_p_g'] = "genitive plural";
decClasses['dec_p_i'] = "instrumental plural";
decClasses['dec_p_n'] = "nominative plural";
decClasses['dec_p_p'] = "prepositional plural";
decClasses['dec_s_a'] = "accusative singular";
decClasses['dec_s_d'] = "dative singular";
decClasses['dec_s_g'] = "genitive singular";
decClasses['dec_s_i'] = "instrumental singular";
decClasses['dec_s_i_alt'] = "instrumental singular";
decClasses['dec_s_loc'] = "locative singular";
decClasses['dec_s_n'] = "nominative singular";
decClasses['dec_s_p'] = "prepositional singular";
decClasses['dec_s_par'] = "partitive singular";
decClasses['dec_s_voc'] = "vocative singular";
decClasses['dec_short_f'] = "feminine";
decClasses['dec_short_m'] = "masculine";
decClasses['dec_short_n'] = "neuter";
decClasses['dec_short_p'] = "plural";
decClasses['dec_sup'] = "superlative";
decClasses['fut_1p'] = "1st person future";
decClasses['fut_1s'] = "1st person future";
decClasses['fut_2p'] = "2nd person future";
decClasses['fut_2s'] = "2nd person future";
decClasses['fut_3p'] = "3rd person future";
decClasses['fut_3s'] = "3rd person future";
decClasses['imp_p'] = "plural imperative";
decClasses['imp_s'] = "singular imperative";
decClasses['infinitive'] = "infinitive";
decClasses['past_act'] = "past active";
decClasses['past_adv'] = "past adverbial";
decClasses['past_adv_short'] = "past adverbial";
decClasses['past_f'] = "feminine past";
decClasses['past_m'] = "masculine past";
decClasses['past_n'] = "neuter past";
decClasses['past_p'] = "plural past";
decClasses['past_pas'] = "past passive";
decClasses['pres_1p'] = "1st person plural";
decClasses['pres_1s'] = "1st person singular";
decClasses['pres_2p'] = "2nd person plural";
decClasses['pres_2s'] = "2nd person singular";
decClasses['pres_3p'] = "3rd person plural";
decClasses['pres_3s'] = "3rd person singular";
decClasses['pres_act'] = "present active";
decClasses['pres_adv'] = "present adverbial";
decClasses['pres_pas'] = "present passive";

var addCyrillicConversion = function(input, output) {
	cyrillicConversions[input] = output;
	cyrillicReverseLookup[output] = [input];
};

var cyrillicConversions = new Object();
var cyrillicReverseLookup = new Object();

addCyrillicConversion('а\'',"а\u0301");
addCyrillicConversion('э\'',"э\u0301");
addCyrillicConversion('ы\'',"ы\u0301");
addCyrillicConversion('о\'',"о\u0301");
addCyrillicConversion('у\'',"у\u0301");
addCyrillicConversion('я\'',"я\u0301");
addCyrillicConversion('е\'',"е\u0301");
addCyrillicConversion('и\'',"и\u0301");
addCyrillicConversion('ю\'',"ю\u0301");

addCyrillicConversion('a',"а");
addCyrillicConversion('еh',"э");
addCyrillicConversion('иh',"ы");
addCyrillicConversion('o',"о");
addCyrillicConversion('u',"у");
addCyrillicConversion('w',"у");
addCyrillicConversion('йa',"я");
addCyrillicConversion('e',"е");
addCyrillicConversion('йe',"е");
addCyrillicConversion('i',"и");
addCyrillicConversion('йi',"и");
addCyrillicConversion('йo',"ё");
addCyrillicConversion('йu',"ю");
addCyrillicConversion('y',"й");

addCyrillicConversion('ь\'',"ъ");
addCyrillicConversion('ьh',"ъ");
addCyrillicConversion('\'',"ь");
addCyrillicConversion('\'h',"ь");
addCyrillicConversion('ъh',"'");

addCyrillicConversion('j',"дж");
addCyrillicConversion('b',"б");
addCyrillicConversion('v',"в");
addCyrillicConversion('g',"г");
addCyrillicConversion('d',"д");
addCyrillicConversion('z',"з");
addCyrillicConversion('k',"к");
addCyrillicConversion('l',"л");
addCyrillicConversion('m',"м");
addCyrillicConversion('n',"н");
addCyrillicConversion('p',"п");
addCyrillicConversion('q',"к");
addCyrillicConversion('r',"р");
addCyrillicConversion('s',"с");
addCyrillicConversion('t',"т");
addCyrillicConversion('f',"ф");
addCyrillicConversion('пh',"ф");
addCyrillicConversion('бh',"в");
addCyrillicConversion('x',"х");

addCyrillicConversion('зh',"ж");
addCyrillicConversion('жh',"жж");
addCyrillicConversion('сh',"ш");
addCyrillicConversion('кh',"х");
addCyrillicConversion('шh',"щ");
addCyrillicConversion('щh',"ш");
addCyrillicConversion('тs',"ц");
addCyrillicConversion('c',"ц");
addCyrillicConversion('цh',"ч");
addCyrillicConversion('чh',"чш");


var charsToWatch = new Set();
charsToWatch.add("a");
charsToWatch.add("b");
charsToWatch.add("c");
charsToWatch.add("d");
charsToWatch.add("e");
charsToWatch.add("f");
charsToWatch.add("g");
charsToWatch.add("h");
charsToWatch.add("i");
charsToWatch.add("j");
charsToWatch.add("k");
charsToWatch.add("l");
charsToWatch.add("m");
charsToWatch.add("n");
charsToWatch.add("o");
charsToWatch.add("p");
charsToWatch.add("q");
charsToWatch.add("r");
charsToWatch.add("s");
charsToWatch.add("t");
charsToWatch.add("u");
charsToWatch.add("v");
charsToWatch.add("w");
charsToWatch.add("x");
charsToWatch.add("y");
charsToWatch.add("z");
charsToWatch.add("'");

//export default charsToWatch;

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
	enableButtons("#nounTable");
	enableButtons("#adjectiveTable");
	enableButtons("#verbTable");
});

$(document).keyup(function(e) {
	if (e.keyCode === 27) {
		$('.closable-window').addClass("hidden");
	}
});

var addButtonSelectEvent = function(button) {
	button.click(function() {
		doClick(button, true);
	});
};

var doClick = function(button, toggle) {
	var selectedSuccessfully = false;

	if (typeof buttonSelected === "function") {
		if (toggle) {
			selectedSuccessfully = buttonSelected(button, button.hasClass("selected"));
		}
		else {
			selectedSuccessfully = buttonSelected(button, !button.hasClass("selected"));
		}
	}

	if (toggle) {
		if (selectedSuccessfully) {
			if (button.hasClass("selectable")) {
				if (button.hasClass("selected")) {
					button.removeClass("selected");
					button.blur();
				}
				else {
					button.parents(".closable-window").find(".selectable").removeClass("selected");
					button.addClass("selected");
					button.blur();
				}
			}
		}
	}
};

var getSelectedButtons = function(buttonGroup) {
	return $(buttonGroup).find(".selectable.selected");
};

var getDialog = function(element) {
	return $(element).closest(".closable-window,.window");
};

var displaySubmenu = function(clickedMenuItem) {
	var parent = $(clickedMenuItem).parent();
	var topLevel = $("ul.menu");

	if (parent.hasClass("clicked")) {
		parent.removeClass("clicked");
		parent.find("li").removeClass("clicked");
	}
	else {
		topLevel.find("li").removeClass("clicked");
		parent.addClass("clicked");
		parent.parentsUntil("ul.menu").addClass("clicked");
	}
};

var enableButtons = function(selector) {

	$(selector).find(".close-button").each(function(i){
		$(this).click(function() {
			$(this).parents(".closable-window").addClass("hidden");
		});
	});

	$(selector).find(".button,.long-button").each(function(i){
		addButtonSelectEvent($(this));
	});
};

var chooseItem = function(mainClass, subClass) {
	$("." + mainClass).addClass("hidden");

	if (!(subClass === null || subClass === "")) {
		$("." + subClass).removeClass("hidden");
	}
};

var prevHeaderOuterHeight = null;

// Noun functions

var displayNounResult = function(result) {

	var tableId = "nounTable";

	var data = result.data[0];
	var firstRow = data[0];


	var animacy = firstRow["is_animate"];
	var gender = firstRow["gender"];
	var decType = firstRow["dec_type"];

	tableIdTemplate = tableId + "Template";

	var table = $("#" + tableId);
	var tableContainerObj = $("#" + tableId + " .content");

	$(tableContainerObj).empty();
	$(tableContainerObj).append( $("#" + tableIdTemplate + " table").clone() );
	
	// Hide all other word tables
	$(".word-conjugations-table").parents("closable-window").addClass("hidden");

	$("#" + tableId).removeClass("hidden");

	var accusativeSingularExists = false;

	var dictFormS = null;
	var dictFormP = null;
	var dictForm = null;

	for (var i=0; i<data.length; i++) {
		var dataRow = data[i];
		if (dataRow['dec_class'] == "dec_s_a") {
			accusativeSingularExists = true;
		}
		else if (dataRow['dec_class'] == "dec_s_n") {
			if (dictFormS == null) {
				dictFormS = mergeStressMarks(dataRow["spelling"], dataRow["stress_pos"]);
			}
		}
		else if (dataRow['dec_class'] == "dec_p_n") {
			if (dictFormP == null) {
				dictFormP = mergeStressMarks(dataRow["spelling"], dataRow["stress_pos"]);
			}
		}
	}

	dictForm = dictFormS == null ? dictFormP : dictFormS;
	table.find(".result-entry.dict-form").html(dictForm);

	if (!accusativeSingularExists) {
		if (animacy == "a") {
			table.find(".result-entry.dec_s_a").addClass("dec_s_g");
		}
		else if (animacy == "i") {
			table.find(".result-entry.dec_s_a").addClass("dec_s_n");
		}
		else if (animacy == "b") {
			table.find(".result-entry.dec_s_a").addClass("dec_s_n");
			table.find(".result-entry.dec_s_a").addClass("dec_s_g");
		}
	}

	if (animacy == "a") {
		table.find(".result-entry.dec_p_a").addClass("dec_p_g");
	}
	else if (animacy == "i") {
		table.find(".result-entry.dec_p_a").addClass("dec_p_n");
	}
	else if (animacy == "b") {
		table.find(".result-entry.dec_p_a").addClass("dec_p_n");
		table.find(".result-entry.dec_p_a").addClass("dec_p_g");
	}

	for (var i=0; i<data.length; i++) {
		var dataRow = data[i];
		var dataClass = dataRow['dec_class'];
		var fieldToUse = $("#" + tableId + " ." + dataClass);

		if (dataClass=="dec_s_par" || dataClass=="dec_s_loc" || dataClass=="dec_s_voc") {
			fieldToUse.parent().removeClass("hidden");
		}

		var wordToAdd = mergeStressMarks(dataRow["spelling"], dataRow["stress_pos"]);

		$(fieldToUse).each(function() {
			var fieldValue = $(this).html();

			if (!fieldValue == "") {
				fieldValue += ", ";
			}

			fieldValue += wordToAdd;

			$(this).html(fieldValue);
		});

	}
	
	chooseItem("noun-gender", gender);
	chooseItem("noun-animate", animacy);
		
	var decOptionsObj = $("#" + tableId).find(".declension-options");
	var decOptionsSelectables = decOptionsObj.find(".selectable");
	
	$("#" + tableId + " .word-conjugations-table").removeClass("hidden");
	$("#" + tableId + " .noun-indeclinable").addClass("hidden");
	
	if (decType === "s") {
		buttonSelected($("#" + tableId + " .showSingularButton" ), false);
		decOptionsSelectables.addClass("hidden");
		
		chooseItem("singular-forms", "only");
	}
	else if (decType === "p") {
		buttonSelected($("#" + tableId + " .showPluralButton" ), false);
		decOptionsSelectables.addClass("hidden");
		chooseItem("plural-forms", "only");
	}
	else if (decType === "i") {
		decOptionsSelectables.addClass("hidden");
		$("#" + tableId + " .word-conjugations-table").addClass("hidden");
		$("#" + tableId + " .noun-indeclinable").removeClass("hidden");
	}
	else {
		doClick(getSelectedButtons(decOptionsObj), false);
		decOptionsSelectables.removeClass("hidden");
		chooseItem("singular-forms", "not-only");
		chooseItem("plural-forms", "not-only");
	}	
};

	
var detectNounButtons = function(button, currentlySelected) {

	var successful = true;
	
	if (currentlySelected) {
		if (button.hasClass("showSingularButton") || button.hasClass("showPluralButton")) {
			var dialog = getDialog(button);
			dialog.find(".singular-cell").removeClass("hidden");
			dialog.find(".plural-cell").removeClass("hidden");
		}
		else {
			successful = false;
		}
	}
	else {
		if (button.hasClass("showSingularButton")) {
			var dialog = getDialog(button);
			dialog.find(".singular-cell").removeClass("hidden");
			dialog.find(".plural-cell").addClass("hidden");
		}
		else if (button.hasClass("showPluralButton")) {
			var dialog = getDialog(button);
			dialog.find(".singular-cell").addClass("hidden");
			dialog.find(".plural-cell").removeClass("hidden");
		}
		else {
			successful = false;
		}
	}

	return successful;
};



// Adjective functions

var displayAdjectiveResult = function(result) {

	var tableId = "adjectiveTable";

	var data = result.data[0];
	var firstRow = data[0];
	
	var decType = firstRow["dec_type"];

	tableIdTemplate = tableId + "Template";

	var table = $("#" + tableId);
	var tableContainerObj = $("#" + tableId + " .content");

	$(tableContainerObj).empty();
	$(tableContainerObj).append( $("#" + tableIdTemplate + " table").clone() );
	
	// Hide all other word tables
	$(".word-conjugations-table").parents("closable-window").addClass("hidden");

	$("#" + tableId).removeClass("hidden");

	var accusativeSingularExists = false;

	var dictForm = null;

	for (var i=0; i<data.length; i++) {
		var dataRow = data[i];
		if (dataRow['dec_class'] == "dec_nom_m") {
			dictForm = mergeStressMarks(dataRow["spelling"], dataRow["stress_pos"]);
			break;
		}
	}
	
	table.find(".result-entry.dict-form").html(dictForm);
		
	for (var i=0; i<data.length; i++) {
		var dataRow = data[i];
		var dataClass = dataRow['dec_class'];
		var fieldToUse = $("#" + tableId + " ." + dataClass);

		var wordToAdd = mergeStressMarks(dataRow["spelling"], dataRow["stress_pos"]);

		$(fieldToUse).each(function() {
			var fieldValue = $(this).html();

			if (!fieldValue == "") {
				fieldValue += ", ";
			}

			fieldValue += wordToAdd;

			$(this).html(fieldValue);
		});
	}
	
	table.find(".result-entry").each(function(i) {
		var text = $(this).text().trim();
		if (text == "") {
			$(this).text("-");
		}
	});
		
	var decOptionsObj = $("#" + tableId).find(".declension-options");
	doClick(getSelectedButtons(decOptionsObj), false);
};

	
var detectAdjectiveButtons = function(button, currentlySelected) {

	var successful = true;
	
	if (currentlySelected) {
		if (button.hasClass("showAdjMasculineButton") || button.hasClass("showAdjFeminineButton") || button.hasClass("showAdjNeuterButton") || button.hasClass("showAdjPluralButton") || button.hasClass("showAdjSFormsButton")) {
			var dialog = getDialog(button);
			dialog.find(".main-table").removeClass("hidden");
			dialog.find(".main-forms").removeClass("hidden");
			dialog.find(".m-cell").removeClass("hidden");
			dialog.find(".f-cell").removeClass("hidden");
			dialog.find(".n-cell").removeClass("hidden");
			dialog.find(".p-cell").removeClass("hidden");
			dialog.find(".short-forms,.other-forms").removeClass("hidden");
			dialog.find(".short-forms-only").addClass("hidden");
		}
		else {
			successful = false;
		}
	}
	else {
		if (button.hasClass("showAdjMasculineButton")) {
			var dialog = getDialog(button);
			dialog.find(".main-table").removeClass("hidden");
			dialog.find(".main-forms").removeClass("hidden");
			dialog.find(".m-cell").removeClass("hidden");
			dialog.find(".f-cell").addClass("hidden");
			dialog.find(".n-cell").addClass("hidden");
			dialog.find(".p-cell").addClass("hidden");
			dialog.find(".short-forms,.other-forms").addClass("hidden");
			dialog.find(".short-forms-only").addClass("hidden");
		}
		else if (button.hasClass("showAdjFeminineButton")) {
			var dialog = getDialog(button);
			dialog.find(".main-table").removeClass("hidden");
			dialog.find(".main-forms").removeClass("hidden");
			dialog.find(".m-cell").addClass("hidden");
			dialog.find(".f-cell").removeClass("hidden");
			dialog.find(".n-cell").addClass("hidden");
			dialog.find(".p-cell").addClass("hidden");
			dialog.find(".short-forms,.other-forms").addClass("hidden");
			dialog.find(".short-forms-only").addClass("hidden");
		}
		else if (button.hasClass("showAdjNeuterButton")) {
			var dialog = getDialog(button);
			dialog.find(".main-table").removeClass("hidden");
			dialog.find(".main-forms").removeClass("hidden");
			dialog.find(".m-cell").addClass("hidden");
			dialog.find(".f-cell").addClass("hidden");
			dialog.find(".n-cell").removeClass("hidden");
			dialog.find(".p-cell").addClass("hidden");
			dialog.find(".short-forms,.other-forms").addClass("hidden");
			dialog.find(".short-forms-only").addClass("hidden");
		}
		else if (button.hasClass("showAdjPluralButton")) {
			var dialog = getDialog(button);
			dialog.find(".main-table").removeClass("hidden");
			dialog.find(".main-forms").removeClass("hidden");
			dialog.find(".m-cell").addClass("hidden");
			dialog.find(".f-cell").addClass("hidden");
			dialog.find(".n-cell").addClass("hidden");
			dialog.find(".p-cell").removeClass("hidden");
			dialog.find(".short-forms,.other-forms").addClass("hidden");
			dialog.find(".short-forms-only").addClass("hidden");
		}
		else if (button.hasClass("showAdjSFormsButton")) {
			var dialog = getDialog(button);
			dialog.find(".main-table").addClass("hidden");
			dialog.find(".short-forms,.other-forms").removeClass("hidden");
			dialog.find(".short-forms-only").removeClass("hidden");
		}
		else {
			successful = false;
		}
	}

	return successful;
};

// Verb functions

var getInfinitiveRow = function(data, aspect) {

	// The row to return will be for the verb's infinitive if one exists; otherwise null.
	var rowToReturn = null;

	for (var i=0; i<data.length; i++) {
		var dataRow = data[i];
		var dataClass = dataRow['dec_class'];

		if (dataClass == "infinitive") {
			rowToReturn = dataRow;
			break;
		}
	}
	
	return rowToReturn;
};

/**
	The aspect must take either the value of "i" or "p". If a verb has "b" for both aspects
	then this function must be called twice (once for "i" and the other for "p").
	
	This function returns the row containing the infinitive if one exists or null otherwise.
*/
var setVerb = function(data, aspect) {
	var tableId = "verbTable";
	var table = $("#" + tableId);
	
	if (aspect === "i") {
		table.find(".column-1,.column-2").removeClass("hidden");
	}
	else if (aspect === "p") {
		table.find(".column-3").removeClass("hidden");
	}
	
	table.find(".result-entry.aspect-" + aspect).text("");

	var infinitive = null;
	
	// The row to return will be for the verb's infinitive if one exists; otherwise null.
	var rowToReturn = null;

	for (var i=0; i<data.length; i++) {
		var dataRow = data[i];
		
		var dataClass = dataRow['dec_class'];
		var fieldToUse = $("#" + tableId + " .aspect-" + aspect + "." + dataClass);

		var wordToAdd = mergeStressMarks(dataRow["spelling"], dataRow["stress_pos"]);

		if (dataClass == "infinitive") {
			infinitive = dataRow["spelling"];
			rowToReturn = dataRow;
		}

		$(fieldToUse).each(function() {
			var fieldValue = $(this).html();

			if (!fieldValue == "") {
				fieldValue += ", ";
			}

			fieldValue += wordToAdd;

			$(this).html(fieldValue);
		});
	}
	
	// The future imperfective form for this verb doesn't include the infinitive.
	if (infinitive == "быть") {
		table.find(".non-biht").text("");
	}
	
	//chooseItem("noun-gender", gender);
	//chooseItem("noun-animate", animacy);
		
	var decOptionsObj = $("#" + tableId).find(".declension-options");
	var decOptionsSelectables = decOptionsObj.find(".selectable");
	
	$("#" + tableId + " .word-conjugations-table").removeClass("hidden");
	
	return rowToReturn;
};

var displayVerbResult = function(result) {

	var tableId = "verbTable";

	var data = result.data;
	
	tableIdTemplate = tableId + "Template";

	var table = $("#" + tableId);
	var tableContainerObj = $("#" + tableId + " .content");

	// Retrieving copy of table template if not yet filled or clearing values otherwise.
	if (!this.tableAdded) {
		$(tableContainerObj).append( $("#" + tableIdTemplate + " table").clone() );
		this.tableAdded = true;
	}
	
	table.find(".column-1,.column-2,.column-3").addClass("hidden");
	
	
	// Hide all other word tables
	$(".word-conjugations-table").parents("closable-window").addClass("hidden");
	$("#" + tableId).removeClass("hidden");

	var aspectISet = false;
	var aspectPSet = false;

	var allVerbs = new Array();
	
	// The number of infinitives joined is less then or equal to the number of rows
	var allInfinitivesJoined = new Array();

	// Setting the perfect and imperfect verb pairs to both be filled if possible.
	for (var i=0; i<data.length; i++) {
		var nextVerbBlock = data[i];
		var firstRow = nextVerbBlock[0];

		var aspect = firstRow["aspect"];
		var wordId = firstRow["word_id"];
	
		var returnedInfinitiveRow = null;
	
		if (aspect === "b") {
			if (!aspectISet) {
				returnedVerb = setVerb(nextVerbBlock, "i");
				aspectISet = true;
			}
			if (!aspectPSet) {
				returnedVerb = setVerb(nextVerbBlock, "p");
				aspectPSet = true;
			}
		}
		else if (aspect === "i") {
			if (!aspectISet) {
				returnedVerb = setVerb(nextVerbBlock, "i");
				aspectISet = true;
			}
		}
		else if (aspect === "p") {
			if (!aspectPSet) {
				returnedVerb = setVerb(nextVerbBlock, "p");
				aspectPSet = true;
			}
		}
		
		if (returnedInfinitiveRow === null) {
			returnedInfinitiveRow = getInfinitiveRow(nextVerbBlock);
		}
		
		allVerbs.push({"allRows": nextVerbBlock, "infinitiveRow": returnedInfinitiveRow});
		allInfinitivesJoined.push("<b>" + mergeStressMarks(returnedInfinitiveRow["spelling"], returnedInfinitiveRow["stress_pos"]) + "</b> <i>" + getAspectWord(returnedInfinitiveRow["aspect"]) + "</i>");
	}
	
	table.find(".result-entry.verb-infinitives").html(allInfinitivesJoined.join(" / "));
	if (allInfinitivesJoined.length === 1) {
		chooseItem("word-type-verb-option", "word-type-verb");
	}
	else {
		chooseItem("word-type-verb-option", "word-type-verbs");
	}
	
	// Setting the verb selection boxes within the verb window
	var selectionBoxAspectI = table.find(".aspect-i .verb-select");
	var selectionBoxAspectP = table.find(".aspect-p .verb-select");
	
	// All options are removed
	selectionBoxAspectI.children().remove();
	selectionBoxAspectP.children().remove();
	
	selectionBoxAspectI.data("allVerbs", allVerbs);
	selectionBoxAspectI.change(function() {
		var allVerbs = $(this).data("allVerbs");
		
		var selectedValue = parseInt($(this).val());
		var selectedVerb = allVerbs[selectedValue]["allRows"];
		
		setVerb(selectedVerb, "i");
	});
	
	selectionBoxAspectP.data("allVerbs", allVerbs);
	selectionBoxAspectP.change(function() {
		var allVerbs = $(this).data("allVerbs");
		
		var selectedValue = parseInt($(this).val());
		var selectedVerb = allVerbs[selectedValue]["allRows"];
		console.log(selectedVerb);
		
		setVerb(selectedVerb, "p");
	});
	
	for (var i=0; i<allVerbs.length; i++) {
		var nextRow = allVerbs[i];
		var infinitiveRow = nextRow["infinitiveRow"];
		//console.log(infinitiveRow);
		var aspect = infinitiveRow["aspect"];
		
		if (aspect === "b") {
			selectionBoxAspectI.append("<option value=\"" + i +"\">" + mergeStressMarks(infinitiveRow["spelling"], infinitiveRow["stress_pos"]) + "</option>");
			selectionBoxAspectP.append("<option value=\"" + i +"\">" + mergeStressMarks(infinitiveRow["spelling"], infinitiveRow["stress_pos"]) + "</option>");
		}
		else if (aspect === "i") {
			selectionBoxAspectI.append("<option value=\"" + i +"\">" + mergeStressMarks(infinitiveRow["spelling"], infinitiveRow["stress_pos"]) + "</option>");
		}
		else if (aspect === "p") {
			selectionBoxAspectP.append("<option value=\"" + i +"\">" + mergeStressMarks(infinitiveRow["spelling"], infinitiveRow["stress_pos"]) + "</option>");
		}
	}
	
	/*
	if (decType === "s") {
		buttonSelected($("#" + tableId + " .showSingularButton" ), false);
		decOptionsSelectables.addClass("hidden");
		
		chooseItem("singular-forms", "only");
	}
	else if (decType === "p") {
		buttonSelected($("#" + tableId + " .showPluralButton" ), false);
		decOptionsSelectables.addClass("hidden");
		chooseItem("plural-forms", "only");
	}
	else if (decType === "i") {
		decOptionsSelectables.addClass("hidden");
		$("#" + tableId + " .word-conjugations-table").addClass("hidden");
		$("#" + tableId + " .noun-indeclinable").removeClass("hidden");
	}
	else {
		doClick(getSelectedButtons(decOptionsObj), false);
		decOptionsSelectables.removeClass("hidden");
		chooseItem("singular-forms", "not-only");
		chooseItem("plural-forms", "not-only");
	}
	*/
};