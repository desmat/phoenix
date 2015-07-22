var request = require('request');

module.exports = function(PortfolioHolding) {

	PortfolioHolding.observe('before save', function(ctx, next) {

		var ticker = ctx.instance ? ctx.instance.ticker : ctx.data.ticker;
		var url = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22' + ticker + '%22)%0A%09%09&format=json&diagnostics=false&env=http%3A%2F%2Fdatatables.org%2Falltables.env';
		request(url, function(err, resp, body) {
			if (err) { console.error(err); return; }

			var data = JSON.parse(body);
			var name =  data.query.results.quote.Name;

			if (!name) { console.error("Ticker not found: " + ticker); next(); return }

			var price = parseFloat(data.query.results.quote.LastTradePriceOnly);

			if (ctx.instance) {
				//new
				ctx.instance.name = name;
				ctx.instance.bookValue = Math.round(100 * price * ctx.instance.shares) / 100;
				ctx.Model.app.models.Portfolio.addRemCash(ctx.instance.portfolioId, -ctx.instance.bookValue);
			} else {
				//existing
				var prevBookValue = ctx.data.bookValue;
				ctx.data.bookValue = Math.round(100 * price * ctx.data.shares) / 100;

				ctx.Model.app.models.Portfolio.addRemCash(ctx.data.portfolioId, prevBookValue - ctx.data.bookValue);
			}

			next();

		});
			

	});

	PortfolioHolding.observe('before delete', function(ctx, next) {
		ctx.Model.app.models.PortfolioHolding.findById(ctx.instance.id, function(err, prevPortfolioHolding) {
			if (err) { console.error(err); return; }

			var ticker = ctx.instance.ticker;
			var url = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22' + ticker + '%22)%0A%09%09&format=json&diagnostics=false&env=http%3A%2F%2Fdatatables.org%2Falltables.env';
			request(url, function(err, resp, body) {
				if (err) { console.error(err); return; }

				var data = JSON.parse(body);
				var price = parseFloat(data.query.results.quote.LastTradePriceOnly);

				ctx.Model.app.models.Portfolio.addRemCash(ctx.instance.portfolioId, price * prevPortfolioHolding.shares);

				next();
			});
		});
	});
};
