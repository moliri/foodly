var TEST = "";
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
        
        //registering callbacks
        $(document).ready(function () {$("#searchButton").click(searchRecipes)});
        
        function searchRecipes() {
            var foods = getIngredients(["fish","butter"]);
            var callback = "&callback=?"
            var apiURL = "http://api.yummly.com/v1/api/recipes?_app_id=530cbd64&_app_key=7ddb19332c3de6a14405af6bffae0aad&q="
            var queryString = apiURL + foods + callback;
            
            $.getJSON(queryString, function(data){
                TEST = data;
                var recipes = '';
                for(var i = 0; i < 10; i++){
                    recipes += (data.matches[i].recipeName + "\n");
                }
                alert(recipes);
                
            });
            
        }