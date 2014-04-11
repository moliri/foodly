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
});

/* global array to store the recipes */
var recipeList = [];

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
	var id = "2daedd08";
	var key = "9660aeb80292c3128c93bd8e904e1490";
	var requestInfo = "_app_id=" + id + "&_app_key=" + key + "&q=";
	var callback = "&callback=?"
	var queryString = apiURL + requestInfo + foods + callback;
	
	$(function() {	
	/*looks like we can't use ajax because it doesn't use cross origin domain requests - looking into it*/
		$.ajax(queryString, 
		{
			statusCode: {
			409: function() {
				alert(queryString);
				alert(statusCode);
				id = "2daedd08"
				key = "9660aeb80292c3128c93bd8e904e1490"
				alert('An API Call error occured, please try again.');
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
            alert("No recipes found. Please try unchecking some ingredients.");
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
                       
    	$('<input />', { type: 'checkbox', id: 'cb'+id, value: name, checked:"checked" }).appendTo(container);
		$('<label />', { 'for': 'cb'+id, text: name }).appendTo(container);
		$('<br />').appendTo(container);
	}
}
    
// makes an API call when users click on individual recipes from the recipe list screen
// recipeID should be a string (although js will probably stringify it)
function getRecipeURL(recipeID) {
    var APIBase = "http://api.yummly.com/v1/api/recipe/";
    var appID = "?_app_id=b8a751c0&";
    var appKey = "_app_key=007d17e544de591f7b7bc27ad695f2cd&q=";
    var callback = "&callback=?";
    var queryURL = APIBase + recipeID + appID + appKey + callback;
    
    $.getJSON(queryString, function(data){
        if(data && data.source){
            return data.source.sourceRecipeUrl;
        }
    });
}

				
function updateSearch() {
	
    var len = $('#cblist').children().length; // divide by 3 since the size of each child is 3.
    
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

function populateRecipeList() {
	$('#recipes .recipeList li').remove();
	$.each(recipeList, function(index, obj) {
		var picUrl;
		if (obj.smallImageUrls.length !== 0) {
			picUrl = obj.smallImageUrls[0]; 
		} else {
			picUrl = "img/not_available.jpg";
		}
		var recipeName =  obj.recipeName;
		$('#recipes .recipeList').append('<li><a href="#"><img src="'+ picUrl +'"><h2>'+ recipeName+'</h2></a></li>');
  	});
  	$('#recipes .recipeList').listview("refresh");
}