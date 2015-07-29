var Portfolio = React.createClass({
	view: function() {
		this.props.viewPortfolio(this.props.id);
	}, 

	delete: function() {
		this.props.deletePortfolio(this.props.id);
	}, 

	rename: function() {
		var name = window.prompt("Rename Portfolio",this.props.name);
		if (name) {	
			this.props.renamePortfolio(this.props.id, name);
		}
	}, 

	render: function() {
		return (
			<div className="portfolio">
				<li>{this.props.name} <a href='#' onClick={this.view}>[View]</a> <a href='#' onClick={this.delete}>[Delete]</a> <a href='#' onClick={this.rename}>[Rename]</a></li>
			</div>
		);
	}
});

var PortfolioList = React.createClass({
	addPortfolio: function() {
		var name = window.prompt("New Portfolio","My Portfolio");
		if (name) {
			this.setState({data: this.state.data.concat({name:name, id:0})}); //id will be updated later

			$.ajax({
				url: '/api/portfolios/',
				dataType: 'json',
				method: 'PUT',
				contentType: 'application/json',
				data: JSON.stringify({name:name, cash:10000}),
				cache: false,
				success: function(data) {
					//update new portfolio's id
					_.findWhere(this.state.data, {id: 0, name: name}).id=data.id;
					this.setState({data: this.state.data});
				}.bind(this),
				error: function(xhr, status, err) {
					console.error(this.props.url, status, err.toString());
				}.bind(this)
			});
		}
	}, 

	deletePortfolio: function(id) {
		var portfolios = _.difference(this.state.data, _.where(this.state.data, {id:id}));
		this.setState({data: portfolios});

		$.ajax({
			url: '/api/portfolios/' + id,
			dataType: 'json',
			method: 'DELETE',
			cache: false,
			success: function(data) {
				//already deleted on the front-end
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	},

	renamePortfolio: function(id, name) {
		var portfolio = _.findWhere(this.state.data, {id:id});
		if (portfolio) {
			portfolio.name=name;
			this.setState({data: this.state.data});

			$.ajax({
				url: '/api/portfolios/' + id,
				dataType: 'json',
				method: 'PUT',
				contentType: 'application/json',
				data: JSON.stringify({name:name}),
				cache: false,
				success: function(data) {
					//already deleted on the front-end
				}.bind(this),
				error: function(xhr, status, err) {
					console.error(this.props.url, status, err.toString());
				}.bind(this)
			});
		}
	},

	viewPortfolio: function(id) {
		var portfolio = _.findWhere(this.state.data, {id: id});
		if (portfolio) {
			React.render(
				<PortfolioDetails data={portfolio} />,
		  	  	document.body
			);
		}
	},

	getInitialState: function() {
		return {data: []};
	},	

	componentDidMount: function() {
		$.ajax({
			url: '/api/portfolios/',
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.setState({data: data});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	},

	render: function() {
		var self = this;
		var portfolios = [];
		if (this.state.data) {
			var portfolios = this.state.data.map(function(portfolio) {
				return (
					<Portfolio name={portfolio.name} id={portfolio.id} data={self.state.data} deletePortfolio={self.deletePortfolio} renamePortfolio={self.renamePortfolio} viewPortfolio={self.viewPortfolio} />
				);
			});
		}

		return (
			<div className="portfolioList">
				<ul>
					{portfolios}
				</ul>
				<a href='#' id="addButton" onClick={this.addPortfolio}>[Add]</a>
			</div>
		);
	}
});

var PortfolioListContainer = React.createClass({
	render: function() {
		return(
			<div class="portfolioListContainer">
				<h1>Portfolios</h1>
				<PortfolioList />
			</div>
		);
	}	
});

var PortfolioHolding = React.createClass({
	buy: function() {
		this.props.buyHolding(this.props.data.ticker);
	},

	sell: function() {
		this.props.sellHolding(this.props.data.ticker);
	},

	render : function() {
		return (
			<li>{this.props.data.name} ({this.props.data.ticker}): {this.props.data.shares} shares, ${this.props.data.cost} cost <a href="#" onClick={this.sell}>[Sell]</a> <a href="#" onClick={this.buy}>[Buy]</a></li>
		);
	}
})

var PortfolioDetails = React.createClass({
	getInitialState: function() {
		return {holdings: []};
	},

	updatePortfolio: function(portfolio) {
		//render main
		this.props.data = portfolio;
		React.render(
			<PortfolioDetails data={this.props.data} />,
		  	document.body
		);
		//render holdings
		this.setState({holdings: portfolio.holdings});
	},

	fetchAndUpdatePortfolio: function(portfolioId) {
		var self = this;
		$.ajax({
			url: '/api/portfolios/' + this.props.data.id + '/value',
			dataType: 'json',
			cache: false,
			success: function(data) {
				//console.dir(data);
				self.updatePortfolio(data.portfolio);
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	},

	componentDidMount: function() {
		this.fetchAndUpdatePortfolio(this.props.data.id);
	},

	back: function() {
		React.render(
			<PortfolioListContainer />,
		  	document.body
		);
	}, 

	addHolding: function() {
		var ticker = window.prompt("Ticker");
		if (ticker) {
			this.buyHolding(ticker);
		}
	},

	buyHolding: function(ticker) {
		ticker = ticker.toUpperCase();
		var self = this;

		$.ajax({
			url: '/api/portfolios/' + this.props.data.id + '/buy',
			dataType: 'json',
			method: 'PUT',
			contentType: 'application/json',
			data: JSON.stringify({ticker: ticker, count: 1}),
			cache: false,
			success: function(data) {	
				self.fetchAndUpdatePortfolio(this.props.data.id);
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});			
	},

	sellHolding: function(ticker) {
		ticker = ticker.toUpperCase();
		var self = this;

		// var portfolioHolding = _.findWhere(this.state.holdings, {ticker: ticker});
		// //portfolio already contains this holding
		// if (portfolioHolding) {
		// 	portfolioHolding.shares = +portfolioHolding.shares -  1;			
		// 	if (portfolioHolding.shares <= 0) {
		// 		//remove portfolio from front-end
		// 		var portfolioHoldings = _.difference(this.state.holdings, _.where(this.state.holdings, {ticker:ticker}));
		// 		this.setState({holdings: portfolioHoldings});
		// 	}
		// }

		$.ajax({
			url: '/api/portfolios/' + this.props.data.id + '/sell',
			dataType: 'json',
			method: 'PUT',
			contentType: 'application/json',
			data: JSON.stringify({ticker: ticker, count: 1}),
			cache: false,
			success: function(data) {	
				console.log(data);
				//self.fetchAndUpdatePortfolio(this.props.data.id);
				self.updatePortfolio(data.portfolio);
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});				
	},

	render: function() {		
		var self = this;
		var holdings = _.sortBy(this.state.holdings, 'ticker').map(function(holding) {
			return (	
				<PortfolioHolding data={holding}  buyHolding={self.buyHolding} sellHolding={self.sellHolding}/>
			);
		});

		return(
			<div class="portfolioDetails">
				<h1>Portfolio: {this.props.data.name}</h1>
				<h2>Value: ${this.props.data.valueCalculated}</h2>
				<h2>Cash: ${this.props.data.cashCalculated}</h2>
				<h2>Holdings</h2>
				<ul>
					{holdings}
				</ul>
				<a href="#" onClick={this.back}>[Back]</a> <a href="#" onClick={this.addHolding}>[Add Holding]</a>
			</div>
		);
	}
})

// var portfolioId = 1;
// $.ajax({
// 	url: '/api/portfolios/' + portfolioId,
// 	dataType: 'json',
// 	cache: false,
// 	success: function(data) {
// 		React.render(
// 			<PortfolioDetails data={data} />,
// 		  	document.body
// 		);
// 	}.bind(this),
// 	error: function(xhr, status, err) {
// 		console.error(this.props.url, status, err.toString());
// 	}.bind(this)
// });

React.render(
	<PortfolioListContainer />,
  	document.body
);

