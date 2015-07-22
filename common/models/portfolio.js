var request = require('request');

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

	Portfolio.value = function(id, cb) {
		Portfolio.findById(id, function(err, portfolio) {
			Portfolio.app.models.PortfolioHolding.find({where: {portfolioId: id}}, function(err, portfolioHoldings) {

				if (!portfolioHoldings || portfolioHoldings.length == 0) { if (cb) cb(null, portfolio.value); return; }

				var tickersToQuery = '';
				for (var i = 0; i < portfolioHoldings.length; i++) {
					tickersToQuery += '%22' + portfolioHoldings[i].ticker + '%22' + '%2C';
				}
				tickersToQuery = tickersToQuery.substring(0, tickersToQuery.length - 3)

				var tickerPrices = [];

				var url = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(' + tickersToQuery + ')%0A%09%09&format=json&diagnostics=false&env=http%3A%2F%2Fdatatables.org%2Falltables.env';
				request(url, function(err, resp, body) {
					if (err) { console.error(err); return; }

					var data = JSON.parse(body);
					if (data.query.count === 1) {
						tickerPrices[data.query.results.quote.Symbol] = parseFloat(data.query.results.quote.LastTradePriceOnly);
					}
					else {
						for (var i = 0; i < data.query.results.quote.length; i++) {
							tickerPrices[data.query.results.quote[i].Symbol] = parseFloat(data.query.results.quote[i].LastTradePriceOnly);
						}
					}

					portfolio.value = portfolio.cash;
					for (var i = 0; i < portfolioHoldings.length; i++) {
						portfolio.value = Math.round(100 * portfolio.value + 100 * portfolioHoldings[i].shares * tickerPrices[portfolioHoldings[i].ticker]) / 100;
					}

					portfolio.save(); 

					if (cb) cb(null, portfolio.value);
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
