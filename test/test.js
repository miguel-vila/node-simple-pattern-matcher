var assert = require("assert");
var Matcher = require("../index.js");
var _ = true;

describe('PatternMatcher', function(){
	describe('#parsePattern', function(){
		it('should parse an empty json object as a pattern', function() {
			var matcher = new Matcher({});
			assert.deepEqual({}, matcher.parsePattern("{}") );			
		});
		it('should parse a "undefined" as a pattern', function() {
			var matcher = new Matcher({});
			assert.deepEqual(undefined, matcher.parsePattern("undefined") );			
		});
		it('should parse a simple json pattern', function(){
			var matcher = new Matcher({});
			assert.deepEqual({a: true, b: true, c: true}, matcher.parsePattern("{a:_ , b:_ , c:_}") );
		});
		it('should parse a json pattern with nested jsons', function(){
			var matcher = new Matcher({});
			assert.deepEqual(
				{a: true, b: { c: true, d: { e: true, f: { g: true }}}, h: { i: true}}, 
				matcher.parsePattern("{ a : _ , b : { c : _ , d : { e : _ , f : { g : _ } } } , h : { i : _ } }") );
		});
		it('should parse a json pattern no matter the whitespace', function(){
			var matcher = new Matcher({});
			var pattern = "{\
						a : _ ,\
						b : { \
								c : _ ,\
								d : { \
										e : _ ,\
										f : { \
												g : _ \
											} \
									} \
							} ,\
						h : { \
								i : _ \
							} \
					}";
			assert.deepEqual({a: true, b: { c: true, d: { e: true, f: { g: true }}}, h: { i: true}}, matcher.parsePattern(pattern) );
		});
	});
	describe('#validatePattern', function(){
		it('should validate an undefined object', function(){
			var object = undefined;
			var matcher = new Matcher(object);
			assert(matcher.validatePattern(undefined,object));
		});
		it('should validate an empty object', function(){
			var object = {};
			var matcher = new Matcher(object);
			assert(matcher.validatePattern({},object));
		});

		it('should validate a simple correct pattern', function(){
			var object = {a: 1, b: 2, c: 3};
			var matcher = new Matcher(object);
			assert(matcher.validatePattern({a:_,b:_,c:_},object));
		});
		it('should validate a partially correct pattern', function(){
			var object = {a: 1, b: 2, c: 3};
			var matcher = new Matcher(object);
			assert(matcher.validatePattern({a:_,c:_},object));
		});
		it('should invalidate a simple incorrect pattern', function(){
			var object = {a: 1, b: 2, c: 3};
			var matcher = new Matcher(object);
			assert(!matcher.validatePattern({d:_,e:_},object));
		});
		it('should invalidate a partially incorrect pattern', function(){
			var object = {a: 1, b: 2, c: 3};
			var matcher = new Matcher(object);
			assert(!matcher.validatePattern({c:_,d:_,e:_},object));
		});
		
		it('should validate a complex correct pattern', function(){
			var object = {a: 1, b: { c: 4, d: { e: 5 } , f: 6 }, g: { h: 7, i: 8}};
			var matcher = new Matcher(object);
			assert(matcher.validatePattern({a:_,b:{ d:{e:_}, f:_},g:{h:_}},object));
		});
		it('should invalidate a complex incorrect pattern', function(){
			var object = {a: 1, b: { c: 4, d: { e: 5 } , f: 6 }, g: { h: 7, i: 8}};
			var matcher = new Matcher(object);
			assert(!matcher.validatePattern({x:_,y:{ f: _, g:{ h:_ } } },object));
		});
		it('should invalidate a partially incorrect complex pattern', function(){
			var object = {a: 1, b: { c: 4, d: { e: 5 } , f: 6 }, g: { h: 7, i: 8}};
			var matcher = new Matcher(object);
			assert(!matcher.validatePattern({a:_,b:{ d:{e:_}, f:_},x:_,y:{ f: _, g:{ h:_ } } },object));
		});
	});
	describe('#case', function(){
		it('should match a correct case clause', function () {
			var object = {a: 1, b: { c: 4, d: { e: 5 } , f: 6 }, g: { h: 7, i: 8}};
			var matcher = new Matcher(object);
			var called = false;
			matcher.
			case('{a:_,b:{ d:{e:_}, f:_},g:{h:_}}',function(a,b,g){
				assert.deepEqual(object.a, a);
				assert.deepEqual(object.b, b);
				assert.deepEqual(object.g, g);
				called = true;
			});
			assert(called,'The matching case was not called');
		});
		it('should match the first correct case clause', function () {
			var object = {a: 1, b: { c: 4, d: { e: 5 } , f: 6 }, g: { h: 7, i: 8}};
			var matcher = new Matcher(object);
			var correctlyNotCalled1 = true;
			var correctlyNotCalled2 = true;
			var correctlyNotCalled3 = true;
			var correctlyCalled = false;
			matcher.
				case('{a:_,b:{ d:{e:_}, f:_},g:{h:_},x:_,z:_}',function(){
					correctlyNotCalled1 = false;
				}).
				case('{a:_,b:{ d:{e:_}, f:_},g:{h:_}}',function(a,b,g){
					assert.deepEqual(object.a, a);
					assert.deepEqual(object.b, b);
					assert.deepEqual(object.g, g);
					correctlyCalled = true;
				}).
				case('{a:_,b:_}',function(a,b){
					correctlyNotCalled2 = false;
				}).
				case('{a:_,b:_,z:_}',function(a,b){
					correctlyNotCalled3 = false;
				});
			assert(correctlyNotCalled1,'A first incorrect case was incorrectly called');
			assert(correctlyCalled,'The first matching case was not called');
			assert(correctlyNotCalled2,'A later correct case was incorrectly called');
			assert(correctlyNotCalled3,'A later incorrect case was incorrectly called');
		});
	});
	describe('#done', function(){
		it('should return the computed value by the callback', function () {
			var object = {a: 1, b: { c: 4, d: { e: 5 } , f: 6 }, g: { h: 7, i: 8}};
			var matcher = new Matcher(object);
			var correctlyNotCalled1 = true;
			var correctlyNotCalled2 = true;
			var correctlyNotCalled3 = true;
			var correctlyCalled = false;
			var result = matcher.
				case('{a:_,b:{ d:{e:_}, f:_},g:{h:_},x:_,z:_}',function(){
					correctlyNotCalled1 = false;
					return 1;
				}).
				case('{a:_,b:{ d:{e:_}, f:_},g:{h:_}}',function(a,b,g){
					correctlyCalled = true;
					return 2;
				}).
				case('{a:_,b:_}',function(a,b){
					correctlyNotCalled2 = false;
					return 3;
				}).
				case('{a:_,b:_,z:_}',function(a,b){
					correctlyNotCalled3 = false;
					return 4;
				}).done();
			assert.equal(2,result,"The incorrect function was called");
			assert(correctlyNotCalled1,'A first incorrect case was incorrectly called');
			assert(correctlyCalled,'The first matching case was not called');
			assert(correctlyNotCalled2,'A later correct case was incorrectly called');
			assert(correctlyNotCalled3,'A later incorrect case was incorrectly called');
		});
	});
})