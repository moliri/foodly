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
	var callback = "&callback=?"
	var apiURL = "http://api.yummly.com/v1/api/recipes?_app_id=b8a751c0&_app_key=007d17e544de591f7b7bc27ad695f2cd&q="
	var queryString = apiURL + foods + callback;
            
	$.getJSON(queryString, function(data){
		var recipes = "";
		for(var i = 0; i < 10; i++){
			recipes += (data.matches[i].recipeName + "\n");
			recipeList.push(data.matches[i].recipeName);
		}
		$.mobile.changePage('#recipeList');
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
				
function updateSearch() {
	var len = $('#cblist').length;
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
	$.each(recipeList, function(index, userName) {
		$('#recipes .recipeList').append('<li><a href="#">'+userName+'</a></li>');
  	});
  	$('#recipes .recipeList').listview("refresh");
}