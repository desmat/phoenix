module.exports = function(app) {

	app.models.Portfolio.create([
		{name: "My Practice Portfolio", cash: 10000},
		{name: "Things I'm Watching", cash: 10000}
	], function(err, portfolios) {
    	if (err) throw err;

		app.models.PortfolioHolding.create({portfolioId: portfolios[0].id, ticker: "AAPL", shares: 1});
		app.models.PortfolioHolding.create({portfolioId: portfolios[0].id, ticker: "MSFT", shares: 2});
		app.models.PortfolioHolding.create({portfolioId: portfolios[0].id, ticker: "YHOO", shares: 3});
		app.models.PortfolioHolding.create({portfolioId: portfolios[1].id, ticker: "GOOG", shares: 1});
		app.models.PortfolioHolding.create({portfolioId: portfolios[1].id, ticker: "IBM", shares: 2});
	});
}
