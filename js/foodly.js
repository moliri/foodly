/* user id */
var user_id;
var clickedIndex;

/* starting script for intro page */
$(document).on('pageinit', '#intropage', function(){
	$('#startbtn').click(function(){ 
		user_id = $('#userID').val();
		$.mobile.changePage('#search');  
        return false;   
        }); 
});

/* starting script for pantry page */
$(document).on('pageinit','#search',function() {
	$("#searchButton").click(function () {
        $('#recipes .recipeList').empty();
        searchRecipes(populateRecipeList);
    });
	$('#btnSave').click(function() {
						addCheckbox($('#newItem').val());
						$('#newItem').val('');
						updateSearch();
					});
    $('#newItem').bind('keypress', function (e) {
        if(e.keyCode === 13){
            addCheckbox($('#newItem').val());
			$('#newItem').val('');
			updateSearch();
        }
    });
    $('#favList').click(function() {
    	data = backendGetRecipe(user_id, fillRecipeListArr);  
        $.mobile.changePage('#recipeList');
    });
});

function fillRecipeListArr(data, callback) {
        recipeList = [];   
        $.each(data, function (index, obj) {
            var name = obj.attributes.recipeName;
            var id = obj.attributes.recipeID;
            var picURL = obj.attributes.picURL;
            recipeList.push(new prelim_recipe(name, id, picURL));
        });
        callback();
        return;
}

// Handling browser back button

$(window).on("navigate", function (event, data) {
  var direction = data.state.direction;
  
  if (direction === 'back') {
    var page = $.mobile.activePage;
    
    if(page.is('#recipeItem')){
        $('#recipes .recipeList').empty();
        populateRecipeList();
    }
    
    if(page.is('#recipeList')){
        recipeList = [];
        $('#recipes .recipeList').empty();
    }
    
  }
  
});

/* global array to store the recipes */
var recipeList = new Array();
var recipeObjList = new Array();

/* global object to store API keys & related logic */
var yummlyAPIKeys = {
    _keyIndex : 0, // do not directly access members beginning with an underscore (they're private).
    _keyArray : ["9660aeb80292c3128c93bd8e904e1490","007d17e544de591f7b7bc27ad695f2cd"],
    _idArray : ["2daedd08","b8a751c0"],
    
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

//takes a javascript array of ingredients right now (may need to change for interface requirements?)
//returns the API search term string
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
    
	var foods = getIngredients(ingreds);
    
	var apiURL = "http://api.yummly.com/v1/api/recipes?"
	var queryString = apiURL + yummlyAPIKeys.getRequestString(foods);
	
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

function addCheckbox(name) {
	if(name !== ""){
		var container = $('#cblist');
		var inputs = container.find('input');
		var id = inputs.length+1;

		$('<input />', { type: 'checkbox', id: 'cb'+id, value: name, checked:"checked", class:"custom" }).appendTo(container);
		$('<label />', { 'for': 'cb'+id, text: name }).appendTo(container);
		$('<br />').appendTo(container);
	}
	
}
   
/* recipe class */
function recipe() {
        this.recipeName = '';
        this.id = '';
        this.picURL = '';
        this.recipeURL = '';
        this.ingredientLines = '';
        this.totalTimeInSeconds = '';
        this.numberOfServings = '';
}   


function recipe(recipeName, recipeID, picURL, recipeURL, ingredientLines, totalTimeInSeconds, numberOfServings) {
    this.recipeName = recipeName;
    this.id = recipeID;
    this.picURL = picURL;
    this.recipeURL = recipeURL;
    this.ingredientLines = ingredientLines;
    this.totalTimeInSeconds = totalTimeInSeconds;
    this.numberOfServings = numberOfServings;
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

// makes an API call when users click on individual recipes from the recipe list screen
// recipeID should be a string (although js will probably stringify it)
function getRecipeURL(recipeID, index, picURL, recipeName) {
    var APIBase = "http://api.yummly.com/v1/api/recipe/";
    var appID = "?_app_id=" + yummlyAPIKeys.getId() + "&";
    var appKey = "_app_key=" + yummlyAPIKeys.getApiKey() + "&q=";
    var callback = "&callback=?";
    var queryURL = APIBase + recipeID + appID + appKey + callback;
    
    $.getJSON(queryString, function(data){
        if(data && data.source){
        
            recipeObjList[index].recipeURL = data.source.sourceRecipeUrl;
            temp_url[index] = data.source.sourceRecipeUrl;
            $('#recipes .recipeList').append('<li><a href="'+ data.source.sourceRecipeUrl +'"><img src="'+ picURL +'"><h2>'+ recipeName +'</h2></a></li>');
            $('#recipes .recipeList').listview("refresh");

        }
    });
}


function updateSearch() {
	
    var len = $('#cblist').children().length; 
    
	var myIngredients=[];
		for (var i=0; i<=len; i++) {
			var isChecked = $('#cb'+i).is(':checked');
			if (isChecked) {
				myIngredients.push($('#cb'+i).next("label").text());
				len++;
			} else {
				//updateSearch(); 
			}
		}
		return myIngredients;
}


/* starting script for recipe list page */
$(document).on('pageinit', '#recipeList', function () {
		clickedIndex = -1;
        $('#recipes .recipeList .listItem').click(updateRecipeItem);

})

$(document).on('pagebeforeshow', '#recipeItem', updateRecipeItem);

function updateRecipeItem() {
    var obj = recipeObjList[clickedIndex];
    alert("in update " + clickedIndex);
    $('#recipeTitle').text(obj.recipeName);
    $('#recipeItem .test').append(recipeObjList[clickedIndex].ingredientLines);
    $('#favorite').click(function () {
        backendAddRecipe(user_id, obj.id, obj.recipeName, obj.picURL);
    });
}



/*
function createList()  {
	var len = recipeObjList.length;
	for (var i=0; i<len ;i++)
	{ 
		console.log();
		$('#recipes .recipeList').append('<li><a href="'+ recipeObjList[i].recipeURL+'"><img src="'+ recipeObjList[i].picURL +'"><h4>'+ recipeObjList[i].recipeName+'</h4></a></li>');
	}
	$('#recipes .recipeList').listview("refresh");
}
*/


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
        		var ingredientLines = data.ingredientLines;
                var totalTimeInSeconds = data.totalTimeInSeconds;
                var numberOfServings = data.numberOfServings;
            	var recipeURL = data.source.sourceRecipeUrl;
            	$('#recipes .recipeList').append('<li><a href="#recipeItem" onclick="GetIndex(this)" class="listItem"><img src="'+ picURL +'"><p style="margin-top: -4px;font-size: 14px; font-weight: bold; white-space: normal !important">'+ recipeName +'</p></a></li>');
           	 	$('#recipes .recipeList').listview("refresh");
        	}
        	recipeObjList.push(new recipe(recipeName, recipeID, picURL, recipeURL, ingredientLines, totalTimeInSeconds, numberOfServings));
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
