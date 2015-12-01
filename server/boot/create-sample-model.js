module.exports = function(app) {

	app.models.Portfolio.create([
		{name: "Testing Total Return", cash: 15000}
	], function(err, portfolios) {
    	if (err) throw err;

		app.models.PortfolioTransaction.create([
			{portfolioId: portfolios[0].id, 
			 ticker: "NEWR", 
			 count: 65, 
			 cost: 65 * 33.20},
			{portfolioId: portfolios[0].id, 
			 ticker: "FEYE", 
			 count: 80, 
			 cost: 80 * 30.46},
			{portfolioId: portfolios[0].id, 
			 ticker: "WDAY", 
			 count: 25, 
			 cost: 25 * 79.39},
			{portfolioId: portfolios[0].id, 
			 ticker: "WDAY", 
			 count: 20, 
			 cost: 20 * 74.82}

		], function(err, portfolioTransactions) {
	    	if (err) throw err;
		});
	});

}
