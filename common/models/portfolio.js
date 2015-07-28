var request = require('request');
var _ = require('underscore');
var Quotes = require('quotes');

module.exports = function(Portfolio) {

	Portfolio.addRemCash = function(id, amount, cb) {
		Portfolio.findById(id, function(err, portfolio) {		
			if (!portfolio) {
				if (cb) cb(new Error("2Portfolio not found: " + id));
				return;
			}	

			portfolio.cash = Math.round(100 * portfolio.cash + 100 * amount) / 100;

			if (portfolio.cash < 0) {
				if (cb) cb(new Error("Insufficient funds"));
				return;
			}

			portfolio.save(function() {
				if (cb) cb(null, portfolio.cash);
				return;
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

	Portfolio.buy = function(id, ticker, count, cb) {
		Portfolio.findById(id, function(err, portfolio) {
			if (!portfolio) {
				err = new Error("Portfolio not found: " + id)
				console.error(err);
				if (cb) cb(err);
				return;
			}	

			Quotes.getQuote(ticker, function(err, quote) {
				if (err) {
					if (cb) cb(err);
					return;
				}

				if (!quote) {
					if (cb) cb(new Error("Ticker not found: " + ticker));
					return;
				}

				var name =  quote.Name;
				var price = parseFloat(quote.LastTradePriceOnly);
				var cost = Math.round(100 * price * count) / 100;

				Portfolio.addRemCash(id, -cost, function(err, portfolio) {
					if (err) {
						console.error(err);
						if (cb) cb(err);
						return;
					}

					Portfolio.app.models.PortfolioHolding.findOne({where: {portfolioId: id, ticker: ticker}}, function(err, portfolioHolding) {
						if (!portfolioHolding) {
							Portfolio.app.models.PortfolioHolding.create({
								portfolioId: id,
								name: name,
								ticker: ticker,
								shares: parseInt(count), 
								cost: cost
							}, function(err, portfolioHolding) {
								if (cb) cb(err, 1); 
								return;
							});
						}
						else {
							portfolioHolding.shares = Math.round(parseInt(portfolioHolding.shares) + parseInt(count));
							portfolioHolding.cost = Math.round(100 * portfolioHolding.cost + 100 * cost) / 100;
							portfolioHolding.save(function(err) {
								if (cb) cb(err, 0); 
								return;
							});
						}
					});
				});
			});
		});
	}

	Portfolio.remoteMethod(
		'buy', 
		{
			http: {path: '/:id/buy', verb: 'put'},
			accepts: [{arg: 'id', type: 'number'}, {arg: 'ticker', type: 'string'}, {arg: 'count', type: 'number'}],
			returns: {arg: 'value', type: 'number'}
		}
	);

	Portfolio.sell = function(id, ticker, count, cb) {
		Portfolio.findById(id, function(err, portfolio) {
			if (!portfolio) {
				err = new Error("Portfolio not found: " + id)
				console.error(err);
				if (cb) cb(err);
				return;
			}	

			Quotes.getQuote(ticker, function(err, quote) {
				if (err) {
					if (cb) cb(err);
					return;
				}

				if (!quote) {
					if (cb) cb(new Error("Ticker not found: " + ticker));
					return;
				}

				var name =  quote.Name;
				var price = parseFloat(quote.LastTradePriceOnly);
				var cost = Math.round(100 * price * count) / 100;

				Portfolio.addRemCash(id, cost, function(err, portfolio) {
					if (err) {
						console.error(err);
						if (cb) cb(err);
						return;
					}

					Portfolio.app.models.PortfolioHolding.findOne({where: {portfolioId: id, ticker: ticker}}, function(err, portfolioHolding) {
						if (!portfolioHolding) {
							if (cb) cb(new Error ("Holding not found: " + ticker), 0); 
							return;							
						}
						else {
							if (count > portfolioHolding.shares) {
								if (cb) cb(new Error ("Not enough shares: " + ticker), 0); 
								return;							
							}
							else if (count == portfolioHolding.shares) {
								Portfolio.app.models.PortfolioHolding.destroyById(portfolioHolding.id, function(err) {
									if (err && cb) cb(new Error ("Unable to delete holding for ticker: " + ticker), 0); 
									else if (cb) cb(null, 0); 
									return;							
								});
							}
							else {
								portfolioHolding.shares = Math.round(parseInt(portfolioHolding.shares) - parseInt(count));
								portfolioHolding.cost = Math.round(100 * portfolioHolding.cost - cost * 100) / 100;
								portfolioHolding.save(function(err) {
									if (cb) cb(err, 0); 
									return;
								});
							}
						}
					});
				});
			});
		});
	}

	Portfolio.remoteMethod(
		'sell', 
		{
			http: {path: '/:id/sell', verb: 'put'},
			accepts: [{arg: 'id', type: 'number'}, {arg: 'ticker', type: 'string'}, {arg: 'count', type: 'number'}],
			returns: {arg: 'value', type: 'number'}
		}
	);
};
