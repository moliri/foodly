///////////////////////////////////////
/* Global variables and objects */

/* user id */
var user_id = ""; // THIS IS A RESERVED VALUE
var clickedIndex;
var temp;
var currRecipe = new prelim_recipe();

// Get the size of the static (hard-coded) pantry
var staticPantrySize;

/* global array to store the recipes */
var recipeList = new Array();
var recipeObjList = new Array();

/* global object to store API keys & related logic */
var yummlyAPIKeys = {
    _keyIndex : 0, // do not directly access members beginning with an underscore (they're private).
    _keyArray : ["7ddb19332c3de6a14405af6bffae0aad", "007d17e544de591f7b7bc27ad695f2cd", "9660aeb80292c3128c93bd8e904e1490"],
    _idArray : ["530cbd64","b8a751c0", "2daedd08"],
    
    // get the request string to be appended to the search base url
    getRequestString : function (searchParams) {
        return "_app_id=" + this.getId() + "&_app_key=" + this.getApiKey() + "&q=" + searchParams + "&callback=?";
    },
    
    // get the key currently in use
    getApiKey : function () {
        return this._keyArray[this._keyIndex];  
    },
    
    // get the id currently in use
    getId : function () {
        return this._idArray[this._keyIndex];
    },
    
    // cycle through api keys
    changeKey : function () {
        if(_keyIndex >= _keyArray.length){
            this._keyIndex = 0;
        }
        else {
            this._keyIndex++;
        }    
    } 
};

// Handling browser navigation
$(window).on("navigate", function (event, data) {
  var direction = data.state.direction;
  
  if (direction === 'back') {
    var page = $.mobile.activePage;
    
    if(page.is('#recipeItem')){
        $('#recipes .recipeList').empty();
        populateRecipeList();
    }
  }
  
});

///////////////////////////////////////
/* start page events and functions */

/* starting script for intro page */
$(document).on('pageinit', '#intropage', function(){
	$('#startbtn').click(logIn);
    $('#userID').bind('keypress', function (e){
        if(e.keyCode === 13) {
            logIn();
        }
    });
    
    staticPantrySize = $('#cblist').children().length;
});

function logIn() {
    user_id = $('#userID').val();
    $.mobile.changePage('#search');  
    return false;
}

///////////////////////////////////////
/* about page events and functions */

/* starting script for about page */
$(document).on('pageinit','#about',function(){
$('#favList2').click(function() {
        $('#recipes .recipeList').empty();
        data = backendGetRecipe(user_id, fillRecipeListArr);  
        $.mobile.changePage('#recipeList');
    });
});

///////////////////////////////////////
/* follow us page events and functions */

/* starting script for follow page */
$(document).on('pageinit','#contact',function(){
$('#favList3').click(function() {
        $('#recipes .recipeList').empty();
        data = backendGetRecipe(user_id, fillRecipeListArr);  
        $.mobile.changePage('#recipeList');
    });
});

///////////////////////////////////////
/* Pantry page events and functions */

/* starting script for pantry page */
$(document).on('pageinit','#search',function() {
	var container = $('#emptyMsg');
	$('<h6> Add items to your pantry or use the ones below. </h6>').appendTo(container);
	$("#searchButton").click(function () {
        $('#recipes .recipeList').empty();
        searchRecipes(populateRecipeList);
    });
	$('#btnSave').click(function() {
						addCheckbox($('#newItem').val(), true);
						$('#newItem').val('');
						updateSearch();
					});
	$('#btnDelete').click(function() {
						deleteCheckbox($('cb1').val());
						updateSearch();
					});	
    $('#newItem').bind('keypress', function (e) {
        if(e.keyCode === 13){
            addCheckbox($('#newItem').val(), true);
			deleteCheckbox($('#newItem').val());
			$('#newItem').val('');
			updateSearch();
        }
    });
    $('#favList').click(function() {
        $('#recipes .recipeList').empty();
    	data = backendGetRecipe(user_id, fillRecipeListArr);  
        $.mobile.changePage('#recipeList');
    });
    
});

$(document).on('pagebeforeshow','#search', function (){
    if(user_id !== ""){
        loadPantry(user_id,fillPantryList);
    }
});

$(document).on('pagebeforehide','#search',function () {

    if(user_id !== ""){
        //clear out (non-static) ingredient list when we navigate away from search page
        var ingreds = $('#cblist').children();
        for(var i = staticPantrySize; i < ingreds.length; i++){
            ingreds[i].remove();
        }
    }
});

function fillPantryList (list){
    for(var i = 0; i < list.length; i++){
        addCheckbox(list[i].attributes.Item, false);
    }
}

// takes a javascript array of ingredients
// returns the API search term string
function getIngredients(ingredients) {
	var str = "";
	for(var i = 0; i < ingredients.length - 1; i++){
		var withplus = ingredients[i] + "+";
			str += withplus;
		}
	str += ingredients[ingredients.length - 1];
    return str;
}
        
/* need to take care of undefined case */

function searchRecipes(callback) {
    recipeList = [];

	var ingreds = updateSearch();   
    
    var allowedCourse = $('#allowedCourse').val();
    if (allowedCourse === "Any") {
        allowedCourse = "";
    } else {
        allowedCourse = "&allowedCourse[]=course^course-"+allowedCourse;
    }   

    var maxTimeInMin = $('#maxTimeInMinutes').val();
    maxTimeInMin = "&maxTotalTimeInSeconds=" + maxTimeInMin*60;

	var foods = getIngredients(ingreds);
    
	var apiURL = "http://api.yummly.com/v1/api/recipes?"
	var queryString = apiURL + yummlyAPIKeys.getRequestString(foods) + allowedCourse + maxTimeInMin;
	
	$(function() {	
        // Handle case where we are out of API calls...
		$.ajax(queryString, 
		{
            dataType : 'jsonp',
			statusCode: {
			409: function() {
				alert(queryString);
				alert(statusCode);
				alert('An API Call error occured, please try again.');
                yummlyAPIKeys.changeKey(); // toggle the api keys
				}
			}
		});
	});
            
	$.getJSON(queryString, function(data){   
        updateSearch(); // possibly unnecessary - if performance becomes an issue we can try to get rid of this
        
		var recipes = "";
        // check for no recipes
        var recipesOK = false;

        if(!data || !data.matches || (data.matches.length === 0)){
            alert("No recipes found. Is your pantry empty? Otherwise, try selecting fewer items.");
        }
        else {
            recipesOK = true;
        }
        
        if(recipesOK){
            for(var i = 0; i < 10; i++){
                if(data.matches[i]) { //check for undefined
                    var obj = data.matches[i];
                    var recipeName = data.matches[i].recipeName;
                    var id = data.matches[i].id;
                    var picURL;
                    if (obj.smallImageUrls.length !== 0) {
                        picURL = obj.smallImageUrls[0]; 
                    } else {
                        picURL = "img/not_available.jpg";
                    }
                    recipeList.push(new prelim_recipe(recipeName, id, picURL));
                }
            }
            //alert(recipeList);
            callback();
            $.mobile.changePage('#recipeList');
        }
	});
}

function addCheckbox(name, isNewItem) {

	/*
	Need it to build this, now:

	<li id="cbItem">
		<div id='CB1'>
			<a class="none" href="#" style="padding-top: 0px;padding-bottom: 0px;padding-right: 42px;padding-left: 0px;">
				<fieldset data-role="controlgroup" >
					<input type="checkbox" id="cb1" value="chicken" class="custom"> </input>
					<label for="cb1" style="border-top-width: 0px;margin-top: 0px;border-bottom-width: 0px;margin-bottom: 0px;border-left-width: 0px;border-right-width: 0px;"> chicken </label>
				</fieldset>
			</a>
			<a class="none" id="btnDelete" >
			</a>
		</div>
	</li>
	
	*/
	
	$('#emptyMsg').empty();
	var container = $('#cblist');
	var inputs = container.find('div').find('input');
	//var divs = container.find('div');
	//var inputs = divs.find('input');
	var id = inputs.length+1;
	if(name !== ""){
        if(isNewItem && (user_id !== "")){
            backendAddPantry(user_id,name);
        }
		//adding checkbox item
		$("div.ui-checkbox").html();
		$('<input />', { type: 'checkbox', id: 'cb'+id, value: name, checked:"checked", class:"custom" }).appendTo(container);
		$('<label />', { 'for': 'cb'+id, text: name, 'style' : 'border-top-width: 0px;margin-top: 0px;border-bottom-width: 0px;margin-bottom: 0px;border-left-width: 0px;border-right-width: 0px;'}).appendTo(container);
		//wrapping with formatting
		$("div.ui-checkbox").wrap("<fieldset id='ctrlgrp' data-role='controlgroup'> </fieldset>");
		$('#ctrlgrp').wrap("<a href='#' id='cblink' style='padding-top: 0px;padding-bottom: 0px;padding-right: 42px;padding-left: 0px;'> </a>");
		$("a.none").wrapAll("<div id=CB"+ id + "> </div>");
		$('#CB'+ id).wrap("<li id='cbItem'> </li>");
		$('#cblist').trigger("create");
	}
	
	
}

function deleteCheckbox(name) {
    $('#cblist').remove('cb1');
	
	//need help implementing this
	
	//$('#cblist').remove(element);
	
	
}

function updateSearch() {
	
    var inputs = $('#cblist').find('div');
	var len = inputs.children().length; 
    
	var myIngredients=[];
		for (var i=0; i<=len; i++) {
			var isChecked = $('#cb'+i).is(':checked');
			if (isChecked) {
				myIngredients.push($('#cb'+i).val());
				len++;
			} else {
				//updateSearch(); 
			}
		}
		return myIngredients;
}


/////////////////////////////////////////////////////////////////
/* Recipe List and Recipe Page Objects, events, and functions */

var temp_url = new Array(10);
   
/* recipe class */
function recipe() {
        this.recipeName = '';
        this.id = '';
        this.picURL = '';
        this.recipeURL = '';
        this.ingredientLines = '';
        this.totalTimeInSeconds = '';
        this.numberOfServings = '';
        this.largePicURL = '';
}   


function recipe(recipeName, recipeID, picURL, recipeURL, ingredientLines, totalTimeInSeconds, numberOfServings, largePicURL) {
    this.recipeName = recipeName;
    this.id = recipeID;
    this.picURL = picURL;
    this.recipeURL = recipeURL;
    this.ingredientLines = ingredientLines;
    this.totalTimeInSeconds = totalTimeInSeconds;
    this.numberOfServings = numberOfServings;
    this.largePicURL = largePicURL;
}

/* preliminary recipe class */
function prelim_recipe() {
    this.recipeName = '';
    this.id = '';
    this.picURL = '';
}

function prelim_recipe(recipeName, recipeID, picURL) {
    this.recipeName = recipeName;
    this.id = recipeID;
    this.picURL = picURL;
}

function fillRecipeListArr(data) {
        recipeList = [];   
        $.each(data, function (index, obj) {
            var name = obj.attributes.recipeName;
            var id = obj.attributes.recipeID;
            var picURL = obj.attributes.picURL;
            recipeList.push(new prelim_recipe(name, id, picURL));
        });
        populateRecipeList();
        return;
}

/* starting script for recipe list page */
$(document).on('pageinit', '#recipeList', function () {
		clickedIndex = -1;
        $('#recipes .recipeList .listItem').click(function () {
            updateRecipeItem();
        });
        
        $('#favList1').click(function() {
            //$('#introPanel2').
            $('#recipes .recipeList').empty();
            data = backendGetRecipe(user_id, fillRecipeListArr);  
            $.mobile.changePage('#recipeList');

        });
});

$(document).on('pagebeforehide','#recipeList', function () {
   $('#recipes .recipeList').empty();
});

$(document).on('pagebeforeshow', '#recipeItem', updateRecipeItem);

$(document).on('pageinit', '#recipeItem', function () {
        $('#favorite').click(function () {
            if(user_id !== ""){
                backendAddRecipe(user_id, currRecipe.id, currRecipe.recipeName, currRecipe.picURL);
            }
        });
        
        $('#favList4').click(function() {
            $('#recipes .recipeList').empty();
            data = backendGetRecipe(user_id, fillRecipeListArr);  
            $.mobile.changePage('#recipeList');
        });
});

function updateRecipeItem() {
    var obj = recipeObjList[clickedIndex];
    $('#recipeTitle').text(obj.name);

    currRecipe.recipeName = obj.name;
    currRecipe.id =  obj.id; 
    currRecipe.picURL = obj.images[0].hostedSmallUrl;

    var image = obj.images[0].hostedLargeUrl;
    if (image === undefined) {image = "img/not_available.jpg";}

    $('#picURL').attr("src", image);
    $('#numberOfServings').text(obj.numberOfServings);

    var totalTime = obj.totalTime;
    if (totalTime === null) {totalTime = "Not Available";}
    $('#timeOfPrep').text(totalTime);
        
    var ingredients = recipeObjList[clickedIndex].ingredientLines;
    $('#recipeItem .ingredientList').empty();
    for (var i = 0; i < ingredients.length; i++) {
        $('#recipeItem .ingredientList').append('<li  style="white-space: normal !important">'+ ingredients[i] + '</li>'); 
    }
    $('#recipeItem .ingredientList').listview("refresh");
    
    $('#fullRecipeLink').click(function(){
        window.open(obj.source.sourceRecipeUrl);
    });
}

function populateRecipeList() {
    recipeObjList = [];
	var APIBase = "http://api.yummly.com/v1/api/recipe/";
    var appID = "?_app_id=" + yummlyAPIKeys.getId() + "&";
    var appKey = "_app_key=" + yummlyAPIKeys.getApiKey() + "&q=";
    var callback = "&callback=?";
    //$('#recipes .recipeList li').remove(); //clear the currrent list, may not be necessary
	$.each(recipeList, function(index, obj) {
		var picURL = obj.picURL;   
		var recipeName =  obj.recipeName;
		var recipeID = obj.id;
    	var queryURL = APIBase + recipeID + appID + appKey + callback;
    	$.getJSON(queryURL, function(data){
        	if(data && data.source){
                temp = data;
                //alert(temp);
        		var ingredientLines = data.ingredientLines;
                var totalTimeInSeconds = data.totalTimeInSeconds;
                var numberOfServings = data.numberOfServings;
            	var recipeURL = data.source.sourceRecipeUrl;
            	$('#recipes .recipeList').append('<li><a href="#recipeItem" onclick="GetIndex(this)" class="listItem"><img src="'+ picURL +'" style="width:90px; height:60px;"><p style="margin-top: -4px;font-size: 14px; font-weight: bold; white-space: normal !important">'+ recipeName +'</p></a></li>');
           	 	$('#recipes .recipeList').listview("refresh");
        	}
        	recipeObjList.push(data);
    	});	
  	});
  	return;
}

function GetIndex(sender)
{   
    var aElements = sender.parentNode.parentNode.getElementsByTagName("a");
    var aElementsLength = aElements.length;

    var index;
    for (var i = 0; i < aElementsLength; i++)
    {
        if (aElements[i] === sender) //this condition is never true
        {
            clickedIndex = i;
            return clickedIndex;
        }
    }
}
