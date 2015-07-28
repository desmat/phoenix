var request = require('request');
var Quotes = require('quotes');

module.exports = function(PortfolioHolding) {

	// PortfolioHolding.observe('before save', function(ctx, next) {

	// 	var ticker = ctx.instance ? ctx.instance.ticker : ctx.data.ticker;
	// 	Quotes.getQuote(ticker, function(err, quote) {
	// 		if (err) { console.error(err); return next() };

	// 		var name =  quote.Name;
	// 		var price = parseFloat(quote.LastTradePriceOnly);
	// 		var portfolioId;
	// 		var cashDiff;

	// 		if (ctx.instance) {
	// 			//new
	// 			ctx.instance.name = name;
	// 			ctx.instance.cost = Math.round(100 * price * ctx.instance.shares) / 100;
	// 			ctx.Model.app.models.Portfolio.addRemCash(ctx.instance.portfolioId, -ctx.instance.cost, function() { next() });
	// 		} else {
	// 			//existing
	// 			var prevCost = ctx.data.cost;
	// 			ctx.data.cost = Math.round(100 * price * ctx.data.shares) / 100;
	// 			ctx.Model.app.models.Portfolio.addRemCash(ctx.data.portfolioId, prevCost - ctx.data.cost, function() { next() });
	// 		}
	// 	});
	// });

	// PortfolioHolding.observe('before delete', function(ctx, next) {
	// 	ctx.Model.app.models.PortfolioHolding.findById(ctx.instance.id, function(err, prevPortfolioHolding) {
	// 		if (err) { console.error(err); return next() };

	// 		var ticker = ctx.instance.ticker;
	// 		Quotes.getQuote(ticker, function(err, quote) {
	// 			if (err) { console.error(err); return next() };

	// 			var price = parseFloat(quote.LastTradePriceOnly);
	// 			ctx.Model.app.models.Portfolio.addRemCash(ctx.instance.portfolioId, price * prevPortfolioHolding.shares, function() { next() });
	// 		});
	// 	});
	// });
};
