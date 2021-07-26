/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */

// any CSS you import will output into a single css file (app.css in this case)
import './app.css';

// start the Stimulus application
//import './bootstrap.js';

//import './jquery-3.6.0.min.js';


// app.js

// require jQuery normally
const $ = require('./jquery-3.6.0.min.js');

// create global $ and jQuery variables
global.$ = global.jQuery = $;

var dialog;
var form;

function toggleVisibility(selector) {
	var element = $(selector);

	var visibility = element.css("visibility");

	if (visibility == "visible") {
		element.css("visibility", "hidden");
	}
	else {
		element.css("visibility", "visible");
	}
}

var scrollPos = 0;


function resetMenu() {
	var topLevel = $("ul.menu");
	topLevel.find("li").removeClass("clicked");
}

function toggleMenu() {
	var selector = "#mobile-menu";
	var bodySelector = ".site-wrapper";

	var menuContainer = $(".title-and-menu");

	var element = $(selector);
	var bodyElement = $(bodySelector);

	// Closing menu
	if (menuContainer.hasClass("menu-open")) {
		menuContainer.removeClass("menu-open");
		menuContainer.addClass("menu-closed");
		//$("#richard1029384756-menu-bars").removeClass("full-height");
		//element.addClass("hidden");
		//element.addClass("invisible");
		//$("#main-content").removeClass("hidden-on-mobile");
		//$("footer").removeClass("hidden");
		//bodyElement.removeClass("non-scrollable-on-mobile");
		$(".menu-toggler").addClass("rotate0");
		$(".menu-toggler").removeClass("rotate90");
		//$(".site-wrapper").scrollTop(scrollPos);
		resetMenu();
	}
	// Opening up menu
	else {
		menuContainer.addClass("menu-open");
		menuContainer.removeClass("menu-closed");
		//scrollPos = $(".site-wrapper").scrollTop();
		//$("#richard1029384756-menu-bars").addClass("full-height");
		////element.removeClass("hidden");
		element.removeClass("invisible");
		//$("#main-content").addClass("hidden-on-mobile");
		//$("footer").addClass("hidden");
		//bodyElement.addClass("non-scrollable-on-mobile");
		$(".menu-toggler").removeClass("rotate0");
		$(".menu-toggler").addClass("rotate90");
	}
	doResize();
}

function addUser() {

}

function showDialog() {
	dialog.dialog( "open" );
}

function clearSelectMenuItem() {
	$("ul.menu li").removeClass("always-selected");
	$("#left-side-menu nav.vertical-menu ul.menu ul").removeClass("always-visible");
}

function selectMenuItem(item, view) {
	clearSelectMenuItem();

	$(item).parent().addClass("always-selected");
	$(item).parentsUntil("ul.menu", "ul").addClass("always-visible");

	var popupMenu = $(".edit-menu-options-pop-up");
	popupMenu.detach().appendTo($(item).parent());
	popupMenu.addClass("always-visible");
}


function editView(view) {

	var r = confirm("Are you sure you want to edit this view? Any unsaved changes may be lost.");

	if (r) {
		redirectToPage("edit-pages?view=" + view);
	}
}


function indentSelection(textArea, direction) {
	var textAreaObj = $(textArea);

	var oldVal = textAreaObj.val();

	var selectionStart = textAreaObj[0].selectionStart;
	var selectionEnd = textAreaObj[0].selectionEnd;

	var toReplace;
	var replacement;


	var firstPart = oldVal.substring(0, selectionStart);
	var secondPart = oldVal.substring(selectionStart, selectionEnd);
	var thirdPart = oldVal.substring(selectionEnd);

	if (selectionStart == selectionEnd && direction != 'left') {
		var newVal = firstPart + '    ' + thirdPart;

		var newCaretPos = selectionStart + 4;

		textAreaObj.val(newVal);
		textAreaObj[0].setSelectionRange(newCaretPos, newCaretPos);
	}
	else {
		if (direction == 'left') {
			toReplace = '\n    ';
			replacement = '\n';
		}
		else {
			toReplace = '\n';
			replacement = '\n    ';
		}

		var firstPartLastIndexOfN = firstPart.lastIndexOf('\n');

		var selectionStartDiff = 0;

		if (direction == 'left') {
			if (firstPart.lastIndexOf('\n    ') == firstPart.lastIndexOf('\n')) {
				selectionStartDiff = -4;
			}
		}
		else {
			selectionStartDiff = 4;
		}

		if (firstPartLastIndexOfN != -1) {
			firstPart = oldVal.substring(0, firstPartLastIndexOfN);
			secondPart = oldVal.substring(firstPartLastIndexOfN, selectionStart) + secondPart;
		}

		if (secondPart.endsWith('\n')) {
			secondPart = secondPart.substring(0, secondPart.length-1);
			thirdPart = '\n' + thirdPart;
		}

		secondPart = secondPart.split(toReplace).join(replacement);

		var newVal = firstPart + secondPart + thirdPart;

		var lengthDiff = newVal.length - oldVal.length;

		textAreaObj.val(newVal);
		textAreaObj[0].setSelectionRange(selectionStart + selectionStartDiff, selectionEnd + lengthDiff);
	}
}

var pageScrollY = 0;

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

var doResize = function(page) {
/*
	var outerHeight = $("header").outerHeight();

	if (prevHeaderOuterHeight != outerHeight) {

		$("#middle-section").css("margin-top", outerHeight);
		$("#mobile-menu").css("padding-top", outerHeight);
	}

	prevHeaderOuterHeight = outerHeight;
	*/
};

var getSelectedButtons = function(buttonGroup) {
	return $(buttonGroup).find(".selectable.selected");
};

var getDialog = function(element) {
	return $(element).closest(".closable-window,.window");
};

var displaySubmenu = function(clickedMenuItem) {
	var parent = $(clickedMenuItem).parent();
	var topLevel = $("nav > span > ul.menu");

	if (parent.hasClass("clicked")) {
		parent.removeClass("clicked");
		parent.find("li").removeClass("clicked");
	}
	else {
		topLevel.find("li").removeClass("clicked");
		parent.addClass("clicked");
		parent.parentsUntil(topLevel).addClass("clicked");
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


$(document).ready(function() {
	$(window).resize(function() {
		doResize();
	});


	$("ul.menu .with-sub-menu").click(function(e) {
		e.stopPropagation();
		displaySubmenu($(this));
	});

	//$(".closable-window").draggable();
	$(".menu-toggler").click(function(e) {
		e.stopPropagation();
		toggleMenu();
	});

	$("#menu-on-pc").click(function(e) {
		resetMenu();
	});

	doResize();

	$(".site-wrapper").on("scroll", function() {
		var scrollTop = $(this).scrollTop();

		if (scrollTop < 5) {
			$("header").removeClass("is-scrolled");
		}
		else {
			$("header").addClass("is-scrolled");
		}
	});

});