module.exports = function(Portfolio) {

	Portfolio.addRemCash = function(id, amount, cb) {
		Portfolio.findById(id, function(err, portfolio) {
			portfolio.cash = Math.round(100 * portfolio.cash + 100 * amount) / 100;
			portfolio.save();
			if (cb) cb(null, portfolio.cash);
		})
	}

	Portfolio.remoteMethod(
		'addRemCash', 
		{
			accepts: [{arg: 'id', type: 'number'}, {arg: 'amount', type: 'number'}],
			returns: {arg: 'balance', type: 'number'}
		}
	);

};
