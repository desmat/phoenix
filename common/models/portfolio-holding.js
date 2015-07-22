module.exports = function(PortfolioHolding) {

	PortfolioHolding.observe('before save', function(ctx, next) {
		if (ctx.instance) {
			//new
			ctx.instance.bookValue = Math.round(100 * 123.45 * ctx.instance.shares) / 100;
			ctx.Model.app.models.Portfolio.addRemCash(ctx.instance.portfolioId, -ctx.instance.bookValue);
		} else {
			//existing
			var prevBookValue = ctx.data.bookValue;
			ctx.data.bookValue = Math.round(100 * 123.45 * ctx.data.shares) / 100;

			ctx.Model.app.models.Portfolio.addRemCash(ctx.data.portfolioId, prevBookValue - ctx.data.bookValue);
		}
		next();
	});

	PortfolioHolding.observe('before delete', function(ctx, next) {
		ctx.Model.app.models.PortfolioHolding.findById(ctx.instance.id, function(err, prevPortfolioHolding) {
			if (err) { console.log(err); return; }
			ctx.Model.app.models.Portfolio.addRemCash(ctx.instance.portfolioId, 123.45 * prevPortfolioHolding.shares);
		});
		next();
	});
};
