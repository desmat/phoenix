module.exports = function(app) {

	app.models.Portfolio.create([
		{name: "My Practice Portfolio", cash: 10000},
		{name: "Things I'm Watching", cash: 10000}
	], function(err, portfolios) {
    	if (err) throw err;

		app.models.Portfolio.buy(portfolios[0].id, "AAPL", 1);
		app.models.Portfolio.buy(portfolios[0].id, "MSFT", 2);
		app.models.Portfolio.buy(portfolios[0].id, "YHOO", 3);
		app.models.Portfolio.buy(portfolios[1].id, "GOOG", 1);
		app.models.Portfolio.buy(portfolios[1].id, "IBM", 2);
	});

}
