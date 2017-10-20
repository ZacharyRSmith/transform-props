var mongoose = require('mongoose');

var transformProps = require('.');

var SubDocSchema = new mongoose.Schema({
	foo: String
});

var ModelSchema = new mongoose.Schema({
	subDoc: SubDocSchema
});

var Model = mongoose.model('Model', ModelSchema);

describe('transformProps', () => {
	var castToString = prop => String(prop);
	let doc;

	beforeEach(() => {
		doc = new Model({
			subDoc: { foo: 'bar' }
		}).toObject();
	});

	it('throws a TypeError when passed a bad @object', () => {
		var badArgsSet = new Set([
			['notAnObject', castToString, '_id'],
			[doc, 'notAFunction', '_id'],
			[doc, castToString, () => 'bad @propKeys']
		]);

		badArgsSet.forEach(badArgs => {
			// "Note: You must wrap the code in a function, otherwise the error will not be caught and the assertion will fail."
			// https://facebook.github.io/jest/docs/en/expect.html#tothrowerror
			var act = () => transformProps(...badArgs);

			expect(act).toThrow(TypeError);
		});
	});

	it('can convert `_id`s to string', () => {
		['_id', ['_id']].forEach(propKeysArg => { // Test that @propKeys of type str and single-item array are ok.
			transformProps(doc, castToString, propKeysArg);

			expect(typeof doc._id).toBe('string');
			expect(typeof doc.subDoc._id).toBe('string');
		});
	});

	it('can use multiple transformers', () => {
		var appendHello = str => str + 'Hello!';

		transformProps(doc, [castToString, appendHello], '_id');

		expect(doc._id.substr(-6)).toBe('Hello!');
		expect(doc.subDoc._id.substr(-6)).toBe('Hello!');
	});

	it('can transform multiple props', () => {
		var appendHello = str => str + 'Hello!';

		transformProps(doc, [castToString, appendHello], ['_id', 'foo']);

		expect(doc._id.substr(-6)).toBe('Hello!');
		expect(doc.subDoc._id.substr(-6)).toBe('Hello!');
		expect(doc.subDoc.foo).toBe('barHello!');
	});
});
