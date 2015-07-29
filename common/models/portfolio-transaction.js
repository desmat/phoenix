module.exports = function(PortfolioTransaction) {

	PortfolioTransaction.observe('before save', function setRejectedToFalse(ctx, next) {
		var portfolioTransaction = ctx.instance ? ctx.instance : ctx.data;

		if (portfolioTransaction && (typeof portfolioTransaction.rejected == 'undefined')) {
			portfolioTransaction.rejected = false;
		}

		next();
	});
};
