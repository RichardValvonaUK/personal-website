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
	var ajaxLink = linkToAjax('russian-lab/word-conjugator');

	$.get(ajaxLink, { 'searchbyid': idToSelect }, function(result) {
		displayResult($.parseJSON(result));
	});
};


var setSearchWordFromId = function(idToSelect) {
	var ajaxLink = linkToAjax('russian-lab/word-conjugator');

	$.get(ajaxLink, { 'searchbyid': idToSelect }, function(result) {
		//$("#resultsList tbody .result-entry").addClass("hidden");
		//$(resultEntryToShowOnly).removeClass("hidden");
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
	var ajaxLink = linkToAjax('russian-lab/word-conjugator');
	
	var searchTextOptionSelected = $("input[name = \"searchTextOption\"]:checked").val();
	
	if (searchTextOptionSelected == "russian") {
		$.get(ajaxLink, { 'searchword': $('#searchTextRussian').val() }, function(data) {
			setResults(data);
		});
	}
	else if (searchTextOptionSelected == "english") {
		$.get(ajaxLink, { 'searchbyenglishwords': $('#searchTextEnglish').val() }, function(data) {
			setResults(data);
		});
	}
};

