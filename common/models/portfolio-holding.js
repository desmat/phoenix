var request = require('request');
var Quotes = require('quotes');

module.exports = function(PortfolioHolding) {

	//IMPORTANT NOTE: THIS IS NOT SUPPORTED WITH MYSQL
	PortfolioHolding.validatesUniquenessOf('checkpointTransactionId', {message: 'checkpointTransactionId already exists'});

};
