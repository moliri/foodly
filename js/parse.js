
Parse.initialize("p3WFau7rwXnsUVQKNOhSbuztub7D8fe4q2unlAm9", "lWi3UcUdbfQRF9P9H1oF1idIW6LhUq7dFXck5RM1");

function createObject(userID,recipeID,recipeName) {
                
var table = Parse.Object.extend("Recipe");
var RecipeTable = new table();

RecipeTable.set("userID", userID);
RecipeTable.set("recipeID", recipeID);
RecipeTable.set("recipeName",recipeName);
 
RecipeTable.save(null, {
  success: function(RecipeTable) {
    // Execute any logic that should take place after the object is saved.
    alert('New object created with objectId: ' + RecipeTable.id);
  },
  error: function(RecipeTable, error) {
    
    alert('Failed to create new object, with error code: ' + error.description);
  }
});

}

function getObject(userID,list){
	var table = Parse.Object.extend("Recipe");
	var query = new Parse.Query(table);
	query.equalTo("userID", userID);
	query.find({
  success: function(results) {
    // Do something with the returned Parse.Object values
    for (var i = 0; i < results.length; i++) { 
    var object = results[i];
    list[i] = object.get('recipeName');
    //alert(object.id+'---'+object.get('recipeName'))
  }
    console.log(list);
    return list;
  },
  error: function(error) {
    alert("Error: " + error.code + " " + error.message);
  }
});
  return list;
}