/* starting script for intro page */
$(document).on('pageinit', '#intropage', function(){
	$('#startbtn').click(function(){   
		$.mobile.changePage('#search');  
        return false;   
        });  
});

/* starting script for pantry page */
$(document).on('pageinit','#search',function() {
	$("#searchButton").click(searchRecipes);
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
});


/* global array to store the recipes */
var recipeList = [];
var recipeObjList = new Array(10);

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

function searchRecipes() {
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
                    recipes += (data.matches[i].recipeName + "\n");
                    recipeList.push(data.matches[i]);
                }
            }
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

var temp_url = new Array(10);
   
/* recipe class */
function recipe() {
        this.recipeName = '';
        this.id = '';
        this.picURL = '';
        this.recipeURL = '';
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

				

function recipe(recipeName, recipeID, picURL, recipeURL) {
	this.recipeName = recipeName;
	this.id = recipeID;
	this.picURL = picURL;
	this.recipeURL = recipeURL;
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
$(document).on('pageinit', '#recipeList', populateRecipeList);

$(document).on('pageinit', '#recipeList', function() {
		populateRecipeList();
		//createList();
});
	
function createList()  {
	var len = recipeObjList.length;
    for (var i=0; i<len ;i++)
    { 
        console.log();
        $('#recipes .recipeList').append('<li><a href="'+ recipeObjList[i].recipeURL+'"><img src="'+ recipeObjList[i].picURL +'"><h2>'+ recipeObjList[i].recipeName+'</h2></a></li>');
    }
    $('#recipes .recipeList').listview("refresh");
}



function populateRecipeList() {
	var APIBase = "http://api.yummly.com/v1/api/recipe/";
    var appID = "?_app_id=" + yummlyAPIKeys.getId() + "&";
    var appKey = "_app_key=" + yummlyAPIKeys.getApiKey() + "&q=";
    var callback = "&callback=?";
    //$('#recipes .recipeList li').remove(); //clear the currrent list, may not be necessary
	$.each(recipeList, function(index, obj) {
		var picURL;
		if (obj.smallImageUrls.length !== 0) {
			picURL = obj.smallImageUrls[0]; 
		} else {
			picURL = "img/not_available.jpg";
		}

        
		recipeObjList.push(new recipe()); 
		recipeObjList[index].recipeName =  obj.recipeName;
		recipeObjList[index].id = obj.id;
		recipeObjList[index].picURL = picUrl;
		getRecipeURL(obj.id, index, picUrl, obj.recipeName);

  	});
  	return 0;
}



		var recipeName =  obj.recipeName;
		var recipeID = obj.id;
    	var queryURL = APIBase + recipeID + appID + appKey + callback;
    	$.getJSON(queryURL, function(data){
        	if(data && data.source){
            	var recipeURL = data.source.sourceRecipeUrl;
            	$('#recipes .recipeList').append('<li><a href="'+ recipeURL +'"><img src="'+ picURL +'"><h2>'+ recipeName +'</h2></a></li>');
           	 	$('#recipes .recipeList').listview("refresh");
        	}
        	recipeObjList[index] = new recipe(recipeName, recipeID, picURL, recipeURL);
    	});	
  	});
  	return;
}

