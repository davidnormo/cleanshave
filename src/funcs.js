/* helper functions */

/**
 * Escapes & " ' < and >
 * If input isn't string, returns input
 * 
 * @param  {String|Mixed} input The input to escape
 * @return {String} The cleaned string
 */
var escapeHTML = function (input){ 
	if(typeof input!=="string") return input;

	return input.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/["]/g, "&quot;")
		.replace(/'/g, "&#039;"); 
}

/**
 * Given an Object obj, checks if a key exists
 * @param  {Object} obj Object to check
 * @param  {Array} path Series of keys to check within nested objects
 * @return {Mixed} If path cannot be resolved returns empty string else the value
 */
var resolveKey = function (obj, path){
	var target = obj, key = '';

	for(var i = 0; i < path.length; i++){
  		key = path[i];
  		if(target[key] === undefined){
    		return '';
  		}
  		target = target[key];
	}
 	return target;
}