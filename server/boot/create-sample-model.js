module.exports = function(app) {

	app.models.Portfolio.create([
		{id: 1, name: "My Practice Portfolio", cash: 0},
		{id: 2, name: "Things I'm Watching", cash:0}
	]);

	app.models.PortfolioHolding.create({portfolioId:1, ticker: "AAPL", shares: 1});
	app.models.PortfolioHolding.create({portfolioId:1, ticker: "MSFT", shares: 2});
	app.models.PortfolioHolding.create({portfolioId:1, ticker: "YHOO", shares: 3});
	//adjust cash because of strange race condition with above
	app.models.Portfolio.findById(1, function(err, portfolio) { 
		portfolio.cash = 10000; 
		portfolio.save(); 
		app.models.PortfolioHolding.find({where: {portfolioId: portfolio.id}}, function(err, portfolioHoldings) { 
			for (var i = 0; i < portfolioHoldings.length; i++) {
				portfolio.cash = Math.round(100 * portfolio.cash - 100 * portfolioHoldings[i].shares * 123.45) / 100;
			}
			portfolio.save(); 
		});
	});

	app.models.PortfolioHolding.create({portfolioId:2, ticker: "GOOG", shares: 1});
	app.models.PortfolioHolding.create({portfolioId:2, ticker: "IBM", shares: 2});
	//adjust cash because of strange race condition with above
	app.models.Portfolio.findById(2, function(err, portfolio) { 
		portfolio.cash = 10000; 
		portfolio.save(); 
		app.models.PortfolioHolding.find({where: {portfolioId: portfolio.id}}, function(err, portfolioHoldings) { 
			for (var i = 0; i < portfolioHoldings.length; i++) {
				portfolio.cash = Math.round(100 * portfolio.cash - 100 * portfolioHoldings[i].shares * 123.45) / 100;
			}
			portfolio.save(); 
		});
	});
}
