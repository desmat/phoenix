var request = require('request');
var _ = require('underscore');
var Quotes = require('quotes');

module.exports = function(Portfolio) {

	Portfolio.addRemCash = function(id, amount, cb) {
		Portfolio.findById(id, function(err, portfolio) {
			portfolio.cash = Math.round(100 * portfolio.cash + 100 * amount) / 100;
			portfolio.save(function() {
				if (cb) cb(null, portfolio.cash);
			});
		})
	}

	Portfolio.remoteMethod(
		'addRemCash', 
		{
			accepts: [{arg: 'id', type: 'number'}, {arg: 'amount', type: 'number'}],
			returns: {arg: 'balance', type: 'number'}
		}
	);

	Portfolio.value = function(id, cb) {
		Portfolio.findById(id, function(err, portfolio) {
			Portfolio.app.models.PortfolioHolding.find({where: {portfolioId: id}}, function(err, portfolioHoldings) {

				if (!portfolioHoldings || portfolioHoldings.length == 0) { if (cb) cb(null, portfolio.value); return; }

				Quotes.getQuotes(_.pluck(portfolioHoldings, 'ticker'), function(err, quotes) {
					if (err) { console.error(err); if (cb) cb(err); return; };

					var tickerPrices = [];
					for (var i = 0; i < quotes.length; i++) {
						tickerPrices[quotes[i].Symbol] = parseFloat(quotes[i].LastTradePriceOnly);
					}

					portfolio.value = portfolio.cash;
					for (var i = 0; i < portfolioHoldings.length; i++) {
						portfolio.value = Math.round(100 * portfolio.value + 100 * portfolioHoldings[i].shares * tickerPrices[portfolioHoldings[i].ticker]) / 100;
					}

					portfolio.save(function() { 
						if (cb) cb(null, portfolio.value);
					}); 
				});		
			});
		});
	}

	Portfolio.remoteMethod(
		'value', 
		{
			http: {path: '/:id/value', verb: 'get'},
			accepts: [{arg: 'id', type: 'number'}],
			returns: {arg: 'value', type: 'number'}
		}
	);

};
