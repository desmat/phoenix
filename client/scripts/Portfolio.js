var Portfolio = React.createClass({
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
				<li>portfolio: <b>{this.props.name}</b> <a href='#' onClick={this.delete}>[Delete]</a> <a href='#' onClick={this.rename}>[Rename]</a></li>
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
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({name:name}),
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
		_.findWhere(this.state.data, {id:id}).name=name;
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
					<Portfolio name={portfolio.name} id={portfolio.id} data={self.state.data} deletePortfolio={self.deletePortfolio} renamePortfolio={self.renamePortfolio} />
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
				<PortfolioList />
			</div>
		);
	}	
})
