var localeval = require('localeval');

// Private constructor:
function Matcher(object) {
	var self = this;
	this.object = object;
}

Matcher.prototype.parsePattern = function(pattern) {
	if(!pattern) {
		throw new Error("Pattern Parsing Error: Null pattern");
	}
	pattern = pattern.trim();
	if(pattern.length === 0) {
		throw new Error("Pattern Parsing Error: Empty pattern");
	}
	if(pattern === 'undefined') {
		return undefined;
	}
	if(pattern[0] !== '{' || pattern[pattern.length-1] !== '}') {
		throw new Error("Pattern Parsing Error: it must start with { and end with }");
	}
	var patternObject = localeval('('+pattern+')',{ _ :true});
	return patternObject;
};

Matcher.prototype.validatePattern = function(patternObject, object) {
	if(object === undefined) {
		return patternObject === undefined;
	}
	if(Object.keys(object).length === 0) {
		return Object.keys(patternObject).length === 0;
	}
	for(var varName in patternObject) {
		if(typeof patternObject[varName] === 'boolean' && object[varName] === undefined) {
			return false;
		} else if(typeof patternObject[varName] === 'object' && object[varName] !== undefined) {
			var subPatternValidation = this.validatePattern(patternObject[varName], object[varName]);
			if(!subPatternValidation) {
				return false;
			}
		}
	}
	return true;
};

Matcher.prototype.case = function(pattern, ifPatternMatchesCallback) {
	if(typeof pattern !== 'string') {
		throw new Error('The pattern must be a string');
	}
	if(!this.matched) { 
		var patternObject =  this.parsePattern(pattern);
		var object = this.object;
		if(this.validatePattern(patternObject, object)) {
			var theArgs = Object.keys(object).map(function(k){return object[k];});
			var matcher = new Matcher(object);
			matcher.value = ifPatternMatchesCallback.apply(null, theArgs);
			matcher.matched = true;
			return matcher;
		}
	}
	return this;
};

Matcher.prototype.done = function () {
	if(!this.matched) {
		throw new Error("Match error: No pattern matched the object");
	}
	return this.value;
};

module.exports = Matcher;