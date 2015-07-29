var request = require('request');
var _ = require('underscore');
var Quotes = require('quotes');

module.exports = function(Portfolio) {

	Portfolio.value = function(id, cb) {
		//load up our portfolio
		Portfolio.findById(id, function(err, portfolio) {
			if (err) { console.error(err); if (cb) cb(err); return; };

			portfolio.holdings = [];
			portfolio.cashCalculated = portfolio.cash;

			//load up latest checkpoint
			Portfolio.app.models.PortfolioCheckpoint.findOne({where: {portfolioId: id}, order: 'id DESC', limit: 1}, function(err, portfolioCheckpoint) {
				if (err) { console.error(err); if (cb) cb(err); return; };

				var checkpointTransactionId = 0;

				if (portfolioCheckpoint) {
					checkpointTransactionId = portfolioCheckpoint.transactionId;
					portfolio.cashCalculated = portfolioCheckpoint.cash;
				}

				//load up checkpoint holdings
				Portfolio.app.models.PortfolioHolding.find({where: {portfolioId: id, checkpointTransactionId: checkpointTransactionId}}, function(err, portfolioHoldings) {
					if (err) { console.error(err); if (cb) cb(err); return; };

					_.each(portfolioHoldings, function(portfolioHolding) {
						if (portfolioHolding.shares > 0) portfolio.holdings.push(portfolioHolding);
					});

					//process any transactions newer than checkpoint
					Portfolio.app.models.PortfolioTransaction.findOne({where: {portfolioId: id, rejected: false, id: {gt: checkpointTransactionId}}, order: 'id DESC', limit: 1}, function(err, maxPortfolioTransaction) {

						var maxPortfolioTransactionId = Number.MAX_VALUE;
						if (maxPortfolioTransaction) {
							maxPortfolioTransactionId = maxPortfolioTransaction.id;
						}

						Portfolio.app.models.PortfolioTransaction.find({where: {portfolioId: id, rejected: false, id: {gt: checkpointTransactionId, lt: maxPortfolioTransactionId + 1}}, order: 'id ASC'}, function(err, portfolioTransactions) {
							if (err) { console.error(err); if (cb) cb(err); return; };

							_.each(portfolioTransactions, function(portfolioTransaction) {
			
								checkpointTransactionId = portfolioTransaction.id;
								var portfolioHolding = _.findWhere(portfolio.holdings, {ticker: portfolioTransaction.ticker});

								if (!portfolioHolding) {
									portfolioHolding = {
										portfolioId: id,
										ticker: portfolioTransaction.ticker, 
										name: null,
										shares: 0, 
										cost: 0,
									};	
									portfolio.holdings.push(portfolioHolding);
								}

								var updatedCash = Math.round(100 * portfolio.cashCalculated - 100 * portfolioTransaction.cost * (portfolioTransaction.count < 0 ? -1 : 1)) / 100;
								var updatedShares = Math.round(parseInt(portfolioHolding.shares) + parseInt(portfolioTransaction.count));
								var updatedCost = Math.round(100 * portfolioHolding.cost + 100 * portfolioTransaction.cost * (portfolioTransaction.count < 0 ? -1 : 1)) / 100;

								if (updatedCash < 0) {
									console.error("Rejecting transaction #" + portfolioTransaction.id + ": Insufficient funds");
									portfolioTransaction.rejected = true;
									portfolioTransaction.save();
								}
								if (updatedShares < 0) {
									console.error("Rejecting transaction #" + portfolioTransaction.id + ": Negative share count");
									portfolioTransaction.rejected = true;
									portfolioTransaction.save();
								}
								// if (updatedCost < 0) {
								// 	console.error("Rejecting transaction #" + portfolioTransaction.id + ": Negative holding cost");
								// 	portfolioTransaction.rejected = true;
								// 	portfolioTransaction.save();
								// }
								else {
									portfolioHolding.shares = updatedShares;
									portfolioHolding.cost = updatedCost;
									portfolio.cashCalculated = updatedCash;

									if (updatedShares == 0) {
										portfolio.holdings = _.without(portfolio.holdings, portfolioHolding);
									}
								}
							});

							portfolio.valueCalculated = portfolio.cashCalculated;

							Quotes.getQuotes(_.pluck(portfolio.holdings, 'ticker'), function(err, quotes) {

								if (err) { console.error(err); if (cb) cb(err); return; };

								_.each(quotes, function(quote) {
									var portfolioHolding = _.findWhere(portfolio.holdings, {ticker: quote.Symbol}); 							
									if (portfolioHolding) {
										// portfolioHolding = portfolioHolding[0];
										portfolioHolding.name = quote.Name;
										portfolioHolding.price = quote.LastTradePriceOnly;
										portfolio.valueCalculated = Math.round(100 * portfolio.valueCalculated + 100 * portfolioHolding.shares * portfolioHolding.price) / 100;
									}
								});

								//record check point only if we had transactions
								if (portfolioTransactions.length > 0) {
									Portfolio.app.models.PortfolioCheckpoint.create({
										portfolioId: id, 
										transactionId: checkpointTransactionId, 
										cash: portfolio.cashCalculated
									}, function(err, portfolioCheckpoint) {
										//create holding checkpoints
										_.each(portfolio.holdings, function(portfolioHolding) {
											Portfolio.app.models.PortfolioHolding.create({
												portfolioId: id, 
												checkpointTransactionId: checkpointTransactionId, 
												name: portfolioHolding.name,
												ticker: portfolioHolding.ticker,
												shares: portfolioHolding.shares, 
												cost: portfolioHolding.cost
											}, function(err) {
												if (err) { console.error(err); }
											});
										});

										if (cb) cb(null, portfolio);
									});
								}
								else {
									if (cb) cb(null, portfolio);
								}
							});
						});					
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
			returns: {arg: 'portfolio', type: 'Object'}
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

			ticker = ticker.toUpperCase();

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

				Portfolio.app.models.PortfolioTransaction.create({
					portfolioId: id, 
					ticker: ticker, 
					count: count, 
					cost: cost
				}, function(err, portfolioTransaction) {
					if (err) {
						if (cb) cb(err);
					}

					if (cb) {
						Portfolio.value(id, function(err, portfolio) {
							cb(err, portfolio); 
						});
					}

					return;
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

			ticker = ticker.toUpperCase();

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

				Portfolio.app.models.PortfolioTransaction.create({
					portfolioId: id, 
					ticker: ticker, 
					count: count * -1, 
					cost: cost
				}, function(err, portfolioTransaction) {
					if (err) {
						if (cb) cb(err);
					}

					if (cb) {
						Portfolio.value(id, function(err, portfolio) {
							cb(err, portfolio); 
						});
					}

					return;
				});
			});
		});
	}

	Portfolio.remoteMethod(
		'sell', 
		{
			http: {path: '/:id/sell', verb: 'put'},
			accepts: [{arg: 'id', type: 'number'}, {arg: 'ticker', type: 'string'}, {arg: 'count', type: 'number'}],
			returns: {arg: 'portfolio', type: 'object'}
		}
	);
};
